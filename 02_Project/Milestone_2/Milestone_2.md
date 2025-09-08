# Project Milestone 2
## Introduction 
This project will investigate various health and demographic datasets to identify meaningful patterns 
and trends. The details of the project requirements are described in the Project Outline document. 
The project outline underscores the use of CRISP-DM as a structured approach to guide you through 
the  data  science  project,  emphasizing  its  importance  in  the  context  of  real-world  data  analysis  and 
modelling.  

## Outline
The  project  is  divided  into  six  (6)  milestones,  where  at  each  stage  some  deliverables  are  to  be 
produced in terms of a series of reports that describe the project plan, and the work carried out during 
the iterative process of data preparation, modelling, evaluation and eventual deployment.  
 
While CRISP-DM breaks down a data mining project life cycle into six phases with each phase consisting of many secondary tasks, the focus of this milestone is on the Data Preparation phase. This phase involves activities that enable you to become familiar with the data, addressing data quality problems, and preparing the data for modeling.

### Data Preparation
Data preparation is the third phase of the CRISP-DM methodology and follows the data understanding phase. This phase involves all activities to construct the final dataset from the initial raw data. Data preparation tasks are likely to be performed multiple times and not in any prescribed order. Tasks include table, record, and attribute selection as well as transformation and cleaning of data for modeling tools. 

## Tasks 
This milestone consists of the following steps that should be submitted as an assignment on given 
due date.

1. **Select Data:**
   - Decide on the data to be used for analysis
   - Criteria include relevance to the data mining goals, quality, and technical constraints such as limits on data volume or data types
   - Document the rationale for inclusion or exclusion

2. **Verify Data Quality:**
   - Perform significance and correlation tests to decide if fields should be included
   - Reconsider data selection criteria considering experiences of data quality and data exploration
   - Reconsider data selection criteria considering your modelling requirements
   - Based on data selection criteria, decide if one or more attributes are more important than others and weight the attributes accordingly
   - Select relevant data subsets (e.g., significant attributes, and only data which meet certain conditions or using other advanced data reduction techniques such as Principal Component Analysis)

3. **Clean Data:**
   - Raise the data quality to the level required by the selected analysis techniques
   - Clean and preprocess the data to address quality issues (e.g., impute missing values, remove duplicates, handle outliers)
   - Reconsider how to deal with any observed type of noise
   - Correct, remove, or ignore noise
   - Decide how to deal with special values and their meaning
   - Reconsider data selection criteria considering experiences of data cleaning

4. **Prepare Data for Modelling:**
   - Transform and encode categorical variables as needed
   - Discretize or scale numerical variables if necessary
   - Check available techniques for sampling data
   - Consider the use of sampling techniques for splitting test and training datasets
   - Split the data into training and testing sets in preparation for the modelling phase

**Note:** Describe the decisions and actions that were taken to address the data quality problems reported during the Verify Data Quality Task in Project Milestone 1. If the data are to be used in the data mining exercise, the report should address outstanding data quality issues and what possible effect this could have on the results. Remember that visualizations are also important to effectively communicate the data preparation tasks and to verify the accuracy and consistency of the data.



## Deliverables:
- Data Preparation Report (in PDF or document format)
- Code (R, R Markdown) used for data preparation and analysis
- Power BI project file if Power BI was used during this phase of the project

## Grading Criteria:

| Criteria | Weight |
|----------|--------|
| Data Description | 5 |
| Data Selection (Inclusion/Exclusion Criteria) | 10 |
| Data Cleaning Process | 15 |
| Attribute/Feature Selection | 10 |
| Data Transformations and Aggregation | 10 |
| **TOTAL** | **50** |