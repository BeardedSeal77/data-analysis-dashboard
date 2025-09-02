<div align="center">
  <h1>Data Analysis Dashboard</h1>
  <img src="public/images/dashboard-hero.png" alt="Data Analysis Dashboard" width="200" style="border-radius: 50%; border: 3px solid #0066cc;" />
</div>

## Team Members

| Name | Role |
|------|------|
| [Add Name] | [Add Role] |
| [Add Name] | [Add Role] |
| [Add Name] | [Add Role] |
| [Add Name] | [Add Role] |

## What This Project Does

This data analysis dashboard explores health and demographic patterns across South Africa by:

🔍 **Analyzing** 12+ health datasets covering water access, sanitation, child mortality, HIV behavior, immunization rates, and more

📊 **Visualizing** complex health patterns through interactive Power BI dashboards and R-generated plots

🤖 **Mining** data using machine learning techniques (clustering, classification, association rules) to uncover hidden relationships

🗺️ **Mapping** health risk zones and regional disparities across South African provinces

📈 **Predicting** health outcomes based on socioeconomic factors like literacy, water access, and living conditions

## Key Features

- **Interactive Dashboards**: Power BI visualizations with filters for province, demographics, and health indicators
- **Predictive Models**: Machine learning models to forecast child mortality and health risks
- **Pattern Discovery**: Association rule mining to find relationships like "low literacy + poor sanitation → high disease risk"
- **Regional Analysis**: Compare health outcomes across different South African regions
- **Data-Driven Insights**: Evidence-based recommendations for healthcare interventions

## Technology Stack

- **R** - Statistical analysis and machine learning
- **Power BI** - Interactive dashboards and visualizations  
- **CRISP-DM** - Industry-standard data mining methodology
- **Shiny** - Web-based interactive applications

## Repository Structure

```
├── data/                 # Health datasets (water, mortality, immunization, etc.)
├── scripts/              # R analysis and modeling scripts
├── dashboards/           # Power BI dashboard files
├── reports/              # Analysis reports and findings
└── presentations/        # Project presentations
```

## Getting Started

1. Clone this repository
2. Install R packages: `install.packages(c("tidyverse", "cluster", "randomForest", "arules"))`
3. Load datasets from `data/` directory
4. Run analysis scripts in order: EDA → Cleaning → Modeling → Visualization
5. Open Power BI dashboards for interactive exploration

## Research Questions We Answer

- Which regions have the highest health risks?
- How do water access and sanitation affect child mortality?
- What factors predict successful immunization campaigns?
- Are literacy levels correlated with health behaviors?

## Project Methodology

Following **CRISP-DM** framework: Business Understanding → Data Understanding → Data Preparation → Modeling → Evaluation → Deployment