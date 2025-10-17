# Task 2 — Monitoring Plan for HDPSA Random Forest (CRISP-DM Deployment)

## 1. Objective
The objective of this Monitoring Plan is to ensure the post-deployment performance, reliability, and ethical compliance of the HDPSA (Health and Demographic Patterns in South Africa) Random Forest regression model once integrated into the production environment comprising a Flask API, a Next.js dashboard, an n8n automation workflow, and MongoDB for operational logging. The plan operationalises the CRISP-DM Deployment phase by defining what is measured, how it is measured, how results are visualised, and how alerts and corrective actions are triggered, documented, and reviewed.

This document applies to the currently deployed model and all subsequent versions of the HDPSA Random Forest model. It complements the Maintenance Plan (Task 3), which specifies retraining, versioning, and retirement policies that are triggered by the monitoring outcomes defined here.

## 2. Monitoring Scope & Framework
Monitoring focuses on three dimensions aligned to CRISP-DM’s Deployment activities:
- Continuous performance monitoring: tracking model error and stability in production relative to the Milestone 4 baseline.
- Data quality and drift monitoring: detecting changes in input feature distributions, population stability, and output behaviour that could degrade reliability or indicate context shift.
- System and ethics monitoring: confirming availability, latency, logging completeness, fairness, and legal compliance (POPIA), with transparent reporting to stakeholders via the Next.js dashboard.

System components in scope:
- Flask API (`/api/predict`, `/api/metrics`): request validation, prediction, and metrics endpoints; logs inputs/outputs to MongoDB.
- Next.js dashboard: real-time and historical monitoring views; PDF/CSV export of reports.
- n8n workflow: scheduled collection, evaluation, and alerting; report generation and distribution.
- MongoDB logging: collections for `model_predictions`, `monitoring_metrics`, and `drift_reports`.

Automation and visualisation layers:
- Dashboards present KPIs, trend charts, and drift indicators; tiles change state (green/amber/red) based on thresholds.
- n8n emits alerts (email/Slack) and escalates incidents when thresholds are breached or data quality rules fail.
- Reports are generated as Markdown and HTML and saved under `/monitoring_reports/` with date-stamped filenames (e.g., `monitoring_YYYY-MM-DD.html`).

## 3. Performance Monitoring Strategy
Core model performance metrics captured weekly on a representative holdout (or rolling window of labelled records where ground truth becomes available). Baselines from Milestone 4 are fixed as reference values.

| Metric | Definition | Baseline | Alert Threshold | Frequency |
|--------|------------|----------|-----------------|-----------|
| RMSE | Root Mean Square Error | 0.0554 | > 0.07 | Weekly |
| MAE | Mean Absolute Error | 0.0382 | > 0.05 | Weekly |
| R² | Explained Variance (Coefficient of Determination) | 0.997 | < 0.95 | Weekly |

Collection and computation:
- The Flask API writes each prediction request/response (timestamp, input vector, prediction, optional ground truth when available) to `MongoDB.model_predictions`.
- n8n runs a weekly job to compute RMSE, MAE, and R² on the most recent labelled window (e.g., the last 4 weeks or the latest batch with ground truth).
- Metrics are written to `MongoDB.monitoring_metrics` with fields: `timestamp`, `rmse`, `mae`, `r2`, `n_samples`, `window`, `model_version`, and `status`.

Alerting rules and dashboard logic:
- Threshold breaches set status: green (OK), amber (watch), red (alert). Example: RMSE ≤ 0.07 → green; 0.07 < RMSE ≤ 0.08 → amber; RMSE > 0.08 → red.
- Consecutive breaches for two cycles auto-create a maintenance ticket and escalate to BI Manager.
- The Next.js dashboard surfaces: (a) current values vs baseline, (b) 8–12 week trend lines, (c) confidence bands, (d) an annotation stream for incidents and changes (e.g., dataset updates).
- Users can toggle “Compare to Baseline” mode which overlays current distributions versus the Milestone 4 baseline, with percentage deltas.

## 4. Data Drift Detection
The monitoring layer evaluates three drift dimensions using established tests and practical thresholds suitable for policy analytics on continuous targets.

- Input feature drift → Kolmogorov–Smirnov (KS) test: for each top feature identified in Milestone 4, compare current input distribution to the training distribution. Flag drift if p < 0.05.
- Population stability → Population Stability Index (PSI): compute PSI per feature and an aggregate PSI. Flag material shift if PSI > 0.2 and critical shift if PSI > 0.3.
- Output drift → change in prediction distribution: flag if mean or variance shifts by more than 15% relative to baseline over a rolling 4-week window.

Drift reporting:
- n8n generates a weekly drift report combining: per-feature KS results, PSI table, and output distribution changes; saved to `/monitoring_reports/`:
  - `drift_report_YYYY-MM-DD.md` (primary)
  - `drift_report_YYYY-MM-DD.html` (rendered)
- Reports include a summary section with pass/fail status and recommended actions.
- Notifications: when any drift criterion is breached, n8n sends a Slack and email alert with a deep link to the dashboard report and attaches the Markdown summary. Severe drift (PSI > 0.3 or multiple KS failures) also opens a maintenance ticket and requests an ad-hoc review.

## 5. Automation Workflow (n8n)
The monitoring process is orchestrated in n8n as a scheduled workflow. Below is a node-by-node outline and an ASCII dataflow summary.

Nodes and responsibilities:
- Scheduler (Cron): Triggers weekly on Mondays 07:00 SAST. Output: timestamp, window parameters.
- Fetch Window Data (HTTP Request → Flask `/api/metrics/window`): Retrieves labelled predictions and input samples for the defined window. Output: JSON payload; Storage: raw snapshot in `MongoDB.monitoring_metrics_raw`.
- Compute Metrics (Function): Calculates RMSE, MAE, R². Output: metrics object; Storage: `MongoDB.monitoring_metrics`.
- KS & PSI (Function): For each selected feature, run KS test and compute PSI vs training baselines stored in `MongoDB.baselines`. Output: array of drift results; Storage: `MongoDB.drift_results`.
- Output Drift (Function): Compares current prediction mean/variance vs baseline. Output: drift flags; Storage: included with `drift_results`.
- Render Report (Markdown → HTML): Builds `drift_report_YYYY-MM-DD.md` and `.html` using template partials. Storage: `/monitoring_reports/`.
- Threshold Gate (IF): Evaluates metrics and drift flags against thresholds. Output: branch to Alert/OK.
- Alert (Slack + Email): Sends summary message; attaches report link; Channel: `#hdpsa-model-ops` and ops mailing list.
- Escalation (Create Issue): If red status or two amber cycles, create GitHub Issue or Jira ticket with labels `monitoring`, `hdpsa`, `drift`.
- Dashboard Refresh (HTTP Request → Next.js revalidate endpoint): Triggers incremental static regeneration for monitoring pages.

ASCII summary of the workflow:

```
[Cron]
  → [Flask /api/metrics/window]
      → [Compute RMSE/MAE/R²]
          → [KS & PSI Tests]
              → [Output Drift Check]
                  → [Render Markdown/HTML Reports]
                      → [Save to /monitoring_reports/]
                          → [Threshold Gate]
                              → (OK) [Dashboard Revalidate]
                              → (ALERT) [Slack/Email] → [Create Issue]
```

Operational details:
- All nodes log structured events to MongoDB with `workflow_id`, `run_id`, `node`, `status`, `duration_ms` for traceability.
- Secrets (API keys, SMTP credentials) are stored securely in n8n credentials and never hard-coded in scripts.

## 6. Dynamic Context & Review Cadence
Data and business environments evolve. Monitoring explicitly tracks contextual changes and mandates periodic reviews.

Dynamic changes tracked:
- Data: new datasets, indicator redefinitions, schema changes, scaling method updates, encoding changes.
- Business: shifting policy priorities, new reporting requirements, updated privacy or data-sharing rules.

Quarterly Monitoring Reviews (formal checkpoints with BI Manager approval):

| Quarter | Focus | Outcome |
|--------|-------|---------|
| Q1 | Model Drift Review | Retraining decision |
| Q2 | Policy Alignment | Objective adjustment |
| Q3 | Documentation Audit | Metadata update |
| Q4 | Lifecycle Decision | Continue / Retire |

Each review consolidates the quarter’s monitoring reports, assesses cumulative threshold breaches, and issues a decision memo (continue, monitor closely, retrain, or retire) with assigned owners and due dates.

## 7. Governance & Roles
Clear accountability ensures timely action and auditability.
- Data Scientist: owns metric computation, drift test configuration, interpretation, and recommendations; curates baseline distributions.
- Engineer: owns n8n workflow reliability, storage operations, and dashboard integrations; maintains CI/CD for report publishing.
- BI Manager: chairs quarterly reviews; approves escalations and lifecycle decisions; ensures alignment with stakeholder priorities.

RACI summary:
- Data Scientist (R/A) for metrics and drift; Engineer (C/I); BI Manager (A) on decisions.
- Engineer (R/A) for automation and storage; Data Scientist (C/I); BI Manager (I).

## 8. Ethical & Compliance Considerations
- Fairness tests: compute error parity and calibration parity across key segments (e.g., province, urban/rural). Flag if subgroup MAE deviates > 25% from overall MAE.
- Privacy (POPIA): no personal identifiers are processed or stored; logs include aggregated or de-identified inputs only; access to logs is role-based; retention schedules are applied to raw inputs.
- Transparency: the Next.js dashboard publishes a Monitoring Summary page accessible to authorised stakeholders, including metric trends, drift outcomes, fairness indicators, and explanatory notes.
- Explainability: provide feature-attribution summaries (e.g., permutation importance on a validation subset) quarterly to confirm stability of key drivers.

## 9. Summary
This Monitoring Plan implements CRISP-DM Deployment best practices for the HDPSA Random Forest model by defining metrics, thresholds, drift tests, and automated reporting with alerting and governance. The combined stack—Flask, Next.js, n8n, and MongoDB—delivers continuous oversight and transparent evidence for decision-making. The outputs of monitoring (breaches, trends, fairness signals) serve as explicit triggers into the Maintenance Plan for retraining, versioning, and potential retirement, ensuring proactive detection, accountability, and informed lifecycle management.

## 10. Data Quality Rules & SLOs (Supplement)
Beyond model performance and drift, the system enforces operational data quality checks with service level objectives (SLOs):
- Schema and constraints: enforce expected columns, dtypes, value ranges, and categorical domains at the Flask boundary; reject requests that fail validation and log counters to `monitoring_metrics`.
- Missingness and outliers: track input missingness rate and winsorised outlier share per feature; alert if missingness > 5% for any critical feature or if outlier share doubles relative to baseline.
- Volume and freshness: compare weekly request counts and label availability rate to baselines; alert if volume drops > 30% or label availability falls below 60% of expected cadence.
- Latency and reliability: p95 API latency ≤ 500 ms; error rate ≤ 1% per week. Breaches trigger an engineering incident separate from model-performance alerts.
- Reproducibility: weekly monitoring jobs record code version and environment hash; any change triggers a low-severity alert and a dashboard annotation.

Appendix—Metric notes:
- RMSE and MAE are computed on the same labelled window, using the identical preprocessing pipeline as training, to avoid leakage or inconsistent scaling.
- R² is reported with sample size and confidence intervals (via bootstrap) on the dashboard to contextualise variability across weeks.
- Drift metrics (KS, PSI) are accompanied by effect-size summaries and sparkline trends to distinguish transient blips from persistent shifts.
