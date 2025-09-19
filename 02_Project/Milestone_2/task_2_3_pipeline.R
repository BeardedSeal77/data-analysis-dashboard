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
  library(forcats)
})

theme_set(theme_minimal())

###############################################################################
# Helper functions
###############################################################################

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

coerce_numeric_safely <- function(df) {
  for (nm in names(df)) {
    col <- df[[nm]]
    if (is.character(col)) {
      looks_numeric <- all(is.na(col) | grepl("^[-]?\\d+(?:[.]\\d+)?$", col))
      if (looks_numeric) suppressWarnings(df[[nm]] <- as.numeric(col))
    }
  }
  df
}

process_categoricals <- function(df, log_entries) {
  cat_vars <- names(df)[sapply(df, function(x) is.character(x) || is.factor(x))]
  for (col in cat_vars) {
    df[[col]] <- as.factor(df[[col]])
    if (nlevels(df[[col]]) <= 1) {
      df[[col]] <- NULL
      log_entries[[paste0("dropped_single_level_", col)]] <- "Only one level"
    }
  }
  list(df = df, log_entries = log_entries)
}

fix_standard_fields <- function(df, log_entries) {
  # Change datatypes
  
  if ("value" %in% names(df)) {
    df$value <- suppressWarnings(as.numeric(df$value))
    log_entries[["value_type"]] <- "Changed to numeric"
  }
  if ("denominator_weighted" %in% names(df)) {
    df$denominator_weighted <- as.character(df$denominator_weighted)
    log_entries[["denominator_weighted_type"]] <- "Changed to character"
  }
  if ("denominator_unweighted" %in% names(df)) {
    df$denominator_unweighted <- as.character(df$denominator_unweighted)
    log_entries[["denominator_unweighted_type"]] <- "Changed to character"
  }

  # Remove unwanted columns
  drop_cols <- intersect(
    c("indicator_order", "precision", "characteristic_order", 
      "is_total", "survey_year_label"),
    names(df)
  )
  if (length(drop_cols) > 0) {
    df <- df %>% select(-any_of(drop_cols))
    log_entries[["removed_columns"]] <- paste(drop_cols, collapse = ", ")
  }

  list(df = df, log_entries = log_entries)
}

###############################################################################
# 1. TASK 3A: SIMPLE CLEANUP
###############################################################################

clean_simple <- function(df, dataset_name) {
  log_entries <- list()

  # Remove row 1
  if (nrow(df) >= 1) {
    df <- df[-1, ]
    log_entries[["row_removed"]] <- "Row 1 removed"
  }

  # Standardize names
  df <- clean_names(df)

  # Drop "id" columns
  id_cols <- grep("id", names(df), ignore.case = TRUE, value = TRUE)
  if (length(id_cols) > 0) {
    df <- df %>% select(-any_of(id_cols))
    log_entries[["id_cols_removed"]] <- paste(id_cols, collapse = ", ")
  }

  # Drop empty columns
  empty_cols <- names(df)[colSums(!is.na(df)) == 0]
  df <- df %>% select(-any_of(empty_cols))
  log_entries[["dropped_empty"]] <- empty_cols

  # Remove duplicates
  before <- nrow(df); df <- distinct(df); after <- nrow(df)
  log_entries[["duplicates_removed"]] <- before - after

  # Numeric coercion
  df <- coerce_numeric_safely(df)

  # Convert categoricals
  res <- process_categoricals(df, log_entries)
  df <- res$df; log_entries <- res$log_entries

  # Apply standard fixes
  res2 <- fix_standard_fields(df, log_entries)
  df <- res2$df; log_entries <- res2$log_entries

  # Outlier capping
  df <- df %>% mutate(across(where(is.numeric), cap_outliers))

  # Simple imputation
  df <- df %>%
    mutate(across(where(is.factor), 
                  ~ fct_explicit_na(.x, na_level = as.character(Mode(as.character(.x)))))) %>%
    mutate(across(where(is.numeric), 
                  ~ ifelse(is.na(.x), median(.x, na.rm = TRUE), .x)))

  # Save
  cleaned_path <- file.path(outputs_root, "Task_03A_Simple_Cleanup/cleaned", paste0(dataset_name, "_cleaned.csv"))
  write_csv(df, cleaned_path)

  log_tbl <- tibble(action = names(log_entries), 
                    details = sapply(log_entries, function(x) paste0(collapse = ", ", x)))
  log_path <- file.path(outputs_root, "Task_03A_Simple_Cleanup/logs", paste0(dataset_name, "_log.csv"))
  write_csv(log_tbl, log_path)

  return(df)
}

###############################################################################
# 2. TASK 2: FULL ANALYSIS
###############################################################################

analyze_dataset <- function(df, dataset_name) {
  # Correlation (numeric only)
  num_df <- df %>% select(where(is.numeric))
  if (ncol(num_df) > 1) {
    corr_mat <- suppressWarnings(cor(num_df, use = "pairwise.complete.obs"))
    png(file.path(outputs_root, "Task_02_Analysis/correlation", paste0(dataset_name, "_corr.png")), 
        width = 1000, height = 800)
    corrplot(corr_mat, method = "color", type = "upper", tl.cex = 0.7, number.cex = 0.7)
    dev.off()
    write_csv(as.data.frame(corr_mat), 
              file.path(outputs_root, "Task_02_Analysis/correlation", paste0(dataset_name, "_corr_matrix.csv")))
  }

  # ANOVA significance tests
  sig_out <- list()
  if (ncol(num_df) > 0) {
    cat_vars <- df %>% select(where(~ is.factor(.x))) %>% names()
    for (num_col in names(num_df)) {
      for (cat_col in cat_vars) {
        if (dplyr::n_distinct(df[[cat_col]]) > 1) {
          res <- tryCatch({ summary(aov(df[[num_col]] ~ as.factor(df[[cat_col]]))) }, error=function(e) NULL)
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

  # PCA
  if (ncol(num_df) > 2) {
    pca_res <- FactoMineR::PCA(num_df, graph = FALSE)
    png(file.path(outputs_root, "Task_02_Analysis/pca", paste0(dataset_name, "_pca.png")), width = 1000, height = 800)
    print(factoextra::fviz_pca_var(pca_res, col.var = "contrib") + ggtitle(paste("PCA -", dataset_name)))
    dev.off()
    saveRDS(pca_res, file.path(outputs_root, "Task_02_Analysis/pca", paste0(dataset_name, "_pca.rds")))
  }

  # Feature importance (if "value" exists)
  if ("value" %in% names(df) && ncol(df) > 1) {
    tmp <- df %>% select(-any_of(c("ci_low","ci_high"))) %>%
      mutate(across(where(is.factor), as.factor)) %>%
      filter(!is.na(value))
    if (nrow(tmp) > 0) {
      imp <- tryCatch(information_gain(value ~ ., data = tmp), error=function(e) NULL)
      if (!is.null(imp)) {
        write_csv(as.data.frame(imp),
                  file.path(outputs_root, "Task_02_Analysis/importance", paste0(dataset_name, "_importance.csv")))
      }
    }
  }

  # Selection criteria
  criteria <- tibble(
    variable = names(df),
    missing_pct = sapply(df, function(x) mean(is.na(x))),
    unique_vals = sapply(df, n_distinct),
    recommended = if_else(sapply(df, function(x) mean(is.na(x))) > 0.5, "drop", "keep")
  )
  write_csv(criteria, file.path(outputs_root, "Task_02_Analysis/selection", paste0(dataset_name, "_selection.csv")))
}

###############################################################################
# 3. TASK 3B: ADVANCED CLEANUP
###############################################################################

clean_advanced <- function(df, dataset_name) {
  log_entries <- list()

  # Remove row 1
  if (nrow(df) >= 1) {
    df <- df[-1, ]
    log_entries[["row_removed"]] <- "Row 1 removed"
  }

  # Drop id columns
  id_cols <- grep("id", names(df), ignore.case = TRUE, value = TRUE)
  if (length(id_cols) > 0) {
    df <- df %>% select(-any_of(id_cols))
    log_entries[["id_cols_removed"]] <- paste(id_cols, collapse = ", ")
  }

  # Apply standard fixes
  res2 <- fix_standard_fields(df, log_entries)
  df <- res2$df; log_entries <- res2$log_entries

  # Advanced imputation
  num_df <- df %>% select(where(is.numeric))
  if (any(sapply(num_df, function(x) any(is.na(x))))) {
    set.seed(381)
    imp <- tryCatch(mice(num_df, m = 3, method = "pmm", maxit = 10, printFlag = FALSE), error=function(e) NULL)
    if (!is.null(imp)) {
      df[names(num_df)] <- complete(imp)
      log_entries[["imputation"]] <- "MICE (PMM)"
    } else {
      df <- df %>% mutate(across(where(is.numeric), ~ ifelse(is.na(.x), mean(.x, na.rm = TRUE), .x)))
      log_entries[["imputation"]] <- "Mean fallback"
    }
  }

  # Convert categoricals
  res <- process_categoricals(df, log_entries)
  df <- res$df; log_entries <- res$log_entries

  # Save
  cleaned_path <- file.path(outputs_root, "Task_03B_Advanced_Cleanup/cleaned_final", paste0(dataset_name, "_final.csv"))
  write_csv(df, cleaned_path)

  log_tbl <- tibble(action = names(log_entries), 
                    details = sapply(log_entries, function(x) paste0(collapse = ", ", x)))
  log_path <- file.path(outputs_root, "Task_03B_Advanced_Cleanup/logs", paste0(dataset_name, "_adv_log.csv"))
  write_csv(log_tbl, log_path)

  return(df)
}

###############################################################################
# RUN PIPELINE
###############################################################################

base_path <- "E:/data-analysis-dashboard/02_Project/Data/01_Raw"
csv_files <- list.files(base_path, pattern = "\\.csv$", full.names = TRUE)
if (length(csv_files) == 0) stop(paste0("No CSV files found in: ", base_path))

datasets <- map(csv_files, ~ read_csv(.x, show_col_types = FALSE))
names(datasets) <- tools::file_path_sans_ext(basename(csv_files))

cleaned_datasets <- map2(datasets, names(datasets), clean_simple)
map2(cleaned_datasets, names(cleaned_datasets), analyze_dataset)
final_datasets <- map2(cleaned_datasets, names(cleaned_datasets), clean_advanced)

cat("Pipeline complete: Task 3A → Task 2 → Task 3B finished for ", length(final_datasets), " datasets\n")
###############################################################################
