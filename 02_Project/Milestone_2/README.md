# Milestone 2 — Data Preparation

[GitHub Repository](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Milestone_2)

Scope: Prepare final analysis dataset(s) from raw CSVs — cleaning, feature selection/engineering, transformations, and train/validation/test splits per CRISP-DM Phase 3.

## Tasks & Artifacts

- Milestone brief: `02_Project/Milestone_2/Milestone_2.md`
- Task 01: `02_Project/Milestone_2/Task_01/Task_01.md`
- Task 02 (Quality, Selection, Transform):
  - `02_Project/Milestone_2/Task_02/Task_02.Rmd`
  - Outputs: `02_Project/Milestone_2/Task_02/outputs/` (correlations, quality summaries, rankings, etc.)
- Task 03 (Cleaned datasets): `02_Project/Milestone_2/Task_03/cleaned_final/*.csv`
- Task 04 (Feature Engineering):
  - `02_Project/Milestone_2/Task_04/Task_04.Rmd`
  - `02_Project/Milestone_2/Task_04/Task_04_Feature_Engineering_Guide.md`
  - HTML report: `02_Project/Milestone_2/Task_04/Task_04.html`
- Group docs: `02_Project/Milestone_2/Milestone_2_Group_Contribution_Report.md`, `02_Project/Milestone_2/Milestone_2.pdf`

## Final Report

[**BIN381 Group A Milestone 2 Report (PDF)**](https://github.com/BeardedSeal77/data-analysis-dashboard/blob/main/02_Project/Milestone_2/BIN381_Group_A_Milestone_2.pdf)

## Data Lake Structure

- [Raw Data](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Data/01_Raw)
- [Cleaned Data](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Data/02_Cleaned)
- [Scaled/Features](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Data/03_Scaled)
- [Train/Val/Test Splits](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Data/04_Split) (`train_data.csv`, `val_data.csv`, `test_data.csv`)

## Summary

- Assessed data quality; standardized, imputed where required; selected relevant attributes.
- Engineered features and produced consistent, documented transformations.
- Produced train/validation/test splits for downstream modeling.

## Reproducibility

- Install R packages: `Rscript install_packages.R`
- Run/knit: `02_Project/Milestone_2/Task_02/Task_02.Rmd` and `02_Project/Milestone_2/Task_04/Task_04.Rmd`
- Resulting CSVs are saved under [Cleaned Data](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Data/02_Cleaned), [Scaled Data](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Data/03_Scaled) and final splits under [Split Data](https://github.com/BeardedSeal77/data-analysis-dashboard/tree/main/02_Project/Data/04_Split)

