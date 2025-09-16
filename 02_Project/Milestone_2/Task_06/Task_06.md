# Missing Values Analysis & Imputation — README

This README documents the structure, purpose, and outputs of the **Missing Values Analysis & Imputation pipeline** used in **BIN381 Milestone 2 (Task 6)**. It explains the role of the main R script and provides detailed descriptions of the generated files, subfolders, and plots.

---

## Main R Script

**File:** `missing_values_analysis.R`

**Purpose:** Automates missing values detection, treatment, and imputation for all 13 HDPSA national datasets located in `01_Raw/`.

### Key Functions:

* **Standardisation of missing values**: Converts blanks, special codes (e.g. `"99"`, `"999"`, `"Refused"`, `"NA"`) into proper `NA`s.
* **Missingness summaries**: Generates per-variable and per-case missingness statistics.
* **MCAR testing**: Runs `MissMech::TestMCARNormality` to check if missingness is random.
* **Imputation strategies**:

  * *Categorical variables*: mode imputation; adds an `Unknown` category if needed.
  * *Numeric percentages*: linear interpolation if time-series data is available.
  * *Other numeric variables*: MICE Predictive Mean Matching (fallback = median).
* **Logging & audit trail**: Saves strategy plans and imputation counts.
* **Visual diagnostics**: Exports plots showing missingness and imputation impact.

This ensures a **transparent, reproducible, and systematic approach** to missing data treatment.

---

## Outputs Directory Structure

All outputs are saved into organised subfolders under `outputs/`.

```
outputs/
├── cleaned/         # Standardised datasets with NA marked
├── imputed/         # Fully imputed datasets
├── visuals/         # Missingness plots (bar, heatmap, upset)
├── distributions/   # Before vs after imputation density plots
├── Rlogs/           # Summarised logs (CSV tables)
└── mcar_tests/      # MCAR diagnostic test results
```

---

### 1. `cleaned/`

* **Files:** `*_clean.csv`
* **Description:** Datasets after converting blanks and special codes into `NA`.
* **Use case:** For analysis where you want raw data with missing values clearly marked but not yet imputed.

### 2. `imputed/`

* **Files:** `*_imputed.csv`
* **Description:** Datasets with missing values imputed according to chosen strategy.
* **Use case:** Ready-to-use datasets for correlation analysis, feature importance, outlier detection, and modelling.

### 3. `visuals/`

* **Files:**

  * `*_miss_var.png` — Bar chart of % missing per variable.
  * `*_miss_heatmap.png` — Heatmap of missingness across observations.
  * `*_miss_upset.png` — UpSet plot of joint missingness across variables.
* **Use case:** Visual evidence of missingness patterns; useful for reporting and identifying systematic issues.

### 4. `distributions/`

* **Files:** `*_dist_<variable>.png`
* **Description:** Density plots comparing distributions before vs after imputation.
* **Use case:** Validates that imputation preserved the original distribution shape and avoided bias.

### 5. `Rlogs/`

* **Files:**

  * `missingness_by_variable_all.csv` — % missing per variable across all datasets.
  * `missingness_by_case_all.csv` — % missing per case across datasets.
  * `imputation_plan_all.csv` — Strategy assigned to each variable.
  * `imputation_log_all.csv` — Count of values imputed per variable.
* **Use case:** Provides an **audit trail** of how missing values were treated; essential for reproducibility and transparency.

### 6. `mcar_tests/`

* **Files:** `*_mcar_test.txt`
* **Description:** Results of MCAR diagnostic tests.
* **Use case:** Helps assess whether missingness is random (MCAR), systematic (MAR), or not random (MNAR). Guides further modelling assumptions.

---

## Graphs & Visualisations

The following diagnostics are generated to evaluate missingness and imputation impact:

1. **Missingness by Variable (bar chart)**

   * Y-axis: % of missing values.
   * X-axis: Variables, sorted by missingness.
   * Purpose: Highlights variables with the most missing data.

2. **Missingness Heatmap**

   * Rows: Cases (observations).
   * Columns: Variables.
   * Colour: Present vs missing values.
   * Purpose: Detects block patterns (e.g., whole sections missing for certain records).

3. **UpSet Plot of Missingness**

   * Shows intersections of variables that are missing together.
   * Purpose: Identifies non-random patterns of joint missingness.

4. **Before vs After Imputation (density plots)**

   * Overlays original vs imputed distributions.
   * Purpose: Confirms imputation preserves variable characteristics.

---

## Usage Recommendations

* **Check `Rlogs/` first** for an overview of missingness and imputation applied.
* **Use `cleaned/` datasets** for transparency when exploring raw NA distributions.
* **Use `imputed/` datasets** when conducting analyses that require complete data.
* **Review plots** in `visuals/` and `distributions/` to confirm imputation quality.
* **Consult `mcar_tests/`** to support claims about randomness of missingness in your report.

---

## Summary

This pipeline standardises and documents missing values treatment across all HDPSA datasets. The combination of:

* **audit logs**,
* **visual checks**, and
* **diagnostic tests**

ensures high data quality and full reproducibility for downstream correlation, feature selection, and modelling tasks in Milestone 2.
