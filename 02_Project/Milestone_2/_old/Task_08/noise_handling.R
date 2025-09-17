# ==============================
# HDPSA BIN381 — Task 8: Data Noise & Special Values Handling
# ==============================

# -------- Packages --------
req_pkgs <- c("tidyverse","janitor","skimr","naniar")
new_pkgs <- setdiff(req_pkgs, rownames(installed.packages()))
if (length(new_pkgs)) install.packages(new_pkgs, dependencies = TRUE)
invisible(lapply(req_pkgs, library, character.only = TRUE))

# Explicitly load to satisfy VS Code language server
library(tibble)
library(dplyr)
library(ggplot2)

# -------- Paths (portable) --------
get_script_dir <- function(){
  if (!is.null(sys.frame(1)$ofile)) return(dirname(normalizePath(sys.frame(1)$ofile)))
  if (!is.null(attr(body(function(){}), "srcref"))) return(getwd())
  getwd()
}
script_dir <- get_script_dir()

# Input = Task 1 cleaned datasets (fixed path)
input_dir <- "E:/data-analysis-dashboard/02_Project/Milestone_2/Task_01/outputs/cleaned"
if (!dir.exists(input_dir)) stop("Task 1 cleaned data not found at: ", input_dir)

# Output = always relative to this script
out_dir  <- file.path(script_dir, "outputs")
subdirs <- c("noise_cleaned","noise_logs","noise_visuals","special_values")
for (sd in subdirs){
  dir.create(file.path(out_dir, sd), showWarnings = FALSE, recursive = TRUE)
}

message("Using input: ", input_dir)
message("Outputs will be written to: ", out_dir)

# -------- Helper Functions --------

# Dictionary of known special values / noise encodings
special_values_dict <- list(
  generic = c("-1","99","999","9999","NA","N/A","Don’t Know","Don't Know","Refused","Unknown")
)

# Detect potential noise
noise_detection <- function(df, dataset){
  issues <- list()

  # Scan for special values in character/factor
  for (nm in names(df)){
    col <- df[[nm]]
    if (is.character(col) || is.factor(col)){
      vals <- unique(col)
      specials <- intersect(vals, special_values_dict$generic)
      if (length(specials)){
        issues[[length(issues)+1]] <- tibble(
          dataset = dataset,
          variable = nm,
          issue = paste("Special values:", paste(specials, collapse=",")),
          action = "Convert to NA",
          rationale = "Standardising placeholders"
        )
      }
    }
    if (is.numeric(col)){
      if (any(col < 0, na.rm = TRUE)){
        issues[[length(issues)+1]] <- tibble(
          dataset = dataset,
          variable = nm,
          issue = "Negative values detected",
          action = "Investigate / set to NA",
          rationale = "Impossible value for this indicator"
        )
      }
      if (any(col > 100, na.rm = TRUE) && !is.na(mean(col, na.rm = TRUE)) && mean(col, na.rm = TRUE) <= 100) {
        issues[[length(issues)+1]] <- tibble(
          dataset = dataset,
          variable = nm,
          issue = "Values >100%",
          action = "Clamp to 100",
          rationale = "Logical maximum"
        )
      }
    }
  }

  if (length(issues)) bind_rows(issues) else tibble()
}

# Apply treatments
noise_treatment <- function(df){
  df_out <- df

  # Convert known specials to NA
  df_out <- df_out %>% mutate(across(where(is.character), ~ ifelse(.x %in% special_values_dict$generic, NA, .x)))

  # Clamp percentages >100
  df_out <- df_out %>% mutate(across(where(is.numeric), ~ ifelse(.x > 100, 100, .x)))

  # Replace negative numeric with NA
  df_out <- df_out %>% mutate(across(where(is.numeric), ~ ifelse(.x < 0, NA, .x)))

  df_out
}

# -------- Main Loop --------

all_logs <- list()
files <- list.files(input_dir, pattern = "*.csv", full.names = FALSE)

for (f in files){
  message("Processing: ", f)

  df <- readr::read_csv(file.path(input_dir, f), show_col_types = FALSE) %>%
    janitor::clean_names()

  # Detect noise issues
  issues <- noise_detection(df, f)
  if (nrow(issues)){
    all_logs[[f]] <- issues
  }

  # Save frequency of special values
  specials_count <- naniar::miss_scan_count(df, search = special_values_dict$generic)
  readr::write_csv(specials_count, file.path(out_dir, "special_values", gsub(".csv","_special_values.csv", f)))

  # Plot categorical distributions before treatment
  cat_cols <- names(df)[sapply(df, function(x) is.character(x) || is.factor(x))]
  if (length(cat_cols)){
    for (col in cat_cols){
      p <- ggplot(df, aes(x = .data[[col]])) +
        geom_bar(fill="steelblue") +
        theme(axis.text.x = element_text(angle=45,hjust=1)) +
        labs(title = paste("Distribution before noise handling:", f, col))
      ggsave(file.path(out_dir, "noise_visuals", paste0(gsub(".csv","",f),"_",col,"_before.png")), p, width=8, height=5)
    }
  }

  # Apply treatment
  df_clean <- noise_treatment(df)

  # Save cleaned dataset
  readr::write_csv(df_clean, file.path(out_dir, "noise_cleaned", gsub(".csv","_clean_noise.csv", f)))
}

# Combine logs
if (length(all_logs)){
  noise_log <- bind_rows(all_logs)
  readr::write_csv(noise_log, file.path(out_dir, "noise_logs", "noise_log.csv"))
}

message("Task 8 complete. Check 'outputs/' for results.")