# Task 2: Random Forest Test Design

## 1. Data Splitting Strategy

### 1.1 Proposed Splits
- **Total records:** 609
- **Training Set:** 75% (457 records)
- **Testing Set:** 20% (122 records)
- **Validation Set:** 5% (30 records)

### 1.2 Why these splits
- Using a 75% training split provides enough data for Random Forest to learn patterns.
- Using a 20% test set gives us reliable performance estimates.
- We allocate 5% for final model verification.

### 1.3 Sampling Method
Use stratified sampling by health indicator categories.
- This ensures representative distribution across all the subsets.
- This maintains the proportions of different health outcome ranges.

### 1.4 Implementation Approach
- Make use of `createDataPartition()` from the caret package in R.
- Set a seed to ensure reproducibility.
- Make sure to document the seed value that was used.

## 2. Evaluation Metrics

### 2.1 Primary Metrics
**RMSE (Root Mean Squared Error)**
- Measures the average prediction error in original units.
- Penalizes larger errors more heavily.
- We choose to use RMSE as it is critical for health outcomes where large errors could impact policy decisions.

**MAE (Mean Absolute Error)**
- The average absolute difference between predictions and the actual values.
- More interpretable than RMSE.
- It is relevant as it is easy to explain to health policy stakeholders.

**R-Squared (R²)**
- The proportion of variance explained by the model (0-1 scale).
- It shows how well the model captures the health outcome patterns.

### 2.2 Random Forest Specific Metrics

**OOB (Out-of-Bag) Error**
- Is one of Random Forest's built in validation metrics.
- Uses samples that aren't included in the bootstrap samples of each tree.
- It provides us with an unbiased error estimate without needing a separate validation set.

**Variable Importance Scores**
- It ranks the features by their contribution to the predictions.
- It identifies the key health indicators for policy to focus on.

## 3. Validation Strategy
Having a proper validation strategy is essential to ensure the model generalizes well outside of the training data. We will use the following approach:

### 3.1 Why 5-fold?
- It provides a strong balance between computational cost and reliability.
- Each of the folds contain about 85 records, which ensures an adequate sample size for each validation.
- It produces five independent performance estimates, which reduces the reliance on a single train-test split.

### 3.2 Purpose
- To detect potential overfitting during the training phase.
- To tune hyperparameters in a reliable way, comparing performance across folds.
- To confirm that the model can generalize to unseen data without any significant degradation in accuracy.

### 3.3 Implementation
- Apply the **5-fold cross validation** using only the training dataset.
- Compute the performance metrics for each fold.
- The **mean** and **standard deviation** of the metrics across folds will also be reported.
- Consistency of the results across folds will be monitored as an indicator of stability.

## 4. Quality Framework
Having a systematic quality framework is essential to ensure the reliability and interpretability in the developed models. We will apply the following checks:

### 4.1 OOB Error Convergence Analysis
It assesses whether the number of trees used in the Random Forest Model is sufficient.
- **Procedure:**
    - Plot the OOB Error rate against the number of trees.
    - Check whether the error stabilizes as the number of trees increase.
    - Identify the point of convergence where adding additional trees provides no additional meaningful gain.
- **Outcome:** It confirms that our model has sufficient trees and is not underfit (too few trees) or unnecessarily complex (too many trees without performance gain).

### 4.2 Cross-Validation Performance Stability
It evaluates how consistently the model performs across multiple partitions of the data.
- **Procedure:**
    - Use k-fold cross-validation to split the data into training and validation folds.
    - Record the performance metrics across the different folds.
    - Calculate the coefficient of variation (CV) for metrics to quantify the stability.
- **Outcome:** Low variability across the different folds indicates strong generalization, while high variability may suggest overfitting or an imbalance in the dataset.

### 4.3 Prediction Interval Assessment
It verifies that the model predictions align with domain knowledge and remain realistic.
- **Procedure:**
    - Construct prediction intervals for the model outputs.
    - Inspect ranges for implausible or out-of-bounds values, like negative counts or percentages above 100%.
    - Cross-check against known constraints for health outcomes, for example the immunization rates must be between 0 and 100.
- **Outcome:** It ensures that predictions are interpretable and practically meaningful in the context of health indicators.

Together, these checks provide assurance of model quality from both a technical and applied perspective.