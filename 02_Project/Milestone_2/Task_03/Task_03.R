###############################################################################
# HDPSA BIN381 – Unified Data Cleaning Pipeline 
# Author: Llewellyn Fourie
# Date: Sys.Date()
###############################################################################

suppressPackageStartupMessages({
  library(tidyverse)
  library(janitor)
  library(readr)
  library(mice)
  library(knitr)
})

theme_set(theme_minimal())

###############################################################################
# 0. PATH SETUP
###############################################################################

base_path <- "E:/data-analysis-dashboard/02_Project/Data/01_Raw"

if (!dir.exists(base_path)) {
  cand_dirs <- c(
    file.path(getwd(), "Data/01_Raw"),
    file.path(getwd(), "../Data/01_Raw"),
    file.path(getwd(), "../../Data/01_Raw"),
    file.path(getwd(), "02_Project/Data/01_Raw"),
    file.path(getwd(), "../02_Project/Data/01_Raw")
  )
  existing <- cand_dirs[dir.exists(cand_dirs)]
  if (length(existing) == 0) stop("Could not locate raw data folder")
  base_path <- existing[1]
  message("Using fallback base_path: ", base_path)
}

outputs_root <- "02_Project/Milestone_2"
subfolders <- c(
  "Task_03_Cleanup/cleaned_final",
  "Task_03_Cleanup/logs",
  "Task_03_Cleanup/visuals"
)
for (sf in subfolders) dir.create(file.path(outputs_root, sf), recursive = TRUE, showWarnings = FALSE)

###############################################################################
# 0.1 CURATED SELECTION
###############################################################################

keep_datasets <- c(
  "access-to-health-care_national_zaf",
  "immunization_national_zaf",
  "hiv-behavior_national_zaf",
  "water_national_zaf",
  "dhs-quickstats_national_zaf",
  "toilet-facilities_national_zaf",
  "child-mortality-rates_national_zaf"
)

drop_datasets <- c(
  "maternal-mortality_national_zaf",
  "anthropometry_national_zaf",
  "covid-19-prevention_national_zaf",
  "symptoms-of-acute-respiratory-infection-ari_national_zaf",
  "iycf_national_zaf",
  "literacy_national_zaf"
)

keep_fields <- c(
  "value","data_id",
  "by_variable_id","precision","characteristic_order","indicator_order",
  "indicator","indicator_type","characteristic_category",
  "denominator_unweighted","is_preferred"
)

drop_fields <- c(
  "region_id","level_rank","ci_low","ci_high","by_variable_label",
  "survey_year_label","denominator_weighted",
  "characteristic_id","characteristic_label",
  "country_name","iso3",
  "survey_year","is_total",
  "dhs_country_code","sdrid","survey_id","survey_type",
  "indicator_id"
)

###############################################################################
# 1. MERGED CLEANUP FUNCTION
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

clean_dataset <- function(df, dataset_name) {
  log_entries <- list()

  # === NEW STEP: Drop first row ===
  if (nrow(df) > 0) {
    df <- df[-1, , drop = FALSE]
    log_entries[["first_row_removed"]] <- TRUE
  }

  # Standardize field names
  df <- clean_names(df)

  # Drop bad/redundant fields
  df <- df %>% select(-any_of(drop_fields))

  # Keep only curated fields
  df <- df %>% select(any_of(keep_fields))

  # Drop completely empty cols
  empty_cols <- names(df)[colSums(!is.na(df)) == 0]
  df <- df %>% select(-any_of(empty_cols))
  log_entries[["dropped_empty"]] <- empty_cols

  # Drop duplicates
  before <- nrow(df); df <- distinct(df); after <- nrow(df)
  log_entries[["duplicates_removed"]] <- before - after

  # Coerce numeric-looking character columns
  df <- coerce_numeric_safely(df)

  # Handle outliers
  df <- df %>% mutate(across(where(is.numeric), cap_outliers))

  # Light imputation (mode/median)
  df <- df %>%
    mutate(across(where(is.character), ~ ifelse(is.na(.x)|.x %in% c("","NA","N/A","Refused"), Mode(.x), .x))) %>%
    mutate(across(where(is.numeric), ~ ifelse(is.na(.x), median(.x,na.rm=TRUE), .x)))

  # Advanced imputation (MICE) if any numeric still missing
  num_df <- df %>% select(where(is.numeric))
  if (any(sapply(num_df, function(x) any(is.na(x))))) {
    set.seed(381)
    imp <- tryCatch(mice::mice(num_df, m=3, method="pmm", maxit=10, printFlag=FALSE), error=function(e) NULL)
    if (!is.null(imp)) {
      df[names(num_df)] <- mice::complete(imp)
      log_entries[["imputation"]] <- "MICE (PMM)"
    } else {
      df <- df %>% mutate(across(where(is.numeric), ~ ifelse(is.na(.x), mean(.x, na.rm=TRUE), .x)))
      log_entries[["imputation"]] <- "Mean fallback"
    }
  }

  # Save outputs
  cleaned_path <- file.path(outputs_root,"Task_03_Cleanup/cleaned_final",paste0(dataset_name,"_final.csv"))
  readr::write_csv(df, cleaned_path)
  log_tbl <- tibble::tibble(action=names(log_entries), details=sapply(log_entries, paste, collapse=","))
  log_path <- file.path(outputs_root,"Task_03_Cleanup/logs",paste0(dataset_name,"_log.csv"))
  readr::write_csv(log_tbl, log_path)

  return(df)
}

###############################################################################
# 2. RUN PIPELINE
###############################################################################

csv_files_all <- list.files(base_path, pattern="\\.csv$", full.names=TRUE)
basenames <- tools::file_path_sans_ext(basename(csv_files_all))
csv_files <- csv_files_all[basenames %in% keep_datasets]
names(csv_files) <- tools::file_path_sans_ext(basename(csv_files))

datasets <- purrr::map(csv_files, ~ readr::read_csv(.x, show_col_types=FALSE))
final_datasets <- purrr::imap(datasets, ~ clean_dataset(.x, .y))

cat("Pipeline complete: merged cleanup (with first row dropped) finished for", length(final_datasets), "datasets\n")
###############################################################################
