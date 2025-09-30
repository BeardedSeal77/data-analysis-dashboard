# Milestone 3 Task Guide

## Data Overview
- **Datasets**: 7 South African health datasets (609 records, 11 features)
- **Target**: Continuous health outcome values (`value_log_scaled`)
- **Features**: Mixed categorical/numerical health indicators

---

## Task 1: Model Selection and Justification
**Assigned to: [Member Name]**

### Selected Model: Random Forest Regression

### Justification Framework:
- **Data Compatibility**: 609 records optimal for ensemble methods
- **Feature Handling**: Excels with mixed categorical/numerical data
- **Interpretability**: Variable importance crucial for health policy
- **Robustness**: No distribution assumptions, handles missing data

### Supporting Models (Background Implementation):
- **Multiple Linear Regression**: Baseline model for deployment fallback
- **XGBoost**: High-performance alternative for complex scenarios
- **Note**: Supporting models built but not documented in milestone tasks

### Deliverable:
- Random Forest selection rationale (3-4 key points)
- Technical assumptions validation for Random Forest
- Brief justification why Random Forest chosen as primary model

---

<div style="page-break-before: always;"></div>

## Task 2: Random Forest Test Design
**Assigned to: [Member Name]**

### Data Strategy:
- **Split**: 75% training (426 records) / 20% testing (122 records) / 5% validation (30 records)
- **Sampling**: Stratified by health indicator types
- **Validation**: 5-fold cross-validation on training set

### Evaluation Metrics:
- **Primary**: RMSE, MAE, R-squared
- **Random Forest Specific**: Out-of-bag (OOB) error
- **Diagnostic**: Variable importance scores

### Quality Framework:
- OOB error convergence analysis
- Cross-validation performance stability
- Prediction interval assessment

### Deliverable:
- Data splitting procedure
- Evaluation metric definitions
- Validation strategy documentation

---

<div style="page-break-before: always;"></div>

## Task 3: Random Forest Implementation
**Assigned to: ED Cullen**

### Implementation Requirements:
- Load `modeling_features.csv` from `02_Project/Data/03_Scaled/`
- Implement Random Forest regression in R
- Document all parameter selections

### Parameter Optimization:
- **ntree**: 500-2000 trees (test convergence)
- **mtry**: sqrt(features) to features/3 (tune via grid search)
- **nodesize**: 1-10 (optimize for sample size)

### Development Process:
1. Baseline model with default parameters
2. Systematic hyperparameter tuning
3. Final model training on optimized parameters

### Deliverable:
- Complete R implementation
- Parameter tuning documentation
- Model performance summary

---

<div style="page-break-before: always;"></div>

## Task 4: Random Forest Assessment
**Assigned to: Llewellyn Fourie**

### Performance Analysis:
- **Statistical**: RMSE, MAE, R-squared on test set
- **Diagnostic**: OOB error analysis and convergence
- **Validation**: Cross-validation performance consistency

### Required Visualizations:
- Variable importance plot
- OOB error convergence plot
- Predicted vs actual scatter plot
- Residual analysis plots

### Health Domain Interpretation:
- Feature importance rankings with health context
- Policy implications of key predictors
- Model reliability for decision-making
- Limitations and recommendations

### Deliverable:
- Performance report with visualizations
- Health domain analysis
- Model limitations assessment
- Policy recommendations
