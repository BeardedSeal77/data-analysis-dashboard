Milestone 1 Report: Business and Data Understanding
BIN381 Business Intelligence Project
South African Health and Demographic Patterns (HDPSA)
Date: 02 September 2025
Contents
1.	Introduction
2.	Business Understanding
3.	Data Understanding
4.	Preliminary Visualizations
5.	Data Quality Assessment
6.	Conclusion and Next Steps
Introduction
This milestone report addresses the initial stages of the BIN381 project focused on analysing health and demographic patterns in South Africa. The project utilises a set of diverse datasets covering topics such as healthcare access, child mortality, HIV behaviour, immunisation, sanitation, water supply, maternal health, literacy, and nutrition. The overarching aim is to uncover meaningful patterns that inform policy decisions and interventions by government bodies and non-profit organisations. The CRISP-DM methodology guides this work, ensuring a structured process from problem understanding to data-driven insights.
Business Understanding
Business Problem
South Africa faces persistent challenges in health and social development. Communities often experience limited access to healthcare facilities, unreliable water and sanitation infrastructure, and varying levels of literacy. These challenges contribute to high rates of child and maternal mortality, infectious diseases like HIV, and nutritional deficiencies. The business problem is to identify the key factors that influence these outcomes and to provide actionable recommendations for government departments and non-governmental organisations (NGOs).
Objectives
•	Examine how distance to healthcare facilities, travel time and provider density affect health outcomes.

•	Determine associations between water and sanitation access and child mortality or illness rates.

•	Explore relationships between literacy rates, HIV prevalence and vaccination coverage.

•	Develop a foundation for predictive models and clustering analyses in subsequent milestones.

•	Deliver interactive dashboards for stakeholders, enabling them to visualise key indicators by province.
Stakeholders
Key stakeholders include the South African National Department of Health, Department of Education, provincial health authorities, and NGOs such as UNICEF and WHO. Community leaders, healthcare providers and researchers will also benefit from insights derived from this analysis.
Success Criteria
Success for this milestone is measured by the clarity of the business problem definition and the comprehensiveness of the data understanding. Specific indicators include:
•	Documentation of all available datasets and their structures.

•	Identification of initial patterns and relationships through exploratory analysis.

•	Recognition of data quality issues and assumptions.

•	Production of an early dashboard outline that can guide further development in Power BI.
Inventory of Resources
The analysis utilises twelve datasets supplied with the project, each covering different aspects of health and socio-economic conditions:
1.	Access to Health Care – details distance, travel time, facility type and provider density.

2.	Child Mortality – records infant, under-five and neonatal mortality rates.

3.	HIV Behaviour – summarises HIV prevalence, condom use, and average number of partners.

4.	Immunisation – reports immunisation coverage for major childhood vaccines.

5.	Toilet Facilities – indicates availability of improved and unimproved sanitation.

6.	Water – measures access to safe water and the distance to water sources.

7.	COVID‑19 Prevention – captures mask usage, handwashing habits and vaccination rates.

8.	Maternal Mortality – provides maternal mortality ratio and antenatal care coverage.

9.	Literacy – contains overall, male and female literacy rates.

10.	ARI Symptoms – lists prevalence of acute respiratory infection symptoms and hospitalisation.

11.	Anthropometry – reports stunting, wasting and underweight prevalence.

12.	IYCF (Infant & Young Child Feeding) – tracks breastfeeding and complementary feeding practices.
Risks, Assumptions and Constraints
Assumptions:
•	The provided datasets are representative of South Africa’s provinces and collected consistently.

•	Variables are measured using standard definitions and units.
Risks:
•	Missing or inconsistent data could bias results.

•	Some datasets may be outdated or lack provincial granularity.
Constraints:
•	Time and computational resources limit the depth of analysis in this milestone.

•	Only the supplied datasets are analysed; external data sources are not incorporated.
Data Understanding
This stage involves inspecting the structure of each dataset, summarising variable types and ranges, and noting preliminary patterns. The following subsections describe the key attributes of each dataset and highlight any observed issues such as missing values or outliers. Statistics and plots in this report are based on sample data created to illustrate the analytic process, as the actual datasets are provided separately.
Dataset	Rows (Sample)	Columns	Key Variables
Access To Health Care	9	5	Distance_to_health_facility_km, Travel_time_minutes, …
Anthropometry	9	4	Stunting_rate_percent, Wasting_rate_percent, …
Ari Symptoms	9	3	ARI_prevalence_percent, Hospitalized_due_to_ARI_percent, …
Child Mortality	9	4	Infant_mortality_rate_per_1000, Under5_mortality_rate_per_1000, …
Covid Prevention	9	4	Mask_use_percent, Handwashing_percent, …
Hiv Behavior	9	4	HIV_prevalence_percent, Condom_use_percent, …
Immunization	9	4	Full_immunization_percent, Measles_immunization_percent, …
Iycf	9	4	Exclusive_breastfeeding_percent, Complementary_feeding_practices_percent, …
Literacy	9	4	Literacy_rate_percent, Male_literacy_percent, …
Maternal Mortality	9	4	Maternal_mortality_ratio_per_100k, Antenatal_care_coverage_percent, …
Toilet Facilities	9	4	Improved_toilet_percent, Unimproved_toilet_percent, …
Water	9	4	Improved_water_percent, Unimproved_water_percent, …
3.1 Access To Health Care
This dataset consists of 9 rows and 5 columns. Key variables include Province, Distance_to_health_facility_km, Travel_time_minutes, Facility_type, Provider_density_per_100k. Initial exploration of the sample data shows typical values and distributions appropriate for demonstration. For instance, the mean and range of key variables can be summarised as follows:
Variable	Mean (Sample)	Range (Sample)
Distance_to_health_facility_km	10.49	2.10 – 19.06
Travel_time_minutes	58.13	12.26 – 116.69
Provider_density_per_100k	24.65	7.09 – 47.70
3.2 Anthropometry
This dataset consists of 9 rows and 4 columns. Key variables include Province, Stunting_rate_percent, Wasting_rate_percent, Underweight_percent. Initial exploration of the sample data shows typical values and distributions appropriate for demonstration. For instance, the mean and range of key variables can be summarised as follows:
Variable	Mean (Sample)	Range (Sample)
Stunting_rate_percent	36.06	21.74 – 46.53
Wasting_rate_percent	8.95	3.43 – 13.68
Underweight_percent	14.06	5.76 – 25.57
3.3 Ari Symptoms
This dataset consists of 9 rows and 3 columns. Key variables include Province, ARI_prevalence_percent, Hospitalized_due_to_ARI_percent. Initial exploration of the sample data shows typical values and distributions appropriate for demonstration. For instance, the mean and range of key variables can be summarised as follows:
Variable	Mean (Sample)	Range (Sample)
ARI_prevalence_percent	16.39	5.92 – 28.15
Hospitalized_due_to_ARI_percent	6.18	1.42 – 9.91
3.4 Child Mortality
This dataset consists of 9 rows and 4 columns. Key variables include Province, Infant_mortality_rate_per_1000, Under5_mortality_rate_per_1000, Neonatal_mortality_rate_per_1000. Initial exploration of the sample data shows typical values and distributions appropriate for demonstration. For instance, the mean and range of key variables can be summarised as follows:
Variable	Mean (Sample)	Range (Sample)
Infant_mortality_rate_per_1000	34.76	16.55 – 58.45
Under5_mortality_rate_per_1000	54.26	31.09 – 78.18
Neonatal_mortality_rate_per_1000	24.66	11.36 – 38.18
3.5 Covid Prevention
This dataset consists of 9 rows and 4 columns. Key variables include Province, Mask_use_percent, Handwashing_percent, Vaccination_rate_percent. Initial exploration of the sample data shows typical values and distributions appropriate for demonstration. For instance, the mean and range of key variables can be summarised as follows:
Variable	Mean (Sample)	Range (Sample)
Mask_use_percent	69.60	50.75 – 81.09
Handwashing_percent	68.14	45.67 – 86.84
Vaccination_rate_percent	45.30	16.52 – 73.03
3.6 Hiv Behavior
This dataset consists of 9 rows and 4 columns. Key variables include Province, HIV_prevalence_percent, Condom_use_percent, Number_of_partners_mean. Initial exploration of the sample data shows typical values and distributions appropriate for demonstration. For instance, the mean and range of key variables can be summarised as follows:
Variable	Mean (Sample)	Range (Sample)
HIV_prevalence_percent	16.90	6.86 – 29.67
Condom_use_percent	64.62	40.28 – 80.77
Number_of_partners_mean	1.89	1.13 – 2.73
3.7 Immunization
This dataset consists of 9 rows and 4 columns. Key variables include Province, Full_immunization_percent, Measles_immunization_percent, Polio_immunization_percent. Initial exploration of the sample data shows typical values and distributions appropriate for demonstration. For instance, the mean and range of key variables can be summarised as follows:
Variable	Mean (Sample)	Range (Sample)
Full_immunization_percent	87.08	73.47 – 95.73
Measles_immunization_percent	80.34	70.74 – 96.32
Polio_immunization_percent	83.84	72.23 – 96.96
3.8 Iycf
This dataset consists of 9 rows and 4 columns. Key variables include Province, Exclusive_breastfeeding_percent, Complementary_feeding_practices_percent, Minimum_dietary_diversity_percent. Initial exploration of the sample data shows typical values and distributions appropriate for demonstration. For instance, the mean and range of key variables can be summarised as follows:
Variable	Mean (Sample)	Range (Sample)
Exclusive_breastfeeding_percent	37.68	22.07 – 50.80
Complementary_feeding_practices_percent	53.06	31.27 – 78.79
Minimum_dietary_diversity_percent	31.10	16.26 – 48.51
3.9 Literacy
This dataset consists of 9 rows and 4 columns. Key variables include Province, Literacy_rate_percent, Male_literacy_percent, Female_literacy_percent. Initial exploration of the sample data shows typical values and distributions appropriate for demonstration. For instance, the mean and range of key variables can be summarised as follows:
Variable	Mean (Sample)	Range (Sample)
Literacy_rate_percent	81.94	69.52 – 97.95
Male_literacy_percent	77.57	60.95 – 96.68
Female_literacy_percent	87.71	60.60 – 97.70
3.10 Maternal Mortality
This dataset consists of 9 rows and 4 columns. Key variables include Province, Maternal_mortality_ratio_per_100k, Antenatal_care_coverage_percent, Skilled_birth_percent. Initial exploration of the sample data shows typical values and distributions appropriate for demonstration. For instance, the mean and range of key variables can be summarised as follows:
Variable	Mean (Sample)	Range (Sample)
Maternal_mortality_ratio_per_100k	289.43	125.24 – 369.57
Antenatal_care_coverage_percent	65.28	50.23 – 81.14
Skilled_birth_percent	80.97	63.65 – 93.12
3.11 Toilet Facilities
This dataset consists of 9 rows and 4 columns. Key variables include Province, Improved_toilet_percent, Unimproved_toilet_percent, Open_defecation_percent. Initial exploration of the sample data shows typical values and distributions appropriate for demonstration. For instance, the mean and range of key variables can be summarised as follows:
Variable	Mean (Sample)	Range (Sample)
Improved_toilet_percent	70.14	45.50 – 84.80
Unimproved_toilet_percent	26.05	10.28 – 44.43
Open_defecation_percent	5.97	2.52 – 9.72
3.12 Water
This dataset consists of 9 rows and 4 columns. Key variables include Province, Improved_water_percent, Unimproved_water_percent, Distance_to_water_km. Initial exploration of the sample data shows typical values and distributions appropriate for demonstration. For instance, the mean and range of key variables can be summarised as follows:
Variable	Mean (Sample)	Range (Sample)
Improved_water_percent	68.89	51.81 – 94.51
Unimproved_water_percent	25.51	8.10 – 49.30
Distance_to_water_km	2.08	0.30 – 4.19
Preliminary Visualizations
Early visualisations provide a glimpse into the relationships between variables. The following figures illustrate selected patterns using the sample data. These plots will be refined and expanded in later phases using the actual datasets.
 
Improved water supply across provinces
 
Distribution of infant mortality rates
 
Relationship between literacy rates and HIV prevalence
Data Quality Assessment
A preliminary assessment of data quality focuses on detecting missing values, duplicates and outliers. In the sample datasets used here, values were generated randomly and therefore do not contain missing or duplicate entries. When analysing the actual datasets, attention should be paid to:
•	Missing values: Evaluate patterns of missingness and determine whether imputation or removal is appropriate.
•	Duplicates: Identify and remove duplicated records to avoid bias.
•	Outliers: Use boxplots and statistical thresholds to flag extreme values.
•	Inconsistent units: Ensure all distances (e.g., km vs. m) and percentages are standardised.
•	Sampling bias: Assess whether the datasets adequately represent rural and urban populations across provinces.
Conclusion and Next Steps
This report lays the groundwork for the BIN381 project by clarifying the business objectives and providing an initial understanding of the data. While the sample analyses here utilise synthetic data, the procedures — such as summarising datasets, exploring variable distributions and assessing data quality — mirror the steps that will be applied to the actual datasets. The next milestone will focus on data preparation, including cleaning, merging and feature engineering. Subsequent milestones will involve modelling, evaluation and deployment via dashboards and reports, culminating in actionable insights for stakeholders.
