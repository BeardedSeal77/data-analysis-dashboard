# Project Milestone 3
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
 
The  CRISP-DM  methodology  breaks  down  a  data mining  project  life  cycle  into  six  phases  with  each 
phase consisting of many secondary tasks. The focus of this milestone is on the data modelling phase 
of CRISP-DM.
 
### Data Modelling 
Data modelling is the fourth phase of the CRISP-DM methodology and follows the data preparation 
phase. The goal of this stage is to select a suitable model that solves the business problem and 
meets the objectives defined in the Business Understanding phase, design procedures for testing 
and evaluating the model’s quality, build the model using the dataset prepared in the Data 
Preparation phase and assess the model from both the business problem domain and technical 
perspective. 

The modelling phase, much like the rest of the data science project phases, is iterative and you are 
likely to experiment with different algorithms and techniques to find the most suitable model. Your 
objective at this stage is to develop the data mining models that solve the given business problem 
and aligns with the pre-defined business criteria. You are encouraged to gradually explore, refine 
and extend your models to uncover new insights, improve accuracy, explore various options and 
better align with real-world organisational needs. Describe all the tasks or iterations leading to the 
final model(s) and their performance in relation to all other models experimented with. A well-
developed version of this project can be a valuable addition to your portfolio, GitHub repository, or 
professional profile. 

## Tasks 
This milestone consists of the following tasks that should be submitted as an assignment on given 
due date.

1. **Select Modelling Technique:**
   - Select the modelling technique (e.g., logistic regression, decision tree with C4.5, random forest, etc.)
   - Justify the choice of algorithm(s) based on the data characteristics
   - Document the actual modelling techniques that are used
   - Describe the assumptions. Some techniques are based on specific assumptions such as the quality, format, and distribution of data. Make sure that these assumptions hold and go back to the Data Preparation Phase if necessary

2. **Generate Test Design:**
   - Describe the procedures for training, testing, and evaluating the models
   - For supervised data mining tasks such as classification, generally use error rates as quality measures for data mining models
   - Specify how the dataset should be separated into training data, test data, and validation sets
   - The model is built on the training set and its quality estimated on the test set

3. **Build Model:**
   - Develop the model(s) using the R programming language
   - Run the selected technique using the prepared dataset to create one or more models
   - Document the model parameters. With any modelling tool, there are often several parameters that can be adjusted
   - Describe the parameters and their chosen values, along with the rationale for the choice
   - Describe the model's behaviour and interpretation in terms of accuracy, robustness, possible shortcomings, etc.

4. **Assess the Model:**
   - Summarise the results of generated model(s)
   - Assess the model performance metrics in terms of graphs, confusion matrices and other statistical measures
   - Interpret the model based on domain knowledge, predefined success criteria, and test design

## Deliverables:
- Modelling Report (in PDF format)
- Complete code (R and R Markdown files) used for data preparation, analysis, modelling and evaluation
- Any other code or files if other tools were used during this phase of the project  
 
## Grading Criteria:

| Criteria | Weight |
|----------|--------|
| Introduction | 5 |
| Modelling Technique | 10 |
| Test Design | 10 |
| Model Description | 10 |
| Model Assessment | 10 |
| Conclusion | 5 |
| **TOTAL** | **50** |