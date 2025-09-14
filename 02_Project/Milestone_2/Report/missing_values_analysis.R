# ==============================
# HDPSA BIN381 — Task 1: Missing Values Analysis & Imputation (R-only)
# Portable version (auto-paths) + robust interpolation + MissMech MCAR
# With safe MICE fallback to median + organised outputs
# ==============================

# -------- Packages --------
req_pkgs <- c(
  "tidyverse","readr","janitor","skimr",
  "naniar","visdat","VIM","UpSetR",
  "mice","randomForest","imputeTS","MissMech","DescTools","patchwork"
)
new_pkgs <- setdiff(req_pkgs, rownames(installed.packages()))
if (length(new_pkgs)) install.packages(new_pkgs, dependencies = TRUE)
invisible(lapply(req_pkgs, library, character.only = TRUE))

# -------- Paths (portable) --------
get_script_dir <- function(){
  if (!is.null(sys.frame(1)$ofile)) return(dirname(normalizePath(sys.frame(1)$ofile)))
  if (!is.null(attr(body(function(){}), "srcref"))) return(getwd())
  getwd()
}
script_dir <- get_script_dir()

cand_dirs <- c(
  file.path(script_dir, "01_Raw"),
  file.path(script_dir, "../Data/01_Raw"),
  file.path(script_dir, "../../Data/01_Raw")
)
existing <- cand_dirs[file.exists(cand_dirs)]
if (length(existing) == 0) {
  stop("Could not find a '01_Raw' folder near the script. Update 'cand_dirs' or set data_dir manually.")
}
data_dir <- normalizePath(existing[1])

out_dir  <- file.path(script_dir, "outputs")
if (!dir.exists(out_dir)) dir.create(out_dir, recursive = TRUE)

# Create subfolders for organisation
subdirs <- c("cleaned", "imputed", "visuals", "distributions", "logs", "mcar_tests")
for (sd in subdirs){
  dir.create(file.path(out_dir, sd), showWarnings = FALSE, recursive = TRUE)
}

message("Using data dir: ", data_dir)
message("Outputs will be written to: ", out_dir)

# -------- Files --------
files <- list.files(data_dir, pattern = "\\.csv$", full.names = FALSE)
if (!length(files)) stop("No CSV files found in ", data_dir)

# -------- Helper functions --------
read_hdpsa <- function(fp){
  readr::read_csv(fp, show_col_types = FALSE) |>
    janitor::clean_names()
}

guess_time_col <- function(df){
  cand <- intersect(names(df), c("year","survey_year","surveyyear","yr"))
  if (length(cand)) cand[[1]] else NA_character_
}

is_percentish <- function(x){
  if (!is.numeric(x)) return(FALSE)
  rng <- range(x, na.rm = TRUE)
  is.finite(rng[1]) && is.finite(rng[2]) && rng[1] >= -2 && rng[2] <= 102
}

Mode <- function(x){
  ux <- unique(x)
  ux[which.max(tabulate(match(x, ux)))]
}

safe_interpolate <- function(x){
  if (is.numeric(x) && sum(!is.na(x)) >= 2) imputeTS::na_interpolation(x, option = "linear") else x
}

clamp01 <- function(x){ if (is.numeric(x)) pmin(pmax(x, 0), 100) else x }

apply_special_missing <- function(df, dict){
  for (col in names(dict)){
    if (!col %in% names(df)) next
    miss_vals <- dict[[col]]
    if (is.character(df[[col]])){
      for (mv in miss_vals){
        df[[col]] <- dplyr::na_if(df[[col]], mv)
      }
    } else if (is.numeric(df[[col]])){
      df[[col]][df[[col]] %in% miss_vals] <- NA
    }
  }
  df
}

missing_summary <- function(df, dataset){
  s_var <- naniar::miss_var_summary(df) |>
    dplyr::mutate(dataset = dataset)
  s_case <- naniar::miss_case_summary(df) |>
    dplyr::mutate(dataset = dataset)
  list(vars = s_var, cases = s_case)
}

decide_strategy <- function(vec, time_col_present = FALSE){
  if (is.numeric(vec)){
    if (is_percentish(vec) && time_col_present){
      return(list(method = "imputeTS_interpolation", params = list(rule = "linear")))
    } else {
      return(list(method = "mice_pmm_or_median", params = list()))
    }
  } else if (is.factor(vec) || is.character(vec)){
    return(list(method = "mode_or_unknown", params = list(add_unknown = TRUE)))
  } else {
    return(list(method = "leave_as_is", params = list()))
  }
}

impute_dataset <- function(df, dataset_name){
  time_col <- guess_time_col(df)
  time_present <- !is.na(time_col)

  df <- df |>
    dplyr::mutate(dplyr::across(
      where(is.character),
      ~ { x <- trimws(.x); x <- dplyr::na_if(x, ""); dplyr::na_if(x, "NA") }
    ))

  plan <- purrr::imap_dfr(df, function(col, nm){
    st <- decide_strategy(col, time_present)
    tibble::tibble(variable = nm, method = st$method)
  }) |>
    dplyr::mutate(dataset = dataset_name, .before = 1)

  df_cat <- df
  for (nm in names(df_cat)){
    if (is.character(df_cat[[nm]]) || is.factor(df_cat[[nm]])){
      if (any(is.na(df_cat[[nm]]))){
        m <- Mode(df_cat[[nm]][!is.na(df_cat[[nm]])])
        if (is.na(m)) m <- "Unknown"
        df_cat[[nm]][is.na(df_cat[[nm]])] <- m
      }
      df_cat[[nm]] <- as.factor(df_cat[[nm]])
    }
  }

  df_ts <- df_cat
  if (time_present){
    keys <- names(df_ts)[sapply(df_ts, function(x)!is.numeric(x))]
    keys <- setdiff(keys, time_col)
    numeric_cols <- names(df_ts)[sapply(df_ts, is.numeric)]
    exclude_cols <- grep("(id$|_id$|code$|_code$|_order$|^order$|^level_rank$|^precision$|_count$)",
                         numeric_cols, ignore.case = TRUE, value = TRUE)
    cand_cols <- setdiff(numeric_cols, exclude_cols)
    cand_cols <- cand_cols[sapply(cand_cols, function(nm) is_percentish(df_ts[[nm]]))]

    if (length(keys)) {
      grp <- interaction(df_ts[keys], drop = TRUE, lex.order = TRUE)
    } else {
      grp <- factor(1L)
    }

    ord <- order(grp, df_ts[[time_col]])
    df_ts <- df_ts[ord, , drop = FALSE]
    grp <- grp[ord]

    for (nm in cand_cols){
      df_ts[[nm]] <- ave(df_ts[[nm]], grp, FUN = function(v){ clamp01(safe_interpolate(v)) })
    }

    inv_ord <- order(ord)
    df_ts <- df_ts[inv_ord, , drop = FALSE]
  }

  # Safe MICE with fallback to median
  needs_mice <- sapply(df_ts, function(x) is.numeric(x) && any(is.na(x)))
  if (any(needs_mice)){
    mice_df <- df_ts[, needs_mice, drop=FALSE]
    set.seed(381)
    imp <- tryCatch(
      mice::mice(mice_df, m = 3, method = "pmm", maxit = 10, printFlag = FALSE),
      error = function(e) NULL
    )
    if (!is.null(imp)){
      mice_completed <- mice::complete(imp, action = "long") |>
        dplyr::group_by(.id) |>
        dplyr::summarise(dplyr::across(where(is.numeric), ~ median(.x, na.rm = TRUE)), .groups="drop")
      mice_df$.id <- seq_len(nrow(mice_df))
      mice_completed <- mice_completed[order(mice_completed$.id), ]
      mice_df <- mice_df[order(mice_df$.id), ]
      for (nm in setdiff(names(mice_completed), ".id")){
        df_ts[[nm]][needs_mice[names(needs_mice) == nm]] <- mice_completed[[nm]]
      }
    } else {
      for (nm in names(mice_df)){
        med <- median(mice_df[[nm]], na.rm = TRUE)
        df_ts[[nm]][is.na(df_ts[[nm]])] <- med
      }
    }
  }

  imputed_counts <- purrr::imap_dfr(df, function(col, nm){
    before_na <- sum(is.na(col))
    after_na  <- sum(is.na(df_ts[[nm]]))
    tibble::tibble(variable = nm, before_na = before_na, after_na = after_na,
                   imputed = max(before_na - after_na, 0))
  }) |>
    dplyr::mutate(dataset = dataset_name, .before = 1)

  list(data = df_ts, plan = plan, log = imputed_counts)
}

special_missing_dict <- list(
  toilet_type = c("99","999","-1","Don't know","Unknown","Refused"),
  water_source = c("99","999","-1","Unknown","Refused"),
  condom_use_last_time = c("Don't know","Refused","NA","99"),
  vaccine_coverage_pct = c(-1, 999, 9999),
  literacy_rate_pct = c(-1, 999, 9999)
)

all_var_summaries <- list()
all_case_summaries <- list()
all_plans <- list()
all_logs <- list()

for (f in files){
  fpath <- file.path(data_dir, f)
  if (!file.exists(fpath)){
    message("File not found, skipping: ", fpath)
    next
  }
  message("Processing: ", f)

  df_raw <- read_hdpsa(fpath)

  df0 <- df_raw |>
    dplyr::mutate(dplyr::across(
      where(is.character),
      ~ { x <- trimws(.x); x <- dplyr::na_if(x, ""); dplyr::na_if(x, "NA") }
    ))
  df0 <- apply_special_missing(df0, special_missing_dict)

  readr::write_csv(df0, file.path(out_dir, "cleaned", gsub(".csv","_clean.csv", f)))

  s <- missing_summary(df0, dataset = f)
  all_var_summaries[[f]]  <- s$vars
  all_case_summaries[[f]] <- s$cases

  p1 <- naniar::gg_miss_var(df0) + ggplot2::labs(title = paste("Missingness by Variable —", f))
  ggplot2::ggsave(file.path(out_dir, "visuals", gsub(".csv","_miss_var.png", f)), p1, width = 10, height = 6, dpi = 200)

  p2 <- naniar::vis_miss(df0) + ggplot2::labs(title = paste("Missingness Heatmap —", f))
  ggplot2::ggsave(file.path(out_dir, "visuals", gsub(".csv","_miss_heatmap.png", f)), p2, width = 10, height = 6, dpi = 200)

  if (ncol(df0) <= 35){
    p3 <- tryCatch(naniar::gg_miss_upset(df0) + ggplot2::labs(title = paste("Missingness Pattern (UpSet) —", f)),
                   error = function(e) NULL)
    if (!is.null(p3)){
      ggplot2::ggsave(file.path(out_dir, "visuals", gsub(".csv","_miss_upset.png", f)), p3, width = 10, height = 6, dpi = 200)
    }
  }

  num_df <- dplyr::select(df0, dplyr::where(is.numeric))
  if (ncol(num_df) >= 2){
    mcar_out <- tryCatch(MissMech::TestMCARNormality(as.data.frame(num_df)), error = function(e) NULL)
    if (!is.null(mcar_out)) capture.output(print(mcar_out), file = file.path(out_dir, "mcar_tests", gsub(".csv","_mcar_test.txt", f)))
  }

  imp <- impute_dataset(df0, dataset_name = f)
  df_imp <- imp$data
  plan   <- imp$plan
  logdf  <- imp$log

  all_plans[[f]] <- plan
  all_logs[[f]]  <- logdf

  readr::write_csv(df_imp, file.path(out_dir, "imputed", gsub(".csv","_imputed.csv", f)))

  num_names <- names(df0)[sapply(df0, is.numeric)]
  if (length(num_names)){
    for (nm in num_names){
      before <- df0[[nm]]
      after  <- df_imp[[nm]]
      df_plot <- tibble::tibble(
        value = c(before, after),
        state = rep(c("Before","After"), each = length(before))
      )
      p_den <- ggplot2::ggplot(df_plot, ggplot2::aes(x = value, linetype = state)) +
        ggplot2::geom_density(na.rm = TRUE) +
        ggplot2::labs(title = paste("Distribution Before vs After Imputation —", f, "::", nm),
                      x = nm, y = "Density")
      ggplot2::ggsave(file.path(out_dir, "distributions", paste0(gsub(".csv","", f), "_dist_", nm, ".png")),
                      p_den, width = 9, height = 5, dpi = 200)
    }
  }
}

var_summ <- if (length(all_var_summaries)) dplyr::bind_rows(all_var_summaries) else tibble()
case_summ <- if (length(all_case_summaries)) dplyr::bind_rows(all_case_summaries) else tibble()
plan_all  <- if (length(all_plans)) dplyr::bind_rows(all_plans) else tibble()
log_all   <- if (length(all_logs)) dplyr::bind_rows(all_logs) else tibble()

readr::write_csv(var_summ, file.path(out_dir, "logs", "missingness_by_variable_all.csv"))
readr::write_csv(case_summ, file.path(out_dir, "logs", "missingness_by_case_all.csv"))
readr::write_csv(plan_all,  file.path(out_dir, "logs", "imputation_plan_all.csv"))
readr::write_csv(log_all,   file.path(out_dir, "logs", "imputation_log_all.csv"))

message("Done. See the organised 'outputs' folder for CSVs, logs, and PNGs. Knit the Rmd next for a polished report.")