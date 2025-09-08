# Data Dictionary - South African Health Datasets

This document provides field definitions and descriptions for all datasets in the 01_Raw folder. All datasets follow the DHS (Demographic and Health Surveys) format and contain health indicators for South Africa.

## Common Field Structure

All datasets share the same field structure:

| Field Name | Data Type | Description |
|------------|-----------|-------------|
| **ISO3** | Text | Three-letter country code (ZAF for South Africa) |
| **DataId** | Text | Unique identifier for each data record |
| **Indicator** | Text | Name/description of the health indicator being measured |
| **Value** | Numeric | The actual measurement value for the indicator |
| **Precision** | Numeric | Number of decimal places for the value |
| **DHS_CountryCode** | Text | DHS-specific country identifier |
| **CountryName** | Text | Full country name (South Africa) |
| **SurveyYear** | Numeric | Year when the survey was conducted |
| **SurveyId** | Text | Unique identifier for the specific survey |
| **IndicatorId** | Text | Standardized code for the health indicator |
| **IndicatorOrder** | Numeric | Display order for indicators |
| **IndicatorType** | Text | Category/type of health indicator |
| **CharacteristicId** | Text | Identifier for demographic characteristic |
| **CharacteristicOrder** | Numeric | Display order for characteristics |
| **CharacteristicCategory** | Text | Category of demographic breakdown |
| **CharacteristicLabel** | Text | Human-readable label for the characteristic |
| **ByVariableId** | Text | Additional grouping variable identifier |
| **ByVariableLabel** | Text | Label for the grouping variable |
| **IsTotal** | Boolean | Indicates if this is a total/aggregate value |
| **IsPreferred** | Boolean | Indicates if this is the preferred estimate |
| **SDRID** | Text | Survey Data Repository identifier |
| **RegionId** | Text | Geographic region identifier |
| **SurveyYearLabel** | Text | Formatted survey year label |
| **SurveyType** | Text | Type of survey (e.g., DHS, MICS) |
| **DenominatorWeighted** | Numeric | Weighted sample size used as denominator |
| **DenominatorUnweighted** | Numeric | Unweighted sample size |
| **CILow** | Numeric | Lower bound of confidence interval |
| **CIHigh** | Numeric | Upper bound of confidence interval |
| **LevelRank** | Numeric | Hierarchical level ranking |

## Dataset Descriptions

### 1. access-to-health-care_national_zaf.csv
**Purpose**: Access to healthcare facilities and services
**Key Indicators**: Distance to health facilities, availability of services, barriers to access

### 2. anthropometry_national_zaf.csv  
**Purpose**: Physical measurements and nutritional status
**Key Indicators**: Height, weight, BMI, stunting, wasting, underweight rates

### 3. child-mortality-rates_national_zaf.csv
**Purpose**: Child survival and mortality statistics
**Key Indicators**: Infant mortality, under-5 mortality, neonatal mortality rates

### 4. covid-19-prevention_national_zaf.csv
**Purpose**: COVID-19 prevention measures and behaviors
**Key Indicators**: Mask usage, social distancing, vaccination rates, prevention practices

### 5. dhs-quickstats_national_zaf.csv
**Purpose**: Summary statistics from DHS surveys
**Key Indicators**: Quick reference statistics across multiple health domains

### 6. hiv-behavior_national_zaf.csv
**Purpose**: HIV-related behaviors and risk factors
**Key Indicators**: Testing rates, risky behaviors, prevention knowledge, treatment access

### 7. immunization_national_zaf.csv
**Purpose**: Vaccination coverage and immunization rates
**Key Indicators**: Coverage rates for various vaccines (BCG, DPT, measles, etc.)

### 8. iycf_national_zaf.csv
**Purpose**: Infant and Young Child Feeding practices
**Key Indicators**: Breastfeeding rates, complementary feeding, dietary diversity

### 9. literacy_national_zaf.csv
**Purpose**: Education and literacy levels
**Key Indicators**: Literacy rates by gender, age groups, education attainment

### 10. maternal-mortality_national_zaf.csv
**Purpose**: Maternal health and mortality statistics
**Key Indicators**: Maternal mortality ratio, skilled birth attendance, prenatal care

### 11. symptoms-of-acute-respiratory-infection-ari_national_zaf.csv
**Purpose**: Acute respiratory infection symptoms and treatment
**Key Indicators**: ARI prevalence, treatment seeking, antibiotic use

### 12. toilet-facilities_national_zaf.csv
**Purpose**: Sanitation and toilet facility access
**Key Indicators**: Type of toilet facilities, access to improved sanitation

### 13. water_national_zaf.csv
**Purpose**: Water access and quality
**Key Indicators**: Access to improved water sources, water treatment, availability

## Data Quality Notes

- **Missing Values**: Check for NULL, empty strings, or placeholder values
- **Confidence Intervals**: CILow and CIHigh provide uncertainty bounds
- **Sample Sizes**: DenominatorWeighted/Unweighted indicate survey sample sizes
- **Time Series**: Multiple SurveyYear values allow for trend analysis
- **Geographic Levels**: LevelRank indicates national vs subnational data

## Usage for Milestone 1

Focus on:
- **Indicator** field for understanding what is being measured
- **Value** field for the actual measurements
- **CharacteristicLabel** for demographic breakdowns
- **SurveyYear** for temporal analysis
- **CILow/CIHigh** for data quality assessment