# Milestone 5: Deployment and Monitoring/Maintenance

Concise guide for Milestone 5 tasks based on official requirements.

## Scope

Milestone 5 covers CRISP-DM Deployment phase:
- **Task 1:** Plan Deployment + Deploy model
- **Task 2:** Plan Monitoring and Maintenance

**Note:** Final Report and Project Review are Milestone 6.

## Deliverables

1. Deployment and Maintenance Plan (PDF)
2. Model deployment demo (Next.js + Flask + R)

## Grading

| Criteria | Weight |
|----------|--------|
| Deployment Strategy | 10 |
| Deployment Tools Research and Selection | 10 |
| Model Deployment Interface | 15 |
| Monitoring and Maintenance Plan | 10 |
| Documentation Quality | 5 |
| **TOTAL** | **50** |

---

## Input Artifacts

**Model (Milestone 3):**
- `02_Project/Milestone_3/Task_03/outputs/final_random_forest_model.rds`
- `02_Project/Milestone_3/Task_03/Task_03.Rmd`

**Data:**
- `02_Project/Data/03_Scaled/modeling_features.csv`
- `02_Project/Data/03_Scaled/feature_metadata.csv`
- `02_Project/Data/04_Split/train_data.csv`, `test_data.csv`

**Evaluation (Milestone 4):**
- `02_Project/Milestone_4/Task_1.md` (business alignment)
- `02_Project/Milestone_4/Task_2.md` (process review)
- `02_Project/Milestone_4/GroupA_Milestone_04.Rmd`

**Infrastructure:**
- `02_Project/api/app.py` (Flask API)
- `app/**` (Next.js frontend)

---

## Deployment Approach

**Next.js + Flask + R Integration**

Leverages existing infrastructure: Next.js frontend → Flask API → R model service. Web-based, scalable, professional UI.

---

# Task 1: Plan Deployment (Business Strategy)

Maps to Official Task 1 - Strategy and planning portion.

## 1.1 Stakeholders and Objectives
- Who will use the model? (policy analysts, health planners, researchers)
- What decisions will it support? (health index prediction, resource allocation)
- Expected business value? (data-driven decisions, reduced analysis time)

## 1.2 Summarize Deployable Results
- Model type and performance metrics (from Milestone 4)
- Key predictive features (from Milestone 4)
- Target variable and output format
- Model limitations and appropriate use cases

## 1.3 Research Deployment Tools
Compare 3 options:

| Tool | Pros | Cons | Effort |
|------|------|------|--------|
| Next.js + Flask + R | Existing infrastructure, scalable, professional UI | Integration work | Medium |
| R Shiny | Native R, quick prototype | Separate stack, limited scalability | Low |
| Streamlit | Python-native, simple | Requires model conversion, not leveraging Next.js | Medium |

## 1.4 Justify Tool Selection
Why Next.js + Flask + R:
- Existing infrastructure (Next.js frontend, Flask API operational)
- Team familiarity with stack
- Scalable microservices architecture
- No additional licensing costs
- Easy to extend and maintain

## 1.5 Knowledge Propagation
- Access: Web URL (local or deployed)
- Documentation: In-app help, README, user guide
- Support: Email, GitHub issues, help desk

## 1.6 Benefits Measurement
- Usage metrics: prediction count, active users, session frequency
- Business impact: decision accuracy, time saved, adoption rate
- Review cadence: weekly (first month), monthly thereafter

---

# Task 2: Deploy Model (Technical Implementation)

Maps to Official Task 1 - Deployment execution portion.

## 2.1 Architecture

**Three-layer system:**
1. **Frontend (Next.js):** Input form, display results (`app/model-predictor/page.tsx`)
2. **Backend (Flask):** `/api/predict` endpoint, validation (`02_Project/api/app.py`)
3. **Model Service (R):** Load `.rds`, preprocess, predict (`02_Project/api/model_service.R`)

**Data flow:** User input → Next.js → Flask → R script → prediction → response → UI

## 2.2 Implementation Checklist

**Build:**
- R script: loads model, applies preprocessing, returns JSON prediction
- Flask endpoint: receives JSON, calls R script, returns result
- Next.js page: form with 4-6 key features, displays prediction

**Features:**
- User-controlled inputs: 4-6 top predictors from M4 (e.g., precision, is_preferred, sample_size_tier)
- Defaults: training means/modes for remaining features
- Preprocessing: match training pipeline (scaling, encoding, feature order)

## 2.3 README Requirements
- Prerequisites: Node.js, Python, R versions and packages
- Installation: setup for all three layers
- Running locally: commands to start Flask and Next.js
- Example usage: sample inputs and outputs
- Known limitations: model assumptions, valid ranges

---

# Task 3: Plan Monitoring

Maps to Official Task 2 - Monitoring portion.

## 3.1 Performance Monitoring
- Metrics: RMSE, MAE, R-squared, prediction distribution
- Baseline: `test_data.csv` metrics from M4
- Thresholds: alert if RMSE increases >10%
- Cadence: weekly (first month), monthly thereafter
- Data collection: log predictions with timestamps

## 3.2 Drift Detection
**Input drift:**
- Compare prediction inputs to training distributions
- Statistical tests: KS test, Population Stability Index
- Monitor key features from M4

**Output drift:**
- Track prediction mean/variance over time
- Alert if distributions shift significantly

## 3.3 Dynamic Aspects
**Data environment:**
- New data sources, indicator definition changes, methodology updates

**Business environment:**
- Stakeholder priority shifts, regulatory changes, updated success criteria

**Monitoring:**
- Assign owners for each aspect
- Quarterly review schedule
- Change notification process

---

# Task 4: Plan Maintenance

Maps to Official Task 2 - Maintenance portion.

## 4.1 Retraining Triggers
- Performance degradation (below threshold for 2+ cycles)
- Significant input drift detected
- New data available (quarterly/bi-annual)
- Changes in business objectives or indicator definitions

**Process:**
1. Collect new data
2. Re-run data prep pipeline (M2)
3. Re-run modeling pipeline (M3)
4. Evaluate new model (M4)
5. Deploy if performance improves

**Versioning:**
- Version models (v1.0.0, v2.0.0, etc.)
- Log training data dates and hyperparameters
- Archive last 3 versions

## 4.2 Sunset Criteria
**Stop using model if:**
- Performance below threshold for 2+ consecutive periods
- Fundamental changes to indicators or data sources
- Major changes to business problem
- Evidence of bias or ethical concerns

**Process:**
- Document reason, notify stakeholders
- Remove from production, archive
- Initiate new project or revert to manual approach

## 4.3 Business Objectives Evolution
- Document initial problem from Milestone 1
- Quarterly review: does model still address current needs?
- Update documentation if objectives change
- Re-evaluate model if objectives shift significantly
