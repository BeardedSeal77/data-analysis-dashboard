
###############################################################################
# HDPSA BIN381 – Full Data Cleaning & Analysis Pipeline
# Author: Llewellyn Fourie
# Date: Sys.Date()
# Tasks Covered: 3A (Simple Cleanup), 2 (Analysis), 3B (Advanced Cleanup)
###############################################################################

suppressPackageStartupMessages({
  library(tidyverse)
  library(janitor)
  library(readr)
  library(naniar)
  library(ggplot2)
  library(mice)
  library(FSelectorRcpp)
  library(FactoMineR)
  library(factoextra)
  library(corrplot)
  library(Hmisc)
  library(knitr)
})

theme_set(theme_minimal())

###############################################################################
# 0. PATH SETUP
###############################################################################

# Primary raw-data path (as provided by user)
base_path <- "E:/data-analysis-dashboard/02_Project/Data/01_Raw"

# Fallbacks in case you're running on a different machine
if (!dir.exists(base_path)) {
  cand_dirs <- c(
    file.path(getwd(), "Data/01_Raw"),
    file.path(getwd(), "../Data/01_Raw"),
    file.path(getwd(), "../../Data/01_Raw"),
    file.path(getwd(), "02_Project/Data/01_Raw"),
    file.path(getwd(), "../02_Project/Data/01_Raw")
  )
  existing <- cand_dirs[dir.exists(cand_dirs)]
  if (length(existing) == 0) {
    stop(paste0("Could not locate raw data folder. Tried: ", paste(c(base_path, cand_dirs), collapse=" | ")))
  } else {
    base_path <- existing[1]
    message("Using fallback base_path: ", base_path)
  }
}

outputs_root <- "02_Project/Milestone_2"

subfolders <- c(
  "Task_03A_Simple_Cleanup/cleaned",
  "Task_03A_Simple_Cleanup/logs",
  "Task_03A_Simple_Cleanup/visuals",
  "Task_02_Analysis/correlation",
  "Task_02_Analysis/significance",
  "Task_02_Analysis/pca",
  "Task_02_Analysis/importance",
  "Task_02_Analysis/selection",
  "Task_03B_Advanced_Cleanup/cleaned_final",
  "Task_03B_Advanced_Cleanup/logs",
  "Task_03B_Advanced_Cleanup/imputed",
  "Task_03B_Advanced_Cleanup/visuals"
)

for (sf in subfolders) dir.create(file.path(outputs_root, sf), recursive = TRUE, showWarnings = FALSE)

###############################################################################
# 1. TASK 3A: SIMPLE CLEANUP
###############################################################################

# Helper functions -------------------------------------------------------------
Mode <- function(x) {
  ux <- unique(x[!is.na(x)])
  if (length(ux) == 0) return(NA)
  ux[which.max(tabulate(match(x, ux)))]
}

cap_outliers <- function(x, lower = 0.01, upper = 0.99) {
  if (is.numeric(x)) {
    q <- quantile(x, probs = c(lower, upper), na.rm = TRUE)
    x <- pmin(pmax(x, q[1]), q[2])
  }
  x
}

# try to safely coerce numeric-looking character columns
coerce_numeric_safely <- function(df) {
  for (nm in names(df)) {
    col <- df[[nm]]
    if (is.character(col)) {
      # only digits, decimal point, minus sign allowed (and NA)
      looks_numeric <- all(is.na(col) | grepl("^[-]?\\d+(?:[.]\\d+)?$", col))
      if (looks_numeric) {
        suppressWarnings(df[[nm]] <- as.numeric(col))
      }
    }
  }
  df
}

clean_simple <- function(df, dataset_name) {
  log_entries <- list()

  # Standardize field names first
  df <- clean_names(df)

  # Drop completely empty fields
  empty_cols <- names(df)[colSums(!is.na(df)) == 0]
  df <- df %>% select(-any_of(empty_cols))
  log_entries[["dropped_empty"]] <- empty_cols

  # Remove duplicate rows
  before <- nrow(df)
  df <- distinct(df)
  after <- nrow(df)
  log_entries[["duplicates_removed"]] <- before - after

  # Convert obvious numeric fields
  df <- coerce_numeric_safely(df)

  # Handle obvious outliers (cap at 1st/99th percentile)
  df <- df %>% mutate(across(where(is.numeric), cap_outliers))

  # Basic missing value imputation
  df <- df %>%
    mutate(across(where(is.character), ~ ifelse(is.na(.x) | .x %in% c("", "NA", "N/A", "Refused"), Mode(.x), .x))) %>%
    mutate(across(where(is.numeric), ~ ifelse(is.na(.x), median(.x, na.rm = TRUE), .x)))

  # Save outputs
  cleaned_path <- file.path(outputs_root, "Task_03A_Simple_Cleanup/cleaned", paste0(dataset_name, "_cleaned.csv"))
  readr::write_csv(df, cleaned_path)

  # Log summary
  log_tbl <- tibble::tibble(
    action = names(log_entries),
    details = sapply(log_entries, function(x) paste0(collapse = ", ", x))
  )
  log_path <- file.path(outputs_root, "Task_03A_Simple_Cleanup/logs", paste0(dataset_name, "_log.csv"))
  readr::write_csv(log_tbl, log_path)

  return(df)
}

# Load all raw datasets
csv_files <- list.files(base_path, pattern = "\\.csv$", full.names = TRUE)
if (length(csv_files) == 0) stop(paste0("No CSV files found in: ", base_path))
datasets <- purrr::map(csv_files, ~ readr::read_csv(.x, show_col_types = FALSE))
names(datasets) <- tools::file_path_sans_ext(basename(csv_files))

# Apply simple cleanup
cleaned_datasets <- purrr::map2(datasets, names(datasets), clean_simple)

###############################################################################
# 2. TASK 2: FULL ANALYSIS ON CLEAN DATA
###############################################################################

analyze_dataset <- function(df, dataset_name) {
  # Correlation analysis (numeric only)
  num_df <- df %>% select(where(is.numeric))
  if (ncol(num_df) > 1) {
    corr_mat <- suppressWarnings(cor(num_df, use = "pairwise.complete.obs"))
    png(file.path(outputs_root, "Task_02_Analysis/correlation", paste0(dataset_name, "_corr.png")),
        width = 1000, height = 800)
    corrplot::corrplot(corr_mat, method = "color", type = "upper", tl.cex = 0.7, number.cex = 0.7)
    dev.off()
    readr::write_csv(as.data.frame(corr_mat),
                     file.path(outputs_root, "Task_02_Analysis/correlation", paste0(dataset_name, "_corr_matrix.csv")))
  }

  # Statistical significance tests (ANOVA: numeric ~ categorical)
  sig_out <- list()
  if (ncol(num_df) > 0) {
    cat_vars <- df %>% select(where(~ is.character(.x) || is.factor(.x))) %>% names()
    for (num_col in names(num_df)) {
      for (cat_col in cat_vars) {
        if (dplyr::n_distinct(df[[cat_col]]) > 1) {
          res <- tryCatch({
            summary(aov(df[[num_col]] ~ as.factor(df[[cat_col]])))
          }, error=function(e) NULL)
          if (!is.null(res)) sig_out[[paste(num_col, "vs", cat_col)]] <- capture.output(print(res))
        }
      }
    }
  }
  if (length(sig_out) > 0) {
    sink(file.path(outputs_root, "Task_02_Analysis/significance", paste0(dataset_name, "_anova.txt")))
    for (nm in names(sig_out)) {
      cat("==== ", nm, " ====\n")
      cat(paste(sig_out[[nm]], collapse = "\n"), "\n\n")
    }
    sink()
  }

  # PCA (numeric only)
  if (ncol(num_df) > 2) {
    pca_res <- FactoMineR::PCA(num_df, graph = FALSE)
    png(file.path(outputs_root, "Task_02_Analysis/pca", paste0(dataset_name, "_pca.png")),
        width = 1000, height = 800)
    print(factoextra::fviz_pca_var(pca_res, col.var = "contrib") + ggtitle(paste("PCA -", dataset_name)))
    dev.off()
    saveRDS(pca_res, file.path(outputs_root, "Task_02_Analysis/pca", paste0(dataset_name, "_pca.rds")))
  }

  # Feature importance (information gain uses a target; choose the most numeric-looking target 'value' if present)
  if ("value" %in% names(df) && ncol(df) > 1) {
    # Build a simple supervised table excluding rows with NA in target
    tmp <- df %>% select(-any_of(c("ci_low","ci_high"))) %>%
      mutate(across(where(is.character), as.factor)) %>%
      filter(!is.na(value))
    if (nrow(tmp) > 0) {
      imp <- tryCatch(FSelectorRcpp::information_gain(value ~ ., data = tmp), error=function(e) NULL)
      if (!is.null(imp)) {
        readr::write_csv(as.data.frame(imp),
                         file.path(outputs_root, "Task_02_Analysis/importance", paste0(dataset_name, "_importance.csv")))
      }
    }
  }

  # Selection criteria (keep/drop decisions) — simple rule using missingness
  criteria <- tibble::tibble(
    variable = names(df),
    missing_pct = sapply(df, function(x) mean(is.na(x))),
    unique_vals = sapply(df, dplyr::n_distinct),
    recommended = dplyr::if_else(sapply(df, function(x) mean(is.na(x))) > 0.5, "drop", "keep")
  )
  readr::write_csv(criteria, file.path(outputs_root, "Task_02_Analysis/selection", paste0(dataset_name, "_selection.csv")))
}

purrr::map2(cleaned_datasets, names(cleaned_datasets), analyze_dataset)

###############################################################################
# 3. TASK 3B: ADVANCED CLEANUP
###############################################################################

clean_advanced <- function(df, dataset_name) {
  log_entries <- list()

  # Load selection criteria from Task 2
  criteria_path <- file.path(outputs_root, "Task_02_Analysis/selection", paste0(dataset_name, "_selection.csv"))
  if (!file.exists(criteria_path)) stop("Selection criteria not found for ", dataset_name, ": ", criteria_path)
  criteria <- readr::read_csv(criteria_path, show_col_types = FALSE)
  drop_vars <- criteria %>% dplyr::filter(recommended == "drop") %>% dplyr::pull(variable)
  df <- df %>% dplyr::select(-dplyr::any_of(drop_vars))
  log_entries[["fields_dropped"]] <- drop_vars

  # Advanced imputation with MICE (numeric only)
  num_df <- df %>% dplyr::select(where(is.numeric))
  if (any(sapply(num_df, function(x) any(is.na(x))))) {
    set.seed(381)
    imp <- tryCatch(mice::mice(num_df, m = 3, method = "pmm", maxit = 10, printFlag = FALSE), error=function(e) NULL)
    if (!is.null(imp)) {
      df[names(num_df)] <- mice::complete(imp)
      log_entries[["imputation"]] <- "MICE (PMM)"
    } else {
      df <- df %>% dplyr::mutate(across(where(is.numeric), ~ ifelse(is.na(.x), mean(.x, na.rm = TRUE), .x)))
      log_entries[["imputation"]] <- "Mean fallback"
    }
  }

  # Refined outlier handling (optional: winsorization already applied in 3A; here we can z-score trim if needed)
  # Example (commented out by default):
  # zcap <- function(v, z = 3) { m <- mean(v,na.rm=TRUE); s <- sd(v,na.rm=TRUE); pmin(pmax(v, m - z*s), m + z*s) }
  # df <- df %>% mutate(across(where(is.numeric), zcap))

  # Save outputs
  cleaned_path <- file.path(outputs_root, "Task_03B_Advanced_Cleanup/cleaned_final", paste0(dataset_name, "_final.csv"))
  readr::write_csv(df, cleaned_path)

  log_tbl <- tibble::tibble(
    action = names(log_entries),
    details = sapply(log_entries, function(x) paste0(collapse = ", ", x))
  )
  log_path <- file.path(outputs_root, "Task_03B_Advanced_Cleanup/logs", paste0(dataset_name, "_adv_log.csv"))
  readr::write_csv(log_tbl, log_path)

  return(df)
}

final_datasets <- purrr::map2(cleaned_datasets, names(cleaned_datasets), clean_advanced)

cat("Pipeline complete: Task 3A → Task 2 → Task 3B finished for ", length(final_datasets), " datasets\n")
###############################################################################
