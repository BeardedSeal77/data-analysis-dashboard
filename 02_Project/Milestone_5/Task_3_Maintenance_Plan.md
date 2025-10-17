# Task 3 - Maintenance Plan for HDPSA Random Forest (CRISP-DM Deployment)
## 1. Objective
Maintenance, within the CRISP-DM Deployment phase, is the set of practices that ensure the HDPSA (Health and Demographic Patterns in South Africa) Random Forest model continues to deliver reliable, fair, and business-aligned predictions over time. This Maintenance Plan defines how the team will respond to monitoring signals, retrain and version the model, manage configuration and documentation, and make lifecycle decisions (continue, update, or retire) in a controlled and auditable way.

**Scope and assumptions:** This plan applies to the Random Forest regression service deployed via Flask, assumes labelled data are available weekly with quarterly deep-dive reviews, and excludes the Next.js UI layer and downstream data-warehouse refresh processes.

**Key outputs / artifacts:**
- Maintenance objective statement aligned to CRISP-DM Deployment.
- Scope note clarifying coverage, cadence, and exclusions.
- Reference linkage to the Task 2 Monitoring Plan for upstream metrics.

## 2. Maintenance Framework Overview
Maintenance is tightly coupled with monitoring. The Monitoring Plan (see Monitoring Plan) continuously computes performance metrics and drift indicators, sending alerts via n8n when thresholds are breached. This Maintenance Plan consumes those outputs and prescribes actions:
- Retrain when performance degrades (e.g., RMSE > 0.07, R^2 < 0.95), drift exceeds thresholds (e.g., PSI > 0.2, KS p < 0.05), or when material new data or business changes arise.
- Version every deployed model using semantic versioning and maintain a registry for provenance.
- Retire the model when it persistently underperforms, becomes misaligned with the business context, or presents ethical/compliance risks.

Decision flow (simplified):
- Single red alert -> ad-hoc investigation; if confirmed, schedule retraining.
- Two consecutive amber or one red for performance or drift -> trigger retraining workflow.
- Three months of degraded performance or substantive context change -> consider retirement or full redevelopment.

**Key outputs / artifacts:**
- Trigger catalogue aligned with Monitoring Plan thresholds.
- Escalation decision matrix shared in governance handbook.
- Quarterly review agenda updated with new escalation criteria.

## 3. Model Retraining Procedures
### 3.1 Triggers
- Performance degradation: production RMSE > 0.07 or MAE > 0.05, or R^2 < 0.95 (based on weekly metrics) for two consecutive cycles.
- Data drift: PSI > 0.2 on key features or KS p < 0.05 for multiple features; output mean/variance shift > 15%.
- New data: availability of additional, representative data (e.g., quarterly national release) requiring incorporation.
- Business objective change: revised KPI definitions, new policy focus, or updated success criteria.

### 3.2 Process (aligned to CRISP-DM)
1) Collect and reconcile new/updated data -> re-run Milestone 2 (Data Preparation) pipeline to regenerate cleaned, scaled, and split data.
2) Re-run Milestone 3 (Modeling) pipeline, preserving feature engineering and training procedures for Random Forest; perform hyperparameter tuning if warranted.
3) Re-run Milestone 4 (Evaluation) suite on holdout/validation sets; compute RMSE, MAE, R^2, fairness parity metrics, and calibration.
4) Compare to the production baseline and the last deployed version’s metrics; conduct error analysis for key subgroups (province, urban/rural).
5) Approve deployment only if metrics demonstrate >= 3% RMSE reduction or >= 1% R^2 increase with no fairness regressions; otherwise iterate or revert.
6) Document total compute consumption (target <= 8 GPU hours or <= 30 CPU hours) and budget impacts in the retraining log for capacity planning.

### 3.3 Automation entry points
- n8n creates a retraining issue and can call a Flask admin endpoint (e.g., `/api/admin/retrain`) or dispatch a GitHub Actions workflow to run the training scripts (R + Python orchestration as needed).
- The training workflow writes candidate metrics and artefacts to a staging area; promotion to production requires BI Manager approval.
- Process visual: see `02_Project/Diagrams/HDPSA_Retrain_Process.drawio` for the detailed activity flow.

### 3.4 Safeguard logic
- Weekly metrics are evaluated against guardrails (RMSE > 0.07, MAE > 0.05, R^2 < 0.95, PSI > 0.2).
- Any breach flags the run as an alert and records the affected indicators for transparency.
- Combined breaches across performance and drift automatically move the workflow onto the retraining branch.
- Successful runs log the metrics snapshot with a green status to evidence ongoing stability.
- Manual override: the Engineer may suspend automation for a specified window when confirmed upstream anomalies explain the breach; overrides are logged with justification.
- Smoke-test hook: after every retrain the pipeline validates 10 reference predictions against stored outputs to detect regressions before promotion.
- Rollback logic: if post-deployment monitoring shows the new model underperforms for two consecutive cycles, the system reverts to the previous minor version stored in `02_Project/Models/Deployed/rollback/` and notifies stakeholders.

**Key outputs / artifacts:**
- Approved retraining checklist with quantified improvement thresholds.
- Smoke-test report archived with evaluation artefacts.
- Override and rollback log stored in MongoDB `maintenance_overrides` collection.

## 4. Model Versioning Strategy
### 4.1 Semantic versioning
- Use `vMAJOR.MINOR.PATCH` (e.g., `v1.2.0`).
  - MAJOR: breaking changes to data schema, target, or architecture.
  - MINOR: improvements from new data, tuning, or non-breaking feature updates.
  - PATCH: hotfixes (e.g., bug in preprocessing) with no material metric change.

### 4.2 Model registry
- Maintain `02_Project/Milestone_5/model_registry.csv` with at least the following columns:
  - `version`, `date`, `dataset_hash`, `training_date_range`, `featureset_hash`, `hyperparameters`, `rmse`, `mae`, `r2`, `psi`, `model_hash`, `owner`, `reviewed_by`, `artifact_uri`, `notes`.
- The `dataset_hash`, `featureset_hash`, and `model_hash` are SHA-256 checksums of canonicalised CSV/Parquet and model binaries to ensure provenance and integrity.
- `artifact_uri` points to the deployed asset under `02_Project/Models/Deployed/<version>/model.rds`.
- Registry updates are automated via `02_Project/scripts/register_model.py`, executed as the final GitHub Actions job.
- JSON schema equivalence is maintained in `02_Project/Milestone_5/model_registry.schema.json` to mirror CSV entries in `model_registry.json` for audit queries.
- Example row: `v1.2.0,2025-03-31,8b1d...,2025Q1,4c2a...,n_estimators=500,0.052,0.036,0.998,0.12,9d7f...,a.naidoo@hdpsa.org,bi.manager@hdpsa.org,02_Project/Models/Deployed/v1.2.0/model.rds,Quarterly refresh`.

### 4.3 Retention
- Keep only the last 3 versions readily accessible: `02_Project/Models/Deployed/active/` (current), `02_Project/Models/Deployed/backup/` (last), and `02_Project/Models/Archive/hot/` (previous). Older versions move to `02_Project/Models/Archive/cold/`.
- Each version bundle includes: model artefact (`.rds`), preprocessing pipeline specs, training notebook/logs, evaluation report, monitoring snapshot, and SHA-256 checksum file for tamper detection.
- Quarterly integrity checks recompute checksums; mismatches raise Critical incidents and freeze promotions until resolved.

### 4.4 Promotion checklist
- Metrics equal or better than baseline on validation and subgroup analysis.
- No fairness parity breach (> 25% subgroup MAE deviation).
- Successful canary validation in staging via Flask + Next.js integration tests.
- Registry updated; release notes added; rollback plan documented.
- Fairness report reviewed by BI Manager prior to promotion and stored under `02_Project/Documentation/Fairness/`.

**Key outputs / artifacts:**
- Updated model registry with checksum and reviewer fields.
- Checksum verification reports filed in archive folders.
- Automated registration script logs stored in CI pipeline records.

## 5. Model Retirement Policy
### 5.1 Sunset criteria
- Persistently low performance for > 3 consecutive months against agreed thresholds.
- Structural data changes (schema, indicator redefinitions) undermining learned relationships.
- Documented bias not correctable by retraining/mitigation within acceptable timelines.
- Ethical or compliance risks (e.g., POPIA concerns) or misalignment with policy objectives.

### 5.2 Retirement process
1) Generate a Final Performance Report (last 3 months of monitoring and drift results; subgroup analysis; root-cause notes).
2) Notify stakeholders (Data Scientist, Engineer, BI Manager, end-user representatives); hold a formal review.
3) Archive the model artefacts, registry entry, and relevant logs (MongoDB extracts) under `archives/models/hdpsa_randomforest/`.
4) Disable the Flask prediction endpoint for the retired version and remove links from the Next.js dashboard.
5) Record the decision in `02_Project/Milestone_5/retirement_log.json`.

Retirement_log.json entries record:
- `version`: e.g., `v1.3.0`.
- `date`: ISO date of retirement decision (e.g., `2025-09-30`).
- `reason`: summary (e.g., sustained drift PSI 0.35 and R^2 < 0.92).
- `evidence`: list of report file paths.
- `stakeholders`: emails or IDs of sign-off participants.
- `actions`: final operational steps taken.
- `next_steps`: follow-up actions or replacement strategy.

Replacement and transparency measures:
- Maintain a fallback heuristic (baseline mean plus policy offsets) accessible at `/api/predict_fallback` to cover gaps while transitioning between models.
- Issue deprecation notices at least 30 days before endpoint disablement via Slack, email, and dashboard banners.
- Publish a `Retired Models Index` in `02_Project/Documentation/Retired_Models/index.html` summarising each retirement rationale and successor version.

**Key outputs / artifacts:**
- Final Performance Report, deprecation notices, and retirement_log.json entries.
- Fallback endpoint documentation and monitoring adjustments.
- Retired Models Index updated for transparency and compliance audits.

## 6. Business Continuity & Quarterly Governance
Robust continuity practices ensure reliability in face of operational and contextual change.

- Backups and recovery: daily MongoDB backups; weekly verification restores in a staging environment; RTO 4 hours, RPO 24 hours.
- SLAs/OLAs: Flask API uptime >= 99.5%, p95 latency <= 500 ms; monitoring jobs complete by 09:00 SAST on run day.
- Runbook drills: quarterly exercises for rollback, failover, and emergency disablement of the endpoint.
- Access control: role-based permissions for model promotion and registry edits; audit trails for all changes.

Quarterly governance focus:

| Quarter | Focus | Outcome |
|--------|-------|---------|
| Q1 | Retraining & rollback drill | Validated runbook |
| Q2 | Backup & disaster recovery test | Restores verified |
| Q3 | Documentation & registry audit | Metadata updated |
| Q4 | Lifecycle and roadmap review | Continue / Redevelop / Retire |

RACI overview:

| Activity | Responsible | Accountable | Consulted | Informed |
|----------|-------------|-------------|-----------|----------|
| Monitoring metric review | Data Scientist | BI Manager | Engineer | QA Lead |
| Automation reliability | Engineer | BI Manager | Data Scientist | QA Lead |
| Quarterly governance meeting | BI Manager | BI Manager | Data Scientist, Engineer | Stakeholders |
| Model promotion decision | Data Scientist | BI Manager | Engineer, QA Lead | Stakeholders |

Incident severity definitions:
- **Info:** Single amber breach or non-blocking anomaly; log and review next business day.
- **Warning:** Threshold breach for one cycle or automation failure requiring manual intervention; response within 24 hours.
- **Critical:** Consecutive breaches, checksum mismatch, or POPIA risk; immediate escalation and potential endpoint freeze.

Alignment with institutional ethics: actions comply with Belgium Campus iTversity Data Ethics Charter (2024) and POPIA Section 19 (Security Safeguards).

**Key outputs / artifacts:**
- Governance minutes and severity logs stored in `02_Project/Governance/`.
- RACI matrix appended to the operations handbook.
- Ethics alignment statement referenced in quarterly reviews.

## 7. Ethical and Bias Monitoring
Before any redeployment:
- Compute subgroup error parity (MAE/RMSE) across provinces and urban/rural splits; require deviations <= 25%.
- Check calibration (e.g., reliability curves) for key segments to ensure predictions are not systematically biased.
- Review model explanations (e.g., permutation importance stability) to confirm that key drivers remain policy-relevant and plausible.
- Document bias mitigations (reweighting, stratified training, feature review) where needed and record in release notes.
- Validate compliance with POPIA: confirm that data sources remain de-identified and access controls are enforced.
- Undertake sensitivity analysis for under-represented provinces and demographic segments; document any uplift or degradation beyond ±5%.
- Store SHAP and permutation plots for each release under `02_Project/Documentation/Explainability/`.
- Secure stakeholder fairness review sign-off by the BI Manager before deployment.

**Key outputs / artifacts:**
- Fairness assessment packs including parity tables, sensitivity analysis, and explainability plots.
- POPIA compliance checklist updated quarterly.
- Stakeholder review memo confirming promotion readiness.

## 8. Integration with Monitoring Workflow
Monitoring outputs are channelled through an advanced yet compact n8n workflow that keeps all maintenance actions traceable. Figure 1 (`02_Project/Diagrams/HDPSA_Monitoring_and_Maintenance_Workflow.drawio`) shows the node-level dataflow.

### 8.1 Trigger layer
- Weekly Cron (Monday 07:00 SAST) with manual rerun; pulls metrics from Flask `/api/metrics/window`.
- All workflow runs are timestamped and archived under `/monitoring_reports/logs/`.

### 8.2 Gate layer
- Check Thresholds function evaluates RMSE, MAE, R^2, PSI, and KS outputs.
- Seven-day debounce suppresses duplicate incidents; batched notifications consolidate alerts per window.
- Error handling: if n8n or email dispatch fails, a fallback script writes events to `/monitoring_reports/logs/fallback.log` and retries within 30 minutes.

### 8.3 Routing layer
- IF node directs `alert = true` runs to the incident branch and `alert = false` runs to the OK branch.
- Notification throttling limits critical alerts to two per hour to prevent stakeholder fatigue.

### 8.4 Incident response branch
- Drift detection node enriches the payload with per-feature KS outcomes and aggregate PSI to evidence the shift.
- Auto retrain node calls Flask admin or triggers GitHub Actions with the incident payload for auditable retraining jobs.
- Dashboard refresh node revalidates Next.js monitoring pages so stakeholders see live status.
- Report writer saves timestamped Markdown summaries to `/monitoring_reports/` and inserts metadata into MongoDB.
- Notification node sends Slack and email updates with key metrics, drift signals, and report links.

### 8.5 Steady-state branch
- OK log builder stores metrics, window, sample size, and model version with status `green`.
- MongoDB insert maintains a rolling history feeding dashboard trend lines and analytics notebooks.

### 8.6 Escalation and promotion loop
- Two consecutive incidents automatically open a maintenance ticket and raise `workflow_dispatch` inputs (`window`, `model_version`, `reason`) for the retraining pipeline.
- GitHub Actions stages: environment setup, rerun of Milestone 2-4 assets, metric/fairness gate, semantic version tagging, registry update, deployment to Flask, and dashboard revalidation.
- Flask admin endpoints (`/api/admin/retrain`, `/api/admin/promote`, `/api/admin/rollback`) remain role-protected; every call logs actor, reason, ticket ID, and checksum hash in MongoDB for compliance.

**Key outputs / artifacts:**
- Workflow log archives with timestamps and retry metadata.
- Incident and OK branch summaries saved to MongoDB collections.
- Draw.io workflow diagram and operations runbook cross-references (Figure 1: "HDPSA Monitoring & Maintenance Workflow").

## 9. Conclusion
This Maintenance Plan operationalises a disciplined, auditable path from monitoring signals to appropriate actions: retraining, versioning, or retirement. By integrating alerts from n8n, automated retraining through GitHub Actions, and controlled promotion via Flask and Next.js, the HDPSA Random Forest model remains reliable and aligned with evolving data and policy contexts. The governance cadence and ethical safeguards ensure that each deployment not only improves technical metrics but upholds fairness, transparency, and compliance throughout the model’s lifecycle.

By maintaining a governed feedback loop between monitoring insights and retraining actions, HDPSA ensures sustained policy relevance for South Africa’s evolving health-data landscape.

## 10. Documentation & Reporting Alignment
### 10.1 Deliverable alignment
| Plan section | Milestone 5 rubric criterion | Evidence artifact |
|--------------|-----------------------------|-------------------|
| Sections 2-3 | Deployment Strategy & Tools | Monitoring Plan cross-reference, retraining workflow logs |
| Sections 4-5 | Monitoring & Maintenance | Model registry updates, retirement process artefacts |
| Sections 6-7 | Governance & Ethics | Quarterly review minutes, fairness and POPIA documentation |
| Section 8 | Monitoring Automation | n8n workflow logs, GitHub Actions gates |
| Section 10 | Documentation Quality | Retired Models Index, technology stack reference |

### 10.2 Testing, reporting, and traceability
- Smoke tests and regression checks recorded in `02_Project/Testing/Smoke/` after each retrain run.
- Workflow incident reports appended to `02_Project/Monitoring/incident_register.csv`.
- Deliverable evidence archive maintained in `02_Project/Documentation/` with cross-links to rubric categories.

**Key outputs / artifacts:**
- Deliverable alignment table for assessors.
- Centralised evidence archive with traceable file paths.
- Updated testing log referencing smoke-test results.

### 10.3 Technology stack reference
| Component | Version |
|-----------|---------|
| Python | 3.11 |
| R | 4.3 |
| Flask | 3.0 |
| Next.js | 13 |
| MongoDB | 6.0 |
| n8n | 1.28 |
| GitHub Actions Runner | Ubuntu 22.04 |








