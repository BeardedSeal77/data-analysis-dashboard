# Milestone 2 — Data Preparation

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

## Data Lake Structure

- Raw: `02_Project/Data/01_Raw/`
- Cleaned: `02_Project/Data/02_Cleaned/`
- Scaled/Features: `02_Project/Data/03_Scaled/`
- Splits: `02_Project/Data/04_Split/` (`train_data.csv`, `val_data.csv`, `test_data.csv`)

## Summary

- Assessed data quality; standardized, imputed where required; selected relevant attributes.
- Engineered features and produced consistent, documented transformations.
- Produced train/validation/test splits for downstream modeling.

## Reproducibility

- Install R packages: `Rscript install_packages.R`
- Run/knit: `02_Project/Milestone_2/Task_02/Task_02.Rmd` and `02_Project/Milestone_2/Task_04/Task_04.Rmd`
- Resulting CSVs are saved under `02_Project/Data/02_Cleaned/`, `02_Project/Data/03_Scaled/` and final splits under `02_Project/Data/04_Split/`

