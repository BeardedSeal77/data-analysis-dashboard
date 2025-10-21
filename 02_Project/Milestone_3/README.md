# Milestone 3 — Modeling

Scope: Model selection, test design, model building, and assessment per CRISP-DM Phase 4.

## Tasks & Artifacts

- Milestone brief: `02_Project/Milestone_3/Milestone_3.md`
- Task 01 — Select Modeling Technique:
  - `02_Project/Milestone_3/Task_01/task_01.Rmd`, `02_Project/Milestone_3/Task_01/Task_01.md`
- Task 02 — Generate Test Design:
  - `02_Project/Milestone_3/Task_02/Task_02.Rmd`, `02_Project/Milestone_3/Task_02/Task_02.md`
- Task 03 — Build & Assess Model:
  - `02_Project/Milestone_3/Task_03/Task_03.Rmd`
  - Outputs: `02_Project/Milestone_3/Task_03/outputs/` (e.g., `final_random_forest_model.rds`, `mtry_tuning.csv`, `nodesize_tuning.csv`, `ntree_tuning.csv`)
- Compiled docs: `02_Project/Milestone_3/BIN381_Milestone_3.rmd`, `.docx`, `.html`
- R package hints: `02_Project/Milestone_3/requirements.txt`

## Summary

- Selected Random Forest regression for predicting a log-scaled health index.
- Defined robust train/validation/test procedures.
- Trained, tuned, and assessed the final model; exported artifacts for later evaluation and deployment planning.

## Reproducibility

- Install R packages (as needed): see `02_Project/Milestone_3/requirements.txt`
- Knit: `02_Project/Milestone_3/Task_03/Task_03.Rmd`
- Evaluate with ML API later via `02_Project/api/` endpoints using `02_Project/Data/04_Split/{val,test}_data.csv`

