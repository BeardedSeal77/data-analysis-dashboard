# Task 4: Feature Engineering & Data Preparation Guide

## Data Combination Strategy

**COMBINE ALL 7 CLEANED DATASETS** into a single dataset for modeling:
- `access-to-health-care_national_zaf`
- `immunization_national_zaf`
- `hiv-behavior_national_zaf`
- `water_national_zaf`
- `dhs-quickstats_national_zaf`
- `toilet-facilities_national_zaf`
- `child-mortality-rates_national_zaf`

**Rationale**: All datasets share identical structure and represent different health domains for the same country (South Africa). Combining maximizes sample size (609 records) and enables cross-domain health analysis.

## Field-by-Field Processing Instructions

### 1. **`data_id`** (Unique Identifier)
- **Action**: Keep as-is for data lineage, create `dataset_source` categorical feature
- **Feature Engineering**: Extract dataset name from ID as new categorical variable
- **Encoding**: Label encode `dataset_source` (0-6 for 7 datasets)

### 2. **`value`** (Primary Measurement - TARGET VARIABLE)
- **Action**: Primary target for regression, predictor for classification
- **Preprocessing**: Check distribution, apply log transform if right-skewed
- **Scaling**: StandardScaler for modeling (mean=0, std=1)
- **Feature Engineering**: Create value categories (Low/Medium/High) for classification tasks

### 3. **`by_variable_id`** (Grouping Variable)
- **Action**: One-hot encode (expect 10-15 unique categories)
- **Handle Missing**: Create "Unknown" category if any missing values
- **Feature Engineering**: Group rare categories (<5% frequency) into "Other"

### 4. **`indicator`** (Health Indicator Description)
- **Action**: Label encode (expect 50+ unique indicators)
- **Text Processing**: Clean text, standardize naming
- **Feature Engineering**: Create indicator domain categories (maternal, child, infectious, etc.)

### 5. **`indicator_type`** (Indicator Category)
- **Action**: One-hot encode (expect 5-10 categories)
- **Handle Constants**: If dataset has only 1 value, feature becomes constant (keep for interpretability)

### 6. **`characteristic_category`** (Demographics)
- **Action**: One-hot encode
- **Handle Constants**: Some datasets only have "Total" - this is expected behavior
- **Missing Strategy**: Keep "Total" as baseline category

### 7. **`precision`** (Measurement Precision)
- **Action**: Keep numeric, create precision quality categories
- **Feature Engineering**:
  - Bin into categories: High (0 decimals), Medium (1-2), Low (3+)
  - Create binary feature: `high_precision` (precision ≤ 1)
- **Scaling**: StandardScaler if using as continuous

### 8. **`characteristic_order`** (Demographic Ordering)
- **Action**: Keep as ordinal numeric (preserves ranking)
- **Preprocessing**: Verify ordering is meaningful across datasets
- **Feature Engineering**: Create order quintiles if wide range

### 9. **`indicator_order`** (Indicator Hierarchy)
- **Action**: Keep as ordinal numeric
- **Feature Engineering**: Create indicator importance tiers (1-3=High, 4-6=Medium, 7+=Low)

### 10. **`denominator_unweighted`** (Sample Size - Categorical Pattern)
- **Action**: Treat as categorical due to highly repetitive values
- **Pattern Analysis**: Shows clear groupings (e.g., 971/951, 2903/4148/2041, 11083/37925)
- **Feature Engineering**:
  - One-hot encode or label encode the distinct values
  - Create sample size tiers: Small (<1000), Medium (1000-10000), Large (10000+)
  - Use as survey cohort identifier (values represent specific survey groups)

### 11. **`is_preferred`** (Quality Flag)
- **Action**: Keep as binary (0/1)
- **Use**: Weight observations or filter for high-quality subset
- **Feature Engineering**: Create data quality score combining with precision

## Final Feature Set Structure

**Numeric Features (5):**
- `value` (target/predictor)
- `characteristic_order`
- `indicator_order`
- `precision`
- `data_quality_score`

**Binary Features (2):**
- `is_preferred`
- `high_precision`

**Categorical Features (7):**
- `dataset_source` (7 categories)
- `by_variable_id` (10-15 categories)
- `indicator_domain` (5-8 categories)
- `indicator_type` (5-10 categories)
- `characteristic_category` (varies by dataset)
- `denominator_unweighted` (6-10 unique survey cohorts)
- `sample_size_tier` (3 categories)

**Total Estimated Features After Encoding: 35-50 features**

## Implementation Priority

1. **Combine datasets** with `dataset_source` identifier
2. **Handle target variable** (`value`) - scaling and distribution
3. **Encode categorical variables** - start with high-cardinality fields
4. **Create engineered features** - sample size, precision, quality scores
5. **Final preprocessing** - scaling, train/test split preparation

## Modeling Considerations

- **Regression Target**: `value` (health indicator measurements)
- **Classification Target**: `value_category` (Low/Medium/High health outcomes)
- **Sample Weights**: Use `denominator_unweighted` cohorts and `is_preferred` for weighted modeling
- **Cross-validation**: Stratify by `dataset_source` to ensure balanced representation