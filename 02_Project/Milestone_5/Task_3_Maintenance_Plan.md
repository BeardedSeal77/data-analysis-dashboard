# Task 3 — Maintenance Plan for HDPSA Random Forest (CRISP-DM Deployment)

## 1. Objective
Maintenance, within the CRISP-DM Deployment phase, is the set of practices that ensure the HDPSA (Health and Demographic Patterns in South Africa) Random Forest model continues to deliver reliable, fair, and business-aligned predictions over time. This Maintenance Plan defines how the team will respond to monitoring signals, retrain and version the model, manage configuration and documentation, and make lifecycle decisions (continue, update, or retire) in a controlled and auditable way.

## 2. Maintenance Framework Overview
Maintenance is tightly coupled with monitoring. The Monitoring Plan (see `02_Project/Milestone_5/Task_2_Monitoring_Plan.md`, Sections 2–5) continuously computes performance metrics and drift indicators, sending alerts via n8n when thresholds are breached. This Maintenance Plan consumes those outputs and prescribes actions:
- Retrain when performance degrades (e.g., RMSE > 0.07, R² < 0.95), drift exceeds thresholds (e.g., PSI > 0.2, KS p < 0.05), or when material new data or business changes arise.
- Version every deployed model using semantic versioning and maintain a registry for provenance.
- Retire the model when it persistently underperforms, becomes misaligned with the business context, or presents ethical/compliance risks.

Decision flow (simplified):
- Single red alert → ad-hoc investigation; if confirmed, schedule retraining.
- Two consecutive amber or one red for performance or drift → trigger retraining workflow.
- Three months of degraded performance or substantive context change → consider retirement or full redevelopment.

## 3. Model Retraining Procedures
### 3.1 Triggers
- Performance degradation: production RMSE > 0.07 or MAE > 0.05, or R² < 0.95 (based on weekly metrics) for two consecutive cycles.
- Data drift: PSI > 0.2 on key features or KS p < 0.05 for multiple features; output mean/variance shift > 15%.
- New data: availability of additional, representative data (e.g., quarterly national release) requiring incorporation.
- Business objective change: revised KPI definitions, new policy focus, or updated success criteria.

### 3.2 Process (aligned to CRISP-DM)
1) Collect and reconcile new/updated data → re-run Milestone 2 (Data Preparation) pipeline to regenerate cleaned, scaled, and split data.
2) Re-run Milestone 3 (Modeling) pipeline, preserving feature engineering and training procedures for Random Forest; perform hyperparameter tuning if warranted.
3) Re-run Milestone 4 (Evaluation) suite on holdout/validation sets; compute RMSE, MAE, R², fairness parity metrics, and calibration.
4) Compare to the production baseline and the last deployed version’s metrics; conduct error analysis for key subgroups (province, urban/rural).
5) If performance improves materially and fairness checks pass, package and deploy a new version; otherwise, iterate or revert.

### 3.3 Automation entry points
- n8n creates a retraining issue and can call a Flask admin endpoint (e.g., `/api/admin/retrain`) or dispatch a GitHub Actions workflow to run the training scripts (R + Python orchestration as needed).
- The training workflow writes candidate metrics and artefacts to a staging area; promotion to production requires BI Manager approval.

### 3.4 Example safeguard code snippet
```python
# Pseudo-code running in an n8n Function or Flask admin task
# Safeguard thresholds from Monitoring Plan
ALERT_RMSE = 0.07
ALERT_R2 = 0.95
ALERT_PSI = 0.2

def should_retrain(metrics: dict, drift: dict) -> bool:
    rmse_ok = metrics.get("rmse", 0.0) <= ALERT_RMSE
    r2_ok = metrics.get("r2", 1.0) >= ALERT_R2
    psi_ok = drift.get("psi", 0.0) <= ALERT_PSI
    return not (rmse_ok and r2_ok and psi_ok)

if should_retrain({"rmse": rmse, "r2": r2}, {"psi": psi}):
    trigger_retrain("hdpsa_randomforest_vX.Y.Z")
```

## 4. Model Versioning Strategy
### 4.1 Semantic versioning
- Use `vMAJOR.MINOR.PATCH` (e.g., `v1.2.0`).
  - MAJOR: breaking changes to data schema, target, or architecture.
  - MINOR: improvements from new data, tuning, or non-breaking feature updates.
  - PATCH: hotfixes (e.g., bug in preprocessing) with no material metric change.

### 4.2 Model registry
- Maintain `02_Project/Milestone_5/model_registry.csv` with at least the following columns:
  - `version`, `date`, `dataset_hash`, `training_date_range`, `featureset_hash`, `hyperparameters`, `rmse`, `mae`, `r2`, `psi`, `owner`, `artifact_uri`, `notes`.
- The `dataset_hash` and `featureset_hash` are SHA-256 checksums of canonicalised CSV/Parquet and feature lists to ensure provenance.
- `artifact_uri` points to the deployed asset location (e.g., `models/hdpsa_randomforest/v1.2.0/model.rds`).

### 4.3 Retention
- Keep only the last 3 versions readily accessible: `active` (current), `backup` (last), `archived` (previous). Older versions are moved to cold storage.
- Each version bundle includes: model artefact (`.rds`), preprocessing pipeline specs, training notebook/logs, evaluation report, and monitoring snapshot at deployment time.

### 4.4 Promotion checklist
- Metrics equal or better than baseline on validation and subgroup analysis.
- No fairness parity breach (> 25% subgroup MAE deviation).
- Successful canary validation in staging via Flask + Next.js integration tests.
- Registry updated; release notes added; rollback plan documented.

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

Example `retirement_log.json` entry:
```json
{
  "version": "v1.3.0",
  "date": "2025-09-30",
  "reason": "Sustained drift (PSI 0.35) and R² < 0.92",
  "evidence": ["/monitoring_reports/drift_report_2025-07-01.html", "/monitoring_reports/drift_report_2025-08-01.html", "/monitoring_reports/drift_report_2025-09-01.html"],
  "stakeholders": ["data.scientist@org", "engineer@org", "bi.manager@org"],
  "actions": ["Endpoint disabled", "Artefacts archived", "Issue #312 closed"],
  "next_steps": "Initiate new modelling project with updated indicators"
}
```

## 6. Business Continuity & Quarterly Governance
Robust continuity practices ensure reliability in face of operational and contextual change.

- Backups and recovery: daily MongoDB backups; weekly verification restores in a staging environment; RTO 4 hours, RPO 24 hours.
- SLAs/OLAs: Flask API uptime ≥ 99.5%, p95 latency ≤ 500 ms; monitoring jobs complete by 09:00 SAST on run day.
- Runbook drills: quarterly exercises for rollback, failover, and emergency disablement of the endpoint.
- Access control: role-based permissions for model promotion and registry edits; audit trails for all changes.

Quarterly governance focus:

| Quarter | Focus | Outcome |
|--------|-------|---------|
| Q1 | Retraining & rollback drill | Validated runbook |
| Q2 | Backup & disaster recovery test | Restores verified |
| Q3 | Documentation & registry audit | Metadata updated |
| Q4 | Lifecycle and roadmap review | Continue / Redevelop / Retire |

## 7. Ethical and Bias Monitoring
Before any redeployment:
- Compute subgroup error parity (MAE/RMSE) across provinces and urban/rural splits; require deviations ≤ 25%.
- Check calibration (e.g., reliability curves) for key segments to ensure predictions are not systematically biased.
- Review model explanations (e.g., permutation importance stability) to confirm that key drivers remain policy-relevant and plausible.
- Document bias mitigations (reweighting, stratified training, feature review) where needed and record in release notes.
- Validate compliance with POPIA: confirm that data sources remain de-identified and access controls are enforced.

## 8. Integration with Monitoring Workflow
Monitoring and maintenance are automated end-to-end with controlled approvals.

- n8n escalation: on two consecutive threshold breaches, trigger a `workflow_dispatch` to GitHub Actions with inputs (`window`, `model_version`, `reason`).
- GitHub Actions (high-level stages):
  1) Setup R, Python, and dependencies.
  2) Run M2 (Data Preparation) scripts → produce `03_Scaled` and `04_Split` datasets.
  3) Run M3 (Modeling) training → save candidate `final_random_forest_model.rds`.
  4) Run M4 (Evaluation) → compute metrics and fairness reports; upload as artefacts.
  5) Gate on metrics and fairness thresholds; if pass, tag `vX.Y.Z`, update `model_registry.csv`, and create a release.
  6) Deploy: publish the artefact to the Flask model service and revalidate the Next.js dashboard.
- Flask admin endpoints: `/api/admin/retrain`, `/api/admin/promote`, `/api/admin/rollback` protected by admin tokens; all actions logged to MongoDB with `actor`, `reason`, and `change_ticket`.

Event flow (summary):
```
[Monitoring Alerts] → [n8n Gate] → (two consecutive)
  → [GitHub Actions retraining pipeline]
      → [Candidate metrics + fairness]
          → (pass) [Tag + Registry update] → [Deploy]
          → (fail) [Notify + Attach reports] → [Iteration]
```


## 10. Conclusion
This Maintenance Plan operationalises a disciplined, auditable path from monitoring signals to appropriate actions: retraining, versioning, or retirement. By integrating alerts from n8n, automated retraining through GitHub Actions, and controlled promotion via Flask and Next.js, the HDPSA Random Forest model remains reliable and aligned with evolving data and policy contexts. The governance cadence and ethical safeguards ensure that each deployment not only improves technical metrics but upholds fairness, transparency, and compliance throughout the model’s lifecycle.

