# Data Pipeline Documentation

This folder contains the data processing pipeline for the BIN381 health datasets analysis project. Data flows through three distinct stages, each serving a specific purpose in the analysis workflow.

## Folder Structure

### 01_Raw
**Purpose**: Original, unmodified datasets
- Contains the source CSV files as downloaded/provided
- These files should never be modified or overwritten
- Serves as the definitive source of truth
- Used for data lineage and reproducibility

**Contents**: Original health datasets from South African national surveys

### 02_Cleaned
**Purpose**: Data quality improvements and basic preprocessing
- Remove empty/null records
- Fix data type issues (dates, numbers, categories)
- Handle outliers and obvious data entry errors
- Standardize formatting and naming conventions
- Remove duplicate records

**Output**: Clean datasets ready for analysis, maintaining original scales and units

### 03_Scaled
**Purpose**: Model-ready data with statistical transformations
- Numerical scaling (standardization, normalization)
- Categorical encoding (one-hot, label encoding)
- Feature selection and dimensionality reduction
- Data prepared specifically for machine learning algorithms

**Output**: Datasets formatted for predictive modeling and statistical analysis

## Usage Guidelines

1. **Never modify 01_Raw** - Always preserve original data
2. **Document transformations** - Keep track of all changes made at each stage
3. **Stage-appropriate analysis** - Use 02_Cleaned for Power BI, 03_Scaled for ML models
4. **Maintain traceability** - Each file should be traceable back to its raw source

## Tools by Stage

- **01_Raw → 02_Cleaned**: R data cleaning scripts
- **02_Cleaned → 03_Scaled**: R preprocessing for modeling
- **02_Cleaned → Power BI**: Direct import for dashboards