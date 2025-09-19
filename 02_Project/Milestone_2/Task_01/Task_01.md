
# Introduction
This report aims to document the data-preparation and standardization of this milestone. We will be using the 13 data sets that are related to the health and demographics in South Africa. These include access to health care, child mortality and others.


The main objective of this milestone is to transform raw data into a clean, consistent, and analysis-ready format. This is critical because the quality of insights produced by any data science pipeline depends heavily on how well the input data has been prepared.  

 
The goal is to:
- select relevant data sets 
- verify data quality 
- clean and transform data sets
- selecting attributes 
- preparing the data for modelling 



# Step 1: Data Selection  

The datasets were chosen because of their:  

- Relevance: They provide key insights into South Africa’s health and demographic patterns.  
- Accessibility: They are publicly available, which ensures transparency and reproducibility.  
- Manageability: The dataset sizes are reasonable, making them practical to clean and process.  


Findings so far:

We deduced that the datasets have inconsistencies, missing values, and duplicates. These issues highlight the importance of robust data and how cleaning workflow is as equally important.

# Step 2: Verifying Data Quality

Prior cleaning, it is important to analyse the raw data to make note on where the issues lie. 

Checking for Missing Values


# Guidelines for handling missing values:

0% missing → Safe, no action needed.

1–10% missing → Impute or drop depending on importance.

20–30% missing → Requires a careful decision.

>40% missing → Likely better to drop the column.


# Checking for Duplicates

Duplicates can skew results and inflate sample sizes artificially.


# Checking Numeric Correlations

Correlations allow us to see how variables are related. This step is particularly useful for feature selection and detecting multicollinearity (a problem for regression models).


# Step 3: Data Cleaning

Once issues are identified, we move on to cleaning the datasets.

1. Removing Duplicates


2. Handling Missing Values

Different strategies are applied based on data type:

Numeric → Imputed using the median (robust against outliers).

Categorical → Replaced with "Unknown".

Boolean → Replaced with the most frequent (modal) value.



3. Diagnosing Cleaned Data

To verify that cleaning worked, we run a diagnostic function. This provides structure, previews, and summaries.

# Step 4: Encoding and Scaling

Normalizing Numeric Variables

Scaling ensures that all numeric fields are on the same scale. This is especially important for distance-based models (e.g., clustering, k-NN) and algorithms sensitive to magnitude (e.g., gradient descent in regression/ML).



# Step 5: Train-Test Split

Finally, we prepare the datasets for modelling by splitting them into training and testing subsets. The training set is used to build models, while the testing set evaluates performance on unseen data.

We use a 70/30 split with createDataPartition() from the caret package.

In this milestone, we successfully:

Imported and explored three datasets related to health and demographics in South Africa.

Assessed their quality by checking for missing values, duplicates, and correlations.

Cleaned the data systematically through duplicate removal, missing value imputation, and column pruning.

Encoded categorical variables and normalized numeric fields to ensure model compatibility.

Prepared the data for modelling by splitting into training and testing sets.

This establishes a strong foundation for the next milestone, where we will begin applying statistical models and machine learning algorithms to uncover patterns and generate insights