## Determine the Next Steps

### Context Recap
This project applies the CRISP-DM methodology to the Health and Demographic Profile of South Africa (HDPSA), developing a Random Forest regression model to predict a log-scaled health outcome (value_log_scaled). The evidence base supporting decisions at this Evaluation phase comprises three elements, each serving a distinct function and each essential to a defensible decision about deployment or iteration (Chapman et al. 2000  Kuhn & Johnson 2019).

- Scaled data for modelling. The final engineered dataset in the Scaled Data folder consolidates cleaned demographic and health indicators into approximately 31 numeric and categorical features. These features capture core policy-relevant domains—water access, sanitation, literacy, and healthcare access—prepared for learning through centring/scaling and encoding where appropriate. This table defines the feature space and thus determines both the stability and interpretability of the model.
- Reproducible data splits. The Split Data folder contains the training, validation, and test partitions. These partitions ensure consistent, reproducible estimation of performance, provided that the test set remains untouched until final evaluation and that all transformation steps are fitted on the training subset only. This discipline protects against optimistic bias and guards model credibility.
- Modelling outputs and artefacts. The Milestone 3 outputs include hyperparameter tuning logs (e.g., for mtry and node size) and a final model artefact. Together they document how the model was selected, with final parameters near mtry ≈ 9, nodesize ≈ 2, and ntree = 750 (Breiman 2001). These artefacts also make transparent any assumptions that must be validated in this milestone, including the risk of data leakage if preprocessing was fit before the train–validation–test separation or if the test set guided tuning.

Milestone 3 reported strong predictive performance on the log scale (RMSE = 0.0554  MAE = 0.0381  R² = 0.997) on a sample of roughly 600 records. Feature rankings foreground water and sanitation access, literacy, and healthcare access—determinants aligned with health-policy priorities. The present decision focuses on whether these results are sufficiently robust, explainable, and ethically appropriate to justify deployment now or after a short iteration.

---

### Options Analysis

#### Option 1: Deploy (Production or Limited Pilot)
- Rationale. The model currently meets stringent thresholds on the selected scale and offers clear policy relevance by surfacing interpretable drivers. A limited pilot would enable controlled, real-world validation while informing resource allocation.
- Benefits. Accelerates value capture  establishes monitoring in an operational setting  leverages existing artefacts with minimal rework.
- Constraints. Without a brief validation cycle, deployment risks propagating optimistic metrics if leakage or inadvertent test-set tuning occurred. Given the modest dataset size, external validity must be demonstrated under unbiased estimation procedures .
- Safeguards. Pre-deployment audit of split integrity and transformation order  ethical review and subgroup checks  monitoring with rollback controls.

#### Option 2: Iterate (Short Validation Cycle) — Recommended
- Rationale. A two-week, time-boxed iteration will close methodological risks and produce unbiased estimates via cross-validation, confirm separation of train/validation/test, quantify the model’s value-add versus simple baselines, and deepen interpretability (Chapman et al. 2000  Ribeiro et al. 2016).
- Benefits. Strengthens credibility  reduces risk of optimistic bias  provides robust evidence for stakeholders  improves transparency via diagnostics and stability analyses.
- Constraints. Short delay to deployment  limited additional analytical effort.
- Safeguards. Strict test-set holdout  pipeline-based preprocessing fitted on training data only  full audit trail of transformations and decisions.

#### Option 3: Abandon/Restart
- Rationale. Consider only if leakage is confirmed and cannot be mitigated with current data, or if project objectives materially change.
- Drawbacks. Current results are promising and policy-aligned  abandoning would discard a strong foundation for impact.
- Conditions. Irreparable data contamination, significant scope change, or sustained misalignment with stakeholder needs.

---

### Final Recommendation
Proceed with a short, focused iteration to validate methodology, then advance to a controlled pilot if acceptance criteria are met on an untouched hold-out set. This pathway balances policy urgency with methodological rigour and ethical assurance, ensuring that deployment decisions rest on defensible, transparent evidence.

Acceptance criteria after the validation cycle:
- RMSE ≤ 0.06, MAE ≤ 0.04, R² ≥ 0.95 on the log-scaled target.
- Stable top predictors across folds  no evidence of leakage  simple baselines underperform the Random Forest by a meaningful margin.

---

### Quantitative Evidence

| Metric    | Target Threshold | Milestone 3 Final | Meets Goal? |
|-----------|------------------|-------------------|-------------|
| RMSE      | ≤ 0.06           | 0.0554            | Yes         |
| MAE       | ≤ 0.04           | 0.0381            | Yes         |
| R-squared | ≥ 0.95           | 0.997             | Yes         |

These metrics justify advancing to a short iteration prior to pilot deployment.

---

### Traceability to Business Goals
- Predictive accuracy for prioritisation. R-squared of 0.997 exceeds the 0.70 benchmark, supporting precise identification of high-risk provinces for targeted intervention.
- Operational reliability via low error. RMSE of 0.0554 and MAE of 0.0381 meet thresholds consistent with policy planning and scenario analysis.
- Stakeholder interpretability. Feature rankings emphasise water, sanitation, literacy, and healthcare access—determinants that align with policy levers and enable transparent communication.
- Robustness under data constraints. The forthcoming iteration will confirm generalisation under strict separation of data partitions and proper transformation order.

---

### Action Plan

#### Phase A — Audit and Rebuild (Week 1)
- Validate partition integrity. Confirm disjoint indices and immutability of training, validation, and test splits  document checks and outcomes.
- Enforce preprocessing discipline. Ensure centring/scaling and encoding are fitted on training data only and then applied to validation/test without refitting.
- Re-tune via cross-validation. Replace any test-guided tuning with k-fold cross-validation  reserve the test set strictly for the final estimate.
- Deliverables. Audit report  updated tuning logs  revised model artefact  documented transformation parameters.

#### Phase B — Re-validate and Compare (Week 2)
- Finalise the Random Forest under validated procedures  produce test-set estimates on the untouched hold-out.
- Establish baselines. Train simple comparators (mean/median predictor and linear regression) and report performance deltas to demonstrate value-add.
- Diagnostics and interpretability. Provide residual plots, error summaries, and permutation- or LIME-based explanations to evidence accuracy and explainability (Ribeiro et al. 2016).
- Deliverables. Metrics table with acceptance decision  diagnostics pack  interpretability summary  updated risk register.

#### Phase C — Pilot Deployment (Week 3, conditional)
- Package and governance. Version the model artefact with metadata, schema, and usage constraints  define rollback plan and access controls.
- Monitoring. Implement metric tracking (RMSE/MAE/R²), data drift alerts, and periodic backtesting  schedule governance reviews.
- Deliverables. Deployment checklist  monitoring and escalation plan  stakeholder sign-off.

---

### Implementation Notes
- Pipelines and guards. Use a pipeline-oriented workflow to guarantee transformation order and separation of concerns  add assertions for disjoint indices and exclusion of target-derived signals from features.
- Data contracts. Fix the schema (types, ranges, categorical levels) and define handling rules for missing or novel values to ensure stable inference.
- Interpretability. Report permutation importance and partial dependence/ICE visualisations for top predictors to provide stable, policy-aligned explanations.
- Calibration. Where appropriate, apply post-hoc calibration to improve alignment between predicted and observed scales, documented with before/after metrics.

---

### Risks & Mitigations
- Potential data leakage. Mitigate via pipeline-enforced preprocessing on training only  audit and log all transformation fits  re-estimate metrics under validated procedures .
- Test-set contamination. Reserve test data exclusively for the final estimate  perform all tuning and selection within cross-validation.
- Small sample size. Use cross-validation with uncertainty estimates  monitor post-deployment performance and drift  retrain on a cadence aligned with data refreshes.
- Distribution shift. Compare training and pilot-period covariate distributions  define triggers for retraining or model fallback.

---

### Ethics & Bias
Conduct subgroup performance and explanatory stability checks across province, gender, and urban–rural strata. If systematic under- or over-prediction is detected for specific subgroups, mitigation will include recalibration, feature review, or constrained modelling choices. Explanations should be communicated in plain language to support equitable, accountable policy use (Ribeiro et al. 2016).

---

### Reproducibility & Version Control
Version all scripts, data snapshots, and model artefacts with tagged commits, record environments via session information to ensure reproducibility. Each result must be traceable to an exact configuration, dataset snapshot, and decision log, consistent with CRISP-DM documentation standards .

---

### Roles & Accountability
- Phase A — QA Audit: Llewellyn Fourie — Leakage checks, split integrity, and data validation.
- Phase B — Re-Validation: Juan Oosthuizen — Cross-validation, baselines, diagnostics, and acceptance decision.
- Phase C — Pilot: Erin Cullen and Qhamaninande Ndlume — Packaging, deployment controls, monitoring, and rollback readiness.

---

### Confidence Intervals
Report 95% confidence intervals for test-set metrics using bootstrap resampling of residuals or cross-validated standard errors. These intervals provide decision-makers with uncertainty bounds appropriate for small datasets and guard against over-interpretation of point estimates.

---

### CRISP-DM Alignment
These steps operationalise the Evaluation phase by validating results against business objectives, confirming methodological soundness, and planning action. The transition to Deployment is contingent on passing the audit and re-validation gates, ensuring the model is accurate, reliable, explainable, and ethically suitable for policy use .

---