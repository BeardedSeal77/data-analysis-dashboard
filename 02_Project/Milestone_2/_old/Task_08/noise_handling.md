#  Task 8 — Data Noise & Special Values Handling

This README documents the **Noise & Special Values Handling** process for **BIN381 Milestone 2 (Task 8)**. It explains the motivation, methodology, R script implementation, outputs, and how to interpret results.

---

##  Goal

To identify and correct **data noise** (errors, inconsistencies) and handle **special placeholder values** (e.g., `99`, `-1`, `Don’t Know`, `Refused`) across the 13 HDPSA datasets. This step ensures the datasets are consistent, free from miscoded values, and ready for imputation and modelling.

---

##  What is Data Noise?

* **Noise** = irregularities that don’t represent real data. Examples:

  * Impossible values (e.g., literacy rate > 100%).
  * Negative values where only positives make sense.
  * Inconsistent encodings (`M/F` vs `Male/Female`).
  * Duplicated IDs.

* **Special values** = placeholders that survey designers use instead of blanks. Examples:

  * `-1`, `99`, `999`, `9999`.
  * `Don’t Know`, `Refused`, `Unknown`.
  * These are *not true observations* and must be treated.

---

##  Implementation

All logic is automated in **`noise_handling.R`**. The script:

1. **Reads Input:**

   * Pulls Task 1 cleaned datasets from:

     ```
     E:/data-analysis-dashboard/02_Project/Milestone_2/Task_01/outputs/cleaned/
     ```

2. **Creates Outputs:** (relative to script’s location)

   ```
   outputs/
   ├── noise_cleaned/     # Datasets after noise handling
   ├── noise_logs/        # Noise log documenting issues + fixes
   ├── noise_visuals/     # Before-treatment bar charts of categories
   └── special_values/    # Frequency tables of special codes per dataset
   ```

3. **Detection:**

   * Uses `noise_detection()` to scan each dataset for:

     * Special values in categorical columns (via dictionary).
     * Negative numeric values.
     * Values >100 in percentage-like variables.

4. **Treatment:**

   * Replaces special values with `NA`.
   * Clamps percentages >100 to 100.
   * Converts negatives to `NA`.
   * Standardises column names using `janitor::clean_names()`.

5. **Logging:**

   * Writes `noise_log.csv` with dataset, variable, issue, action, rationale.
   * Saves special values counts per dataset in `special_values/`.
   * Saves “before noise handling” bar charts in `noise_visuals/`.

6. **Outputs Cleaned Data:**

   * Stores processed datasets in `noise_cleaned/` with `_clean_noise.csv` suffix.

---

##  Example Workflow

**Raw dataset:** `child-mortality-rates_national_zaf.csv`

* Contains 41 rows × 29 columns.
* Already fairly clean, no `-1` or `99` placeholders.

**Task 1 Cleaned dataset:**

* Columns standardised to lowercase snake\_case.
* Missing codes converted to `NA` where possible.

**Task 8 Noise-cleaned dataset example:** `child-mortality-rates_national_zaf_clean_clean_noise.csv`

* Same shape (41 × 29).
* Checked for impossible values (none found).
* Confirmed no special placeholders remained.
* Logged in `noise_log.csv` as “no issues”.

---

##  Noise Log Structure

Each row in `noise_log.csv` documents a detected issue:

| Dataset      | Variable      | Issue                   | Action        | Rationale            |
| ------------ | ------------- | ----------------------- | ------------- | -------------------- |
| hiv-behavior | condom\_use   | Special values: Refused | Convert to NA | Refusal ≠ valid data |
| literacy     | gender        | Encoded as M/F          | Standardise   | Consistency          |
| immunization | coverage\_pct | Values >100%            | Clamp to 100  | Logical maximum      |

---

##  Benefits

* Ensures **clean, standardised inputs** for imputation and modelling.
* Prevents bias from miscoded values (e.g., treating “Refused” as 0).
* Creates **transparent audit trail** of all corrections.
* Visuals and frequency tables allow easy reporting of what was fixed.

---

##  Next Steps

* Use `noise_cleaned/` datasets as input to **Task 6 Imputation**.
* Reference `noise_log.csv` in Milestone 2 report to justify treatment decisions.
* Optionally extend visuals to show **before vs after** comparisons.

---

In summary: Task 8 acts as the **quality gate**. It polishes cleaned datasets, removes miscoded entries, and documents every fix. The result is a robust foundation for correlation analysis, outlier detection, and predictive modelling.
