# Shiny Demo (Skeleton)

Purpose
- Minimal user-facing demo for Milestone 5 to load the trained model and return a prediction.

Expected Files
- Model: `../Milestone_3/Task_03/outputs/final_random_forest_model.rds`
- Training schema reference: `../Data/04_Split/train_data.csv`
- Feature roles: `../Data/03_Scaled/feature_metadata.csv`

How To Run (when implemented)
- Open `app.R` in RStudio and click Run App.
- Ensure required packages are installed (shiny, etc.)

Notes
- Keep the UI minimal (few inputs + Predict button).
- Use engineered features expected by the trained model; other features can default to training means/modes.
