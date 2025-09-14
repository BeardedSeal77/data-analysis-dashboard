# BIN381 — Task 1 (R-only): Missing Values Analysis & Imputation

## What you got
- **missing_values_analysis.R** — end-to-end R pipeline to:
  - load all 13 HDPSA national ZAF CSVs
  - standardize special codes to `NA`
  - profile missingness (tables + visuals)
  - run Little’s MCAR test
  - build an imputation plan by variable type
  - impute (time-series interpolation, MICE PMM, mode)
  - export cleaned & imputed CSVs + logs + plots

- **missing_values_report.Rmd** — knit after running the script to produce a polished HTML report (with tables + embedded images).

## How to run
1. Put these files next to your CSVs (or edit `data_dir` in the R script).
2. Open R/RStudio and run:
   ```r
   source('missing_values_analysis.R')
   ```
3. After it finishes, knit the Rmd:
   ```r
   rmarkdown::render('missing_values_report.Rmd')
   ```

## Outputs
All artifacts go to `outputs/`:
- `*_clean.csv`, `*_imputed.csv`
- plots: `*_miss_var.png`, `*_miss_heatmap.png`, `*_miss_upset.png`, `*_dist_<var>.png`
- logs: `missingness_by_variable_all.csv`, `missingness_by_case_all.csv`, `imputation_plan_all.csv`, `imputation_log_all.csv`

## Customize special values
Edit `special_missing_dict` in the R script to add dataset-specific codes (e.g., `99`, `999`, `-1`, `Don't know`, `Refused`).

## Tips
- For very skewed numerics, consider replacing MICE PMM with median imputation in the script.
- If UpSet plots fail (too many columns), skip or increase RAM.
