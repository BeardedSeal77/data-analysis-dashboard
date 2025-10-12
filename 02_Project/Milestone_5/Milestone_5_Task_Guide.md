# Milestone 5 — Deployment Plan and Monitoring/ Maintenance (Concise Guide)

This guide tells you exactly what to do for Milestone 5, maps required inputs to prior milestones and data folders, and specifies minimal, compliant deliverables without overcomplicating the work.

Referenced briefs and context:
- Milestone brief (PDF): `02_Project/Milestone_5/Milestone_5.pdf`
- Milestone brief (MD): `02_Project/Milestone_5/Milestone_5.md`
- Prior milestones and evaluation: `02_Project/Milestone_3/Milestone_3.md`, `02_Project/Milestone_4/Milestone_4.md`, `02_Project/Milestone_4/Task_1.md`, `02_Project/Milestone_4/Task_2.md`, `02_Project/Milestone_4/Task_3.md`, `02_Project/Milestone_4/GroupA_Milestone_04.Rmd`
- Upcoming milestone for final packaging: `02_Project/Milestone_6/Milestone_6.pdf`, `02_Project/Milestone_6/Milestone_6.md`


## Scope (What Milestone 5 Requires)

Per the Milestone 5 brief, this milestone covers the first two tasks of CRISP-DM Deployment and a minimal model demo:
1) Plan Deployment — strategy, steps, deployment tool research/selection, and a basic user-facing demo.
2) Plan Monitoring and Maintenance — how to monitor usage, performance, drift, and when/how to retrain or retire.

Deliverables for Milestone 5:
- Deployment and Maintenance Plan (PDF or document).
- Model deployment demo in a user-friendly interface (e.g., Shiny).

Milestone 6 will handle the final report, presentation, and polished packaging of all artifacts.


## Inputs From Prior Milestones (Use These Artifacts)

Model and modeling outputs (Milestone 3):
- Final model artifact: `02_Project/Milestone_3/Task_03/outputs/final_random_forest_model.rds`
- Tuning logs: `02_Project/Milestone_3/Task_03/outputs/mtry_tuning.csv`, `.../nodesize_tuning.csv`, `.../ntree_tuning.csv`
- Modeling Rmd: `02_Project/Milestone_3/Task_03/Task_03.Rmd`

Data sets (standardized pipeline folders):
- Raw data: `02_Project/Data/01_Raw/*.csv`
- Cleaned data: `02_Project/Data/02_Cleaned/*.csv`
- Scaled/features: `02_Project/Data/03_Scaled/modeling_features.csv`, `.../final_features_comprehensive.csv`, `.../feature_metadata.csv`
- Split data: `02_Project/Data/04_Split/train_data.csv`, `.../val_data.csv`, `.../test_data.csv`

Evaluation (Milestone 4):
- Results vs business goals: `02_Project/Milestone_4/Task_1.md`
- Process review + gaps (leakage, tuning on test, baselines): `02_Project/Milestone_4/Task_2.md`
- Next-steps decision (recommend quick validation then pilot): `02_Project/Milestone_4/Task_3.md`
- Full evaluation report source: `02_Project/Milestone_4/GroupA_Milestone_04.Rmd`


## Recommended Tooling Choice (Keep It Simple)

- Primary option: R Shiny for the demo. Why?
  - Your final model is in R (`.rds`), so Shiny minimizes friction.
  - Meets “user-friendly interface” requirement in the brief.
- Alternative (if desired later): R plumber API + existing Next.js UI under `app/` (more work, not needed for M5).

Keep M5 focused: a minimal Shiny app that loads the `.rds`, accepts a few key inputs, and returns a prediction with a small info panel.


## Task A — Plan Deployment (What to Write and Decide)

Goal: Document the deployment strategy, steps, and tool selection. Output will be a short, clear plan (convert to PDF for submission).

Include these sections:
1) Objectives and Users
   - Who will use the app (e.g., policy analysts, DoH planners)?
   - What questions the app answers (predict health index; inspect key drivers).

2) Deployment Artefact
   - Minimal Shiny app that loads `final_random_forest_model.rds` and predicts from user inputs.

3) Environment and Access
   - Local run in RStudio now; optional hosting later (RStudio Connect or shinyapps.io) — justify which you pick and why.
   - Dependencies: R version, packages (e.g., shiny, readr, ranger/randomForest, recipes/caret if preprocessing needed).

4) Data Flow and Preprocessing
   - Input data: user-provided values for top predictors (see Milestone 4: water access, sanitation, literacy, healthcare access).
   - Preprocessing parity: apply the same transformations as in training (scaling/encoding) before prediction. If training used `recipes` or caret preprocessing, replicate or embed those steps.

5) Tool Research and Selection
   - Compare briefly: Shiny (R-native), Plumber+UI, Power BI. Pick Shiny for speed and native `.rds` support; note tradeoffs.

6) Acceptance Criteria/KPIs (for deployment readiness)
   - App runs locally without errors; prediction executes < 1s; inputs validated; minimal help text present.

7) Alternatives & Phasing (Pilot vs Production)
   - Outline a minimal pilot (local/Shinyapps.io) and a path to production (RStudio Connect/container) with a simple go/no-go gate based on Milestone 4 acceptance criteria.

8) Knowledge Propagation & Change Management
   - How users will learn about and use the model: short README/help in app, 1-page quick-start, brief stakeholder demo, and a contact/support channel.

9) Organisational Integration & Security (Lightweight)
   - Note expected auth (public/internal), data governance (no PII), and where the app/link will live (intranet, learning portal). Keep scope minimal for M5.

10) Benefits Measurement (Business KPIs)
   - Define how impact is measured post-deployment (e.g., improved targeting accuracy, reduced analyst time, uptake/usage). Map each KPI to a simple data source and review cadence.

Acceptance checklist:
- [ ] Clear audience and use-cases stated
- [ ] Deployment environment chosen and justified (Shiny)
- [ ] Preprocessing parity with training documented
- [ ] Runbook/README included


## Data To Use (Exact and Practical)

Authoritative sources for features/target and ranges:
- Training/validation/test splits: `02_Project/Data/04_Split/train_data.csv`, `val_data.csv`, `test_data.csv`
- Feature roles: `02_Project/Data/03_Scaled/feature_metadata.csv`
- Full feature table (reference): `02_Project/Data/03_Scaled/modeling_features.csv`

Target variable (per Milestone 3/4):
- `value_log_scaled` — the log-scaled target used in modeling and evaluation (see `Task_03.Rmd` and M4 docs).

Feature set for inference (build inputs for the model):
- Start from columns in `train_data.csv`.
- Exclude identifiers and targets: `data_id`, `value`, `value_log`, `value_category`, `value_log_scaled`.
- Include everything else (scaled numeric features, binaries, label encodes, engineered categories, one-hot columns):
  - From `feature_metadata.csv`, include columns with `feature_type` in {`numeric_scaled`, `binary`, `label_encoded`, `categorical_engineered`, `one_hot_encoded`}.

Why use `train_data.csv` as the schema source?
- It is the exact schema used to train `final_random_forest_model.rds` in `Task_03.Rmd`.
- It provides real ranges for sliders and defaults (means/modes) for the demo.

Practical tip for the Shiny demo:
- You do not need UI controls for every feature. Let users control a small, interpretable subset; fill the rest with defaults computed from `train_data.csv` (numeric means; categorical modes). This keeps the UI simple while feeding a full feature vector to the model.

Reference: The current `train_data.csv` header is aligned with `modeling_features.csv` (example columns you’ll see): `precision_scaled`, `characteristic_order_scaled`, `indicator_order_scaled`, `data_quality_score_scaled`, `is_preferred`, `high_precision`, `indicator_encoded`, `survey_cohort`, `dataset_source_encoded`, `char_order_quintile`, `indicator_importance`, `sample_size_tier`, `by_var_*`, `type_*`, `char_*`, etc. Use `feature_metadata.csv` to identify roles.


## Feature Construction for Inference (Steps)

Build the input column list and defaults from training data without writing new code in this milestone:
- Identify feature columns using `02_Project/Data/03_Scaled/feature_metadata.csv` with `feature_type` in: numeric_scaled, binary, label_encoded, categorical_engineered, one_hot_encoded.
- Intersect with columns present in `02_Project/Data/04_Split/train_data.csv` to ensure alignment with the trained model schema.
- Compute defaults for the demo: numeric features use training means; categorical/binary features use training modes.
- Construct a single-row input using defaults, then override only a few UI-controlled fields (e.g., `precision_scaled`, `is_preferred`, `high_precision`, `sample_size_tier`).
- Pass the full feature row to the model for prediction.

Slider/dropdown ranges and choices:
- Use robust bounds for numeric sliders based on 1st–99th percentiles from training data.
- For categorical fields, use the sorted unique values from training data as choices.


## Shiny Input Mapping Examples (Minimal but Consistent)

UI fields to expose (suggestion):
- `precision_scaled` (numeric slider)
- `is_preferred` (checkbox)
- `high_precision` (checkbox)
- One categorical with small, meaningful set: e.g., `sample_size_tier` (dropdown)

Everything else uses training defaults (means/modes) as shown above. This ensures the feature vector matches the model’s expected schema without overwhelming users.

Note on “top drivers”: Milestone 4 narrative highlighted domain drivers (water, sanitation, literacy, healthcare). Those originate from earlier raw/cleaned datasets under `02_Project/Data/02_Cleaned/*.csv`. The current production feature table is engineered/scaled; thus, your app should use the engineered features for prediction. You can still include a small static “Insights” panel referencing those drivers, but keep the prediction inputs aligned to the trained model features to avoid schema mismatch.

Monitoring data sources:
- Use `test_data.csv` as the baseline hold-out for periodic checks (RMSE/MAE)
- If new data arrives, append a dated “monitoring” CSV and compute drift vs `train_data.csv` distributions


## Task B — Build Minimal Shiny Demo 
Create the following structure:
- `02_Project/Milestone_5/shiny_app/app.R`
- `02_Project/Milestone_5/shiny_app/README.md` (how to run locally)

App requirements:
- Load `02_Project/Milestone_3/Task_03/outputs/final_random_forest_model.rds`.
- UI: simple numeric sliders/inputs for 4–6 key features; a Predict button; a result value; a short note describing the model.
- Server: ensure input vector is transformed consistently with training pipeline (e.g., scaling/encoding) before `predict()`.
- Optional: a small variable importance or “drivers” panel (static text or a small bar chart if available).

Acceptance checklist:
- [ ] Model loads without error
- [ ] Inputs validated (reasonable ranges)
- [ ] Predict button returns a prediction
- [ ] Preprocessing parity implemented or clearly documented


## Task C — Plan Monitoring and Maintenance

Goal: Define how you will monitor the app and the model in operation, detect drift, and maintain/retrain.

Include these sections:
1) Data Input Checks
   - Schema and range validation for user inputs; alert or prevent invalid entries.

2) Performance Monitoring
   - Track periodic RMSE/MAE on a small monthly validation set derived from `02_Project/Data/04_Split/test_data.csv` (or new data if available).

3) Drift Detection
   - Monitor input distribution shifts vs. `train_data.csv` (e.g., PSI) and output shifts (prediction mean/variance trends).

4) Fairness/Ethics
   - Slice analysis where feasible (e.g., region or urban/rural if available); document thresholds and actions.

5) Retraining and Rollback
   - Triggers: performance below threshold, significant drift, or updated data; retrain pipeline; version models; rollback if needed.

6) Governance and Audit
   - Keep changelog for model versions, data changes, and approvals.

7) Dynamic Aspects (What Can Change?)
   - Data refresh cycles, indicator definitions, geographic boundaries, feature engineering logic, and stakeholder priorities. Note monitoring hooks for each.

8) Sunset Criteria (When Not To Use)
   - Explicit stop-use rules (e.g., RMSE above threshold for 2 cycles, major indicator definition changes, or evidence of bias). Include immediate action and communication plan.

9) Business Objectives Evolution
   - Restate initial problem (from Milestone 1). Add a quarterly review to confirm objectives/thresholds remain valid; update documentation if they change.

Acceptance checklist:
- [ ] Input checks defined
- [ ] Performance metrics and cadence defined
- [ ] Drift criteria and actions defined
- [ ] Retraining and rollback process defined
- [ ] Ethical/fairness considerations included


## Address Milestone 4 Evaluation Caveats (Pre-Deployment Audit)

Before finalizing the demo, incorporate quick checks prompted by Milestone 4:
- Verify no data leakage: fit scalers/encoders on training data only; test set untouched.
- Ensure hyperparameter tuning was not done on the test set; reserve test strictly for final evaluation.
- Add a quick baseline comparison (e.g., linear model or mean predictor) in your documentation to confirm value-add.

If issues are detected, note them and either fix or document limitations explicitly in the plan; for M5, the demo can still be delivered while methodology validation proceeds.


## What to Submit for Milestone 5

1) Deployment and Maintenance Plan (PDF)
   - Export from Rmd/MD of Tasks A and C above.
2) Shiny Demo (folder)
   - `02_Project/Milestone_5/shiny_app/app.R`
   - `02_Project/Milestone_5/shiny_app/README.md` (how to run locally)

Optional supporting material (screenshots) can be embedded in the PDF.


## Minimal Shiny App Outline 

Your `app.R` should:
- Load the trained model (`final_random_forest_model.rds`).
- Build a full feature row using training defaults and a few user-controlled inputs.
- Ensure preprocessing parity with training (scaled/encoded features already expected by the model).
- Output a single predicted value for `value_log_scaled` with a brief help note.

Keep the UI simple: a few sliders/checkboxes/selects for interpretable fields, a Predict button, and a text output for the prediction. Document any assumptions in the app README.


## Keep It Lean (Time-Savers)

- Limit UI to 4–6 top drivers surfaced in Milestone 4.
- Run locally for M5; defer hosting decisions to M6.
- Document preprocessing parity clearly to avoid confusion.


## Quick Checklist (Milestone 5 Readiness)

- [ ] Deployment Plan written (objectives, environment, steps, tool choice, KPIs)
- [ ] Monitoring & Maintenance Plan written (checks, drift, retraining, rollback)
- [ ] Shiny demo implemented and runs locally
- [ ] Pre-deployment audit considered (no leakage; test set discipline)
- [ ] Submission package assembled (PDF + app folder)
