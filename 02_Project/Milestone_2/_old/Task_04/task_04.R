# Task 4: Correlation Analysis and Feature Importance
# BIN381 - Data Analysis Dashboard Project
# Milestone 2 - Data Preparation Phase

# Load required libraries
suppressMessages({
  library(tidyverse)
  library(corrplot)
  library(pheatmap)
  library(DT)
  library(kableExtra)
})

cat("=== TASK 4: CORRELATION ANALYSIS AND FEATURE IMPORTANCE ===\n\n")

# 1. DATA LOADING
cat("1. Loading datasets...\n")

# Set data path
data_path <- "../../Data/01_Raw/"

# List all CSV files
csv_files <- list.files(data_path, pattern = "*.csv", full.names = TRUE)
cat("Found", length(csv_files), "CSV files\n")

# Load all datasets
datasets <- list()
for (file in csv_files) {
  dataset_name <- gsub(".csv", "", basename(file))
  datasets[[dataset_name]] <- read_csv(file, show_col_types = FALSE)
}

cat("Loaded", length(datasets), "datasets successfully\n\n")

# 2. DATA CONSOLIDATION
cat("2. Consolidating data for analysis...\n")

# Combine all datasets
combined_data <- bind_rows(datasets, .id = "dataset_source")

# Clean and prepare data
analysis_data <- combined_data %>%
  filter(!is.na(Value)) %>%
  select(dataset_source, Indicator, Value, SurveyYear) %>%
  mutate(
    Value = as.numeric(Value),
    SurveyYear = as.numeric(SurveyYear)
  ) %>%
  filter(!is.na(Value), !is.infinite(Value))

cat("Combined dataset:", nrow(analysis_data), "observations\n")

# Check indicator coverage
indicator_coverage <- analysis_data %>%
  group_by(Indicator) %>%
  summarise(
    n_datasets = n_distinct(dataset_source),
    n_observations = n(),
    .groups = 'drop'
  ) %>%
  arrange(desc(n_datasets))

cat("Total unique indicators:", nrow(indicator_coverage), "\n\n")

# 3. PREPARE CORRELATION MATRIX
cat("3. Preparing correlation matrix...\n")

# Use dataset_source as grouping for better correlation analysis
correlation_matrix_data <- analysis_data %>%
  group_by(Indicator, dataset_source) %>%
  summarise(avg_value = mean(Value, na.rm = TRUE), .groups = 'drop') %>%
  pivot_wider(names_from = Indicator, values_from = avg_value) %>%
  select(-dataset_source)

# Handle missing values and constant columns
correlation_matrix_data <- correlation_matrix_data %>%
  mutate_all(~ ifelse(is.na(.), mean(., na.rm = TRUE), .)) %>%
  select_if(~ var(., na.rm = TRUE) > 0)

cat("Correlation matrix dimensions:", nrow(correlation_matrix_data), "x", ncol(correlation_matrix_data), "\n\n")

# 4. CORRELATION ANALYSIS
cat("4. CORRELATION ANALYSIS RESULTS\n")
cat("================================\n")

# Calculate correlation matrix
numeric_data <- correlation_matrix_data %>% select_if(is.numeric)
cor_matrix <- cor(numeric_data, use = "complete.obs")

cat("Correlation matrix:", nrow(cor_matrix), "x", ncol(cor_matrix), "\n")
cat("Range of correlations:", round(min(cor_matrix, na.rm = TRUE), 3), "to", round(max(cor_matrix, na.rm = TRUE), 3), "\n")

# Find significant correlations
cor_threshold <- 0.7
significant_cors <- which(abs(cor_matrix) > cor_threshold & cor_matrix != 1, arr.ind = TRUE)

if (nrow(significant_cors) > 0) {
  significant_pairs <- data.frame(
    Indicator1 = rownames(cor_matrix)[significant_cors[,1]],
    Indicator2 = colnames(cor_matrix)[significant_cors[,2]],
    Correlation = cor_matrix[significant_cors],
    Strength = ifelse(cor_matrix[significant_cors] > 0, "Positive", "Negative")
  ) %>%
    arrange(desc(abs(Correlation)))

  cat("\nSIGNIFICENT CORRELATIONS FOUND:\n")
  cat("Total significant correlations (|r| >", cor_threshold, "):", nrow(significant_pairs), "\n")
  cat("Strongest positive correlation:", round(max(significant_pairs$Correlation), 3), "\n")
  cat("Strongest negative correlation:", round(min(significant_pairs$Correlation), 3), "\n\n")

  cat("TOP 5 STRONGEST CORRELATIONS:\n")
  print(head(significant_pairs, 5))
} else {
  cat("\nNO SIGNIFICANT CORRELATIONS FOUND\n")
  cat("No correlations above threshold of", cor_threshold, "\n")
  cat("Features are relatively independent (beneficial for modeling)\n\n")
}

# 5. FEATURE IMPORTANCE ANALYSIS
cat("\n5. FEATURE IMPORTANCE ANALYSIS\n")
cat("===============================\n")

# Calculate feature variance as importance measure
feature_variance <- numeric_data %>%
  summarise_all(~ var(., na.rm = TRUE)) %>%
  pivot_longer(everything(), names_to = "Feature", values_to = "Variance") %>%
  arrange(desc(Variance)) %>%
  mutate(
    Rank = row_number(),
    Normalized_Variance = scales::rescale(Variance, to = c(0, 1))
  )

# Create final importance ranking
combined_importance <- feature_variance %>%
  mutate(
    Combined_Score = Normalized_Variance,
    Final_Rank = Rank
  )

cat("Total features analyzed:", nrow(combined_importance), "\n")
cat("Ranking method: Variance-based importance\n\n")

cat("TOP 10 MOST IMPORTANT FEATURES:\n")
top_10 <- combined_importance %>%
  select(Feature, Final_Rank, Combined_Score, Variance) %>%
  slice_head(n = 10)

print(top_10)

# 6. WEIGHT ATTRIBUTION STRATEGY
cat("\n6. WEIGHT ATTRIBUTION STRATEGY\n")
cat("===============================\n")

# Suggest weighting strategy
weight_strategy <- combined_importance %>%
  mutate(
    Weight_Category = case_when(
      Final_Rank <= 5 ~ "High Weight (3x)",
      Final_Rank <= 15 ~ "Medium Weight (2x)",
      Final_Rank <= 30 ~ "Standard Weight (1x)",
      TRUE ~ "Low Weight (0.5x)"
    ),
    Suggested_Weight = case_when(
      Final_Rank <= 5 ~ 3.0,
      Final_Rank <= 15 ~ 2.0,
      Final_Rank <= 30 ~ 1.0,
      TRUE ~ 0.5
    )
  )

# Summary of weight distribution
weight_summary <- weight_strategy %>%
  count(Weight_Category, name = "Number_of_Features") %>%
  arrange(desc(Number_of_Features))

cat("WEIGHT DISTRIBUTION SUMMARY:\n")
print(weight_summary)

cat("\nTOP 20 FEATURES WITH SUGGESTED WEIGHTS:\n")
top_20_weights <- weight_strategy %>%
  select(Feature, Final_Rank, Combined_Score, Weight_Category, Suggested_Weight) %>%
  slice_head(n = 20)

print(top_20_weights)

# 7. VISUALIZATIONS
cat("\n7. Creating visualizations...\n")

# Correlation heatmap
if (ncol(cor_matrix) > 1) {
  cat("Generating correlation heatmap...\n")
  pheatmap(cor_matrix,
           main = "Correlation Heatmap of Health Indicators",
           color = colorRampPalette(c("red", "white", "blue"))(100),
           breaks = seq(-1, 1, length.out = 101),
           display_numbers = FALSE,
           fontsize = 8,
           angle_col = 45)
}

# Feature importance plot
cat("Generating feature importance plot...\n")
top_20_features <- combined_importance %>% slice_head(n = 20)

importance_plot <- ggplot(top_20_features, aes(x = reorder(Feature, Combined_Score), y = Combined_Score)) +
  geom_col(fill = "steelblue", alpha = 0.7) +
  coord_flip() +
  labs(
    title = "Top 20 Most Important Features",
    subtitle = "Ranked by variance (discriminatory power)",
    x = "Health Indicators",
    y = "Importance Score"
  ) +
  theme_minimal() +
  theme(axis.text.y = element_text(size = 8))

print(importance_plot)

# 8. SUMMARY AND CONCLUSIONS
cat("\n8. TASK 4 SUMMARY\n")
cat("==================\n")

cat("DELIVERABLES COMPLETED:\n")
cat("- Correlation Analysis Results: Matrix of", nrow(cor_matrix), "x", ncol(cor_matrix), "indicators\n")
cat("- Feature Importance Rankings:", nrow(combined_importance), "features ranked by variance\n")
cat("- Weight Attribution Strategy: 4-tier weighting system implemented\n")
cat("- R Code: Statistical analysis complete\n\n")

cat("KEY FINDINGS:\n")
if (exists("significant_pairs") && nrow(significant_pairs) > 0) {
  cat("- Found", nrow(significant_pairs), "significant correlations above threshold\n")
} else {
  cat("- No significant correlations found (features are independent)\n")
}
cat("- Top 5 features account for highest discriminatory power\n")
cat("- Evidence-based weighting strategy ready for modeling phase\n\n")

cat("NEXT STEPS:\n")
cat("- Integrate findings into Task 5 data selection criteria refinement\n")
cat("- Apply weight recommendations in modeling phase\n")
cat("- Consider multicollinearity implications if significant correlations found\n\n")

cat("=== TASK 4 ANALYSIS COMPLETE ===\n")

# Save key results
cat("Saving results to workspace...\n")

# Save important objects for potential reuse
save(combined_importance, cor_matrix, weight_strategy,
     file = "\task_04_results.RData")

cat("Results saved to task_04_results.RData\n")
