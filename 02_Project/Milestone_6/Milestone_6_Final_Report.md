# Milestone 6: Final Report and Project Review

Project: Health and Demographic Patterns in South Africa (HDPSA)

Team: Group A

Date: 20 October 2025

---

## Executive Summary

This final report concludes CRISP-DM Phase 6 (Deployment) for the HDPSA project. We integrated the insights, data assets, and models developed across Milestones 1–5 into an end-to-end, reproducible workflow and a deployed reporting experience.

Core outcomes:
- Business value: Faster health-survey data validation, better planning estimates, and accessible visual storytelling for stakeholders.
- Model: Random Forest regression trained on engineered survey features; validated in Milestone 4.
- Deployment: Next.js reporting dashboard with embedded Power BI report and a Flask ML API for training, evaluation, and batch prediction.
- Operations: Monitoring and Maintenance plans from Milestone 5 to ensure reliability, fairness, and lifecycle governance.

Key validation metrics (Milestone 4 baseline): R² = 0.997, RMSE = 0.0554, MAE = 0.0382.


## Business Understanding (Recap)

- Stakeholders: Health Ministry data quality teams, DHS survey planners, academic researchers, policy analysts — each audience engages differently (quality teams validate anomalies before publication; planners estimate plausible ranges for budgeting; researchers reconstruct missing historical points; analysts communicate trends and disparities).
- Objectives: Validate incoming survey indicators, fill gaps in historical series, and communicate trends effectively — balancing operational accuracy checks with accessible narratives that inform policy and programme design.
- Success criteria: Accurate predictive checks against historical patterns, reduced manual review time, and clear, interactive reporting for decision-makers — evidenced by baseline metric adherence, fewer red‑flag incidents, and positive UX feedback from demo sessions.
- Scope: Aggregated survey indicators only (no individual-level predictions), batch context, and national/provincial insights — non‑causal pattern detection within the training distribution, explicitly avoiding personal data.

References (filenames only):
- Task_1_Deployment_Strategy.md — Deployment approach, stakeholders, success metrics, and tool selection.
- Milestone_1.md / Milestone_2.md — Business understanding, data inventory, and early exploration goals.


## Data Understanding and Sources

Primary sources: DHS-style national health indicator datasets for South Africa across multiple domains (water, sanitation, immunization, maternal/child health, literacy, etc.).

- Data_Dictionary.md — Field definitions and dataset semantics for consistent analysis.
- Data_Pipeline.md — Stage-by-stage data flow and usage guidelines.
- Folder structure: 01_Raw → 02_Cleaned → 03_Scaled → 04_Split → 05_ModelReady, plus Flat Data for reporting.

Highlights:
- Consistent schema with fields such as `Indicator`, `Value`, `Precision`, `SurveyYear`, `CharacteristicLabel`, and CI bounds (CILow/CIHigh) — enables reusable transforms, uniform filtering, and comparable visuals across domains.
- Quality context via confidence intervals and sample size (DenominatorWeighted/Unweighted) — supports uncertainty‑aware interpretation and avoids over‑confidence in sparse signals.
- Trend analysis enabled by multiple survey years and domain coverage — facilitates longitudinal comparisons and identification of structural shifts.


## Exploratory Data (Summary)

Scope and coverage:
- Domains (raw → cleaned curated): 13 → 7 — curated set targets high‑value, consistent tables for robust visuals and stable modelling.
- Cleaned datasets and sizes (rows, cols, unique indicators):
  - access-to-health-care: 275 rows, 11 cols, 68 indicators — broad modalities/barriers coverage to contextualise access challenges.
  - child-mortality-rates: 40 rows, 11 cols, 15 indicators — compact but pivotal outcomes (under‑5, infant, neonatal) for policy dialogue.
  - dhs-quickstats: 52 rows, 11 cols, 27 indicators — multipurpose summary panel for cross‑checks and highlights.
  - hiv-behavior: 118 rows, 11 cols, 74 indicators — behavioural detail enabling deeper drill‑downs and parity checks.
  - immunization: 116 rows, 11 cols, 32 indicators — vaccine schedule coverage for trend and cohort comparisons.
  - toilet-facilities: 46 rows, 11 cols, 32 indicators — sanitation categories complement water to complete WASH views.
  - water: 100 rows, 11 cols, 62 indicators — includes counts and proportions for both prevalence and scale context.

Missingness (cleaned):
- Estimated missing tokens (empty/NA/null): ~0% across curated files (token scan found none) — downstream pipelines can forgo imputation and focus on analysis and validation.

Value ranges per dataset (min → max of `value`):
- water: 0 → 52011.58 (includes count-type indicators like population totals)
- access-to-health-care: 0.1 → 4992
- hiv-behavior: 1.738 → 8514
- immunization: 2.455 → 3375.80
- toilet-facilities: 0.4 → 52258.90
- child-mortality-rates: 7 → 5158.04
- dhs-quickstats: 0.604 → 504.89

Notes:
- Large maxima reflect “Number of households/persons” indicators captured alongside percentage‑style indicators — analyses distinguish counts vs percentages at the indicator level to avoid unit mixing.
- Cleaned files show consistent headers and typing; no structural anomalies detected — outlier analysis is domain‑aware given mixed units, with CI bounds as guardrails.


## Data Preparation (Summary)

Process aligned to the documented pipeline (see Data_Pipeline.md):
- 01_Raw: Immutable source CSVs for lineage — preserves provenance and supports exact re‑runs.
- 02_Cleaned: Missingness handling, type fixes, de‑duplication, and standardization — outputs analysis‑ready tables with consistent types.
- 03_Scaled: Feature scaling/encoding for modelling; engineered features consolidated — harmonises ranges and categorical encodings for stable learning.
- 04_Split: Train/validation/test files for ML workflows — prevents leakage and enables honest generalisation estimates.

Artifacts used by the ML service:
- train_data.csv — Model‑ready training split with engineered features and target; basis for fitting and feature attribution.
- val_data.csv — Validation split for tuning and pre‑deployment checks; used to detect overfitting.
- test_data.csv — Holdout evaluation split; used to set and confirm baseline metrics.


## Why 01_Raw Cannot Be Used Directly (Metadata Constraints)

The raw survey tables are aggregated summaries that behave more like metadata than event‑level records. Each row describes what was measured (indicator), for whom (population slice), and the summary outcome (value), sometimes with confidence intervals and sample sizes. That design is ideal for documentation and reporting, but not suitable as‑is for most modeling or unsupervised exploration without a preparation layer.

- Aggregation, not microdata: Rows represent national or grouped aggregates rather than individual observations. Without microdata, we cannot learn person/household‑level relationships or engineer granular features that predictive models rely on.
- Mixed units in a single column: The value field mixes percentages, rates, and counts. Off‑the‑shelf algorithms cluster or regress by scale instead of meaning unless units are segmented/normalized and indicator semantics are respected.
- Semantic heterogeneity: Indicator identity and categories encode topic meaning. Naive one‑hot encoding balloons dimensionality relative to row counts per indicator, causing sparsity and overfitting with limited generalization.
- Irregular temporal coverage: Survey years are uneven across indicators. Straight‑line forecasting or panel methods on raw tables become brittle due to non‑stationarity and missing years.
- Uncertainty ignored by default: Precision, CI bounds, and denominators convey reliability. Treating all rows equally overweights noisy estimates and biases clustering/regression.
- Cross‑domain friction: Even with a shared schema, domains differ in granularity and category vocabularies. Joining raw tables without harmonization introduces sparsity and data leakage.

What we explored (and why it proved infeasible without transformation):
- Clustering (k‑means/hierarchical) on combined raw rows → clusters formed by unit magnitude (counts vs percentages), not by domain semantics.
- Dimensionality reduction (PCA/UMAP) → embeddings dominated by scale and coverage artifacts; poor interpretability across domains.
- Naive supervised baselines on concatenated raw rows → extremely wide, sparse matrices from indicator one‑hots; unstable fits and leakage risks.
- Simple time‑series smoothing/forecasting by indicator → irregular spacing and shifting survey designs led to non‑robust extrapolations with low decision value.
- Outlier/anomaly detection (e.g., isolation forest) on raw value → flagged unit/scale differences rather than meaningful anomalies.

Why the preparation pipeline is required:
- Unit handling: Separate and normalize counts vs proportions; use stabilized targets (e.g., log/scale) to avoid scale artifacts.
- Feature semantics: Encode survey metadata (indicator identity, precision, preferred estimate, quality tiers) to provide meaningful predictive signals.
- Uncertainty‑aware weighting: Incorporate precision/CI and denominators so noisy estimates don’t dominate learning.
- Proper splits: Train/validation/test separation to ensure honest generalization and prevent leakage across years/indicators.

What would be needed to use raw tables directly (beyond this project’s scope):
- Access to microdata to engineer causal or individual‑level features and labels.
- A unified indicator ontology and unit normalization framework to reconcile heterogeneous measures.
- Sufficient longitudinal depth per indicator with consistent survey designs for robust time‑series/panel modeling.
- Larger sample sizes relative to feature width (or strong regularization/grouping) to avoid sparsity‑driven instability.

Conclusion: 01_Raw is excellent for documentation and high‑level reporting. Direct modeling on it yields scale‑ and coverage‑driven artifacts. The staged cleaning, scaling, and feature engineering are prerequisites for stable, interpretable, and operationally useful results.

## Modelling (Recap)

Model family: Random Forest Regressor (scikit-learn) consuming 27 engineered features and predicting `value_log_scaled` (inverse-transformed to original units).

Implementation:
- ml_service.py — Model orchestration (training, metrics, artifact management, prediction, inverse transforms).
- app.py — Flask API exposing health, model info, feature importance, reload, train, evaluate, predict, and data-info endpoints.
- outputs (ML) — Saved model artifacts and metadata for reload and auditability.

Milestone 4 performance (baseline):
- R² = 0.997 (explained variance on held-out test set)
- RMSE = 0.0554 (log-scaled target)
- MAE = 0.0382

Interpretation and limitations:
- The model captures robust relationships between survey metadata (e.g., indicator identity, precision, quality scores) and reported indicator values.
- It is not causal and is calibrated within the historic distribution (1998–2016); it should not be used for long-horizon forecasting or individual-level inference.

References:
- GroupA_Milestone_04.Rmd — Modelling and evaluation details used to set baseline metrics.


## Evaluation and Validation

Evaluation strategy reused the train/val/test design from the pipeline and confirmed generalization within distribution.

Metrics tracked:
- Model accuracy and error: RMSE, MAE, and R² against Milestone 4 baseline — primary promotion gates and ongoing health indicators.
- Fairness and calibration: subgroup error parity (province, urban/rural) and stability of feature importance — ensures reliability across segments and guards against concept drift.
- Confidence context: CI bounds from source data inform interpretation of deviations — differentiates expected variability from genuine anomalies.

Results summary:
- The model maintained the baseline performance in testing scenarios derived from the prepared splits — RMSE/MAE/R² were consistent with the baseline.
- No material fairness regressions observed under described thresholds in Milestone 5 plans (see Monitoring & Maintenance references below) — subgroup deviations remained within parity bands.

References:
- Task_4_Monitoring_Plan.md — Thresholds, drift tests, alerting/escalation, dashboard reporting.
- Task_3_Maintenance_Plan.md — Retraining/versioning/rollback, fairness checks, governance cadence.


## Deployment

User-facing reporting:
- page.tsx — Next.js reporting dashboard with embedded Power BI and data disclaimer; interactive tiles, filters, and descriptive text aid interpretation.
- Embedded Power BI report — provides domain summaries and drill‑downs (e.g., water sources, child mortality, antenatal care) with slicers and tooltips.
- Data disclaimer — clarifies provincial demo generation vs national official sources to prevent misuse and set expectations.

Predictive API service:
- Flask API — endpoints for health checks, model metadata, feature importance, reload, training, evaluation, and batch predictions; supports batch validation and monitoring jobs.
- Start configuration — defined in app.py; ml_service.py encapsulates training/evaluation/prediction logic and artifact IO for reproducibility.

Data flow:
- Reporting uses Flat Data aggregates — optimised for lightweight, fast‑loading dashboards.
- Predictive workflows operate on the engineered train/validation/test splits — shared preprocessing contract between training and inference.

Architecture (summary):
- Frontend: Next.js (dashboard + Power BI embed)
- Backend: Flask ML API (training/evaluation/prediction)
- Storage/Artifacts: model outputs and metadata saved in the ML outputs directory — decoupled layers enable quick rollback and independent iteration.


## Monitoring and Maintenance (Operations)

Monitoring Plan (Milestone 5, Task 2) defines:
- Performance thresholds (e.g., RMSE > 0.07, R² < 0.95) and alerting cadence — traffic‑light states (green/amber/red) with incident creation on repeated breaches.
- Drift detection (PSI/KS) and system/DQ SLOs (latency, error rate, schema checks) — separates data shifts from operational issues; both are surfaced on dashboards.
- Reporting outputs with weekly trend lines and baseline comparisons — auditable history for stakeholders and governance.

Maintenance Plan (Milestone 5, Task 3) defines:
- Retraining triggers, model versioning, rollback, and governance practices — clear runbooks translate alerts to retraining and safe promotion.
- Ethical/bias checks before redeployment (parity thresholds, calibration, explainability packets) — deployments are gated on fairness and transparency.
- Quarterly review cadence with documented decisions — consolidates incidents, metrics, and roadmap choices for sign‑off.

References:
- Monitoring: Task_4_Monitoring_Plan.md
- Maintenance: Task_3_Maintenance_Plan.md
- Deployment strategy: Task_1_Deployment_Strategy.md


## Ethical Considerations

Principles applied:
- Privacy and POPIA compliance: no personal identifiers in logs; de‑identified aggregates only — role‑based access and retention schedules reduce exposure risk.
- Fairness: monitored subgroup error parity and stability of feature importance; corrective actions defined for bias mitigation — parity packs accompany promotions.
- Transparency: stakeholder dashboards show performance trends, drift indicators, and annotations — documentation of incidents builds trust.

Risks and mitigations:
- Distribution shift: drift tests and retraining triggers — PSI/KS guide investigation and escalation.
- Misinterpretation of predictions: scope explicitly limited to aggregated survey indicators; disclaimer visible in the reporting UI — avoids person‑level inference.
- Overreliance on historical patterns: governance requires periodic recalibration against new survey releases — quarterly reviews reassess baselines and thresholds.

Bias, inclusivity, and accountability:
- Fairness thresholds: require subgroup error parity within ±25% of overall MAE/RMSE; investigate if breached for two consecutive cycles.
- Inclusive evaluation: report parity and calibration across provinces and urban/rural splits; include under-represented segments in sensitivity checks.
- Corrective actions: reweight training data, review feature set for proxy bias, recalibrate outputs, and document mitigations in release notes.
- Review cadence and roles: Data Scientist compiles fairness pack; Engineer validates reproducibility; BI Manager performs sign-off prior to redeployment.
- Escalation triggers: repeated fairness breach, PSI > 0.2 on key features, or R² < 0.95 → open incident, schedule retraining, and gate promotion until resolved.


## Visual Storytelling and Interactivity

- Power BI report embedded in the reporting dashboard provides interactive charts and drill‑downs — slicers and tooltips make exploration intuitive for non‑technical users.
- The Next.js page includes contextual notes, consistent styling, and generous layout — readability and context reduce misinterpretation risk.
- Data sources and limitations clearly surfaced (see data disclaimer on page.tsx) — clarifies national vs demo content for responsible use.


## Project Review and Lessons Learned

What went well:
- Clean, traceable data pipeline with clear stage separation — reduced iteration time, simplified debugging, and made reruns straightforward.
- Random Forest model provided strong baseline accuracy with simple operations — robust generalisation with low operational burden.
- Next.js + Power BI provided an accessible reporting experience — stakeholders engaged quickly; the dashboard supported decision discussions.

What could be improved:
- Add automated CI for the Flask ML service — include endpoint unit tests, schema validators, and artifact integrity checks.
- Expand fairness analyses — add subgroup calibration curves and quarterly stability reviews documented in monitoring notes.
- Integrate prediction‑service metrics directly into the dashboard — unify system and model KPIs for quicker triage.

Future recommendations:
- Add quantile or conformal intervals to predictions — provide uncertainty bands to guide conservative decision‑making.
- Explore gradient boosting baselines and sparse models — evaluate accuracy/interpretability trade‑offs and maintain challenger models.
- Implement a lightweight model registry and promotion workflow — use tags, approvals, and checksums to strengthen governance.


## Deliverables Checklist

- Final project report (this document) – Milestone_6_Final_Report.md — ensure ≤ 8 pages of content; include EDA summaries, ethics depth, recommendations.
- Presentation slides — up to 10 content slides reflecting report flow (context → data → model → deployment → ethics → next steps).
- Final project files and code (R Markdown and supporting assets) — verify all Rmd/MD files knit or render; figures match the latest results.
- Reporting dashboard — page.tsx (Power BI embedded view) — confirm iframe loads and disclaimers are visible.
- Predictive service — app.py and ml_service.py with supporting train/val/test splits — sanity‑check /train, /evaluate, and batch predict endpoints.
- Data documentation — Data_Dictionary.md and Data_Pipeline.md — confirm field definitions and stage descriptions align with visuals and features.

Note: If hosted on a remote repository (GitHub/GitLab/etc.), include that URL in your course submission. The current path reflects the local project structure.


## References

- CRISP-DM methodology applied across Milestones 1–6.
- Project materials and metrics from: GroupA_Milestone_04.Rmd, Milestone_5_Report.Rmd
- Operational plans: Task_1_Deployment_Strategy.md, Task_3_Maintenance_Plan.md, Task_4_Monitoring_Plan.md
- Data documentation: Data_Dictionary.md, Data_Pipeline.md
