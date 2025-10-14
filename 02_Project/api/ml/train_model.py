"""
Random Forest Model Training Script
Replicates Milestone 3 Task 03 model training with Python
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib
import json
import os
from datetime import datetime
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def load_training_data(data_path):
    """Load pre-split training data"""
    print(f"Loading training data from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} training records with {len(df.columns)} columns")
    return df


def prepare_features_and_target(df):
    """
    Separate features and target variable

    Args:
        df: DataFrame with all columns from train_data.csv

    Returns:
        X: Feature matrix (27 features)
        y: Target vector (value_log_scaled)
        feature_names: List of feature names
    """
    # Target variable
    target_col = 'value_log_scaled'
    y = df[target_col]

    # Feature columns (all except target)
    feature_cols = [col for col in df.columns if col != target_col]
    X = df[feature_cols].copy()

    # Handle categorical columns that might be text
    categorical_mappings = {}

    # Convert text categorical columns to numeric
    for col in X.columns:
        if X[col].dtype == 'object' or X[col].dtype.name == 'category':
            print(f"Encoding categorical column: {col}")
            # Create mapping for this column
            unique_vals = X[col].unique()
            mapping = {val: idx for idx, val in enumerate(unique_vals)}
            categorical_mappings[col] = mapping
            X[col] = X[col].map(mapping)
            print(f"  Mapped: {mapping}")

    # Save categorical mappings
    if categorical_mappings:
        output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'outputs')
        os.makedirs(output_dir, exist_ok=True)
        with open(os.path.join(output_dir, 'categorical_mappings.json'), 'w') as f:
            json.dump(categorical_mappings, f, indent=2)

    print(f"Features: {len(feature_cols)} columns")
    print(f"Target: {target_col}")
    print(f"Sample shape: X={X.shape}, y={y.shape}")

    return X, y, feature_cols


def train_random_forest(X, y, hyperparams=None):
    """
    Train Random Forest model with hyperparameters matching R model

    Args:
        X: Feature matrix
        y: Target vector
        hyperparams: Dict of hyperparameters (or None for defaults)

    Returns:
        Trained RandomForestRegressor model
    """
    # Default hyperparameters from Milestone 3 Task 03
    if hyperparams is None:
        hyperparams = {
            'n_estimators': 750,        # ntree in R
            'max_features': 'sqrt',      # mtry optimization
            'min_samples_leaf': 5,       # nodesize optimization
            'random_state': 123,         # Seed for reproducibility
            'n_jobs': -1,                # Use all CPU cores
            'verbose': 1                 # Show progress
        }

    print("\nTraining Random Forest with hyperparameters:")
    for key, value in hyperparams.items():
        print(f"  {key}: {value}")

    model = RandomForestRegressor(**hyperparams)

    print("\nTraining model...")
    model.fit(X, y)
    print("Training complete!")

    # Calculate OOB error
    oob_score = model.score(X, y)
    print(f"Training R2 score: {oob_score:.6f}")

    return model


def calculate_metrics(y_true, y_pred):
    """Calculate regression metrics"""
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)

    return {
        'rmse': float(rmse),
        'mae': float(mae),
        'r2': float(r2)
    }


def get_feature_importance(model, feature_names):
    """Extract feature importance rankings"""
    importances = model.feature_importances_
    feature_importance = [
        {
            'feature': name,
            'importance': float(imp)
        }
        for name, imp in zip(feature_names, importances)
    ]

    # Sort by importance descending
    feature_importance = sorted(
        feature_importance,
        key=lambda x: x['importance'],
        reverse=True
    )

    return feature_importance


def save_model_artifacts(model, feature_names, feature_importance, metrics, output_dir):
    """Save model and metadata"""
    os.makedirs(output_dir, exist_ok=True)

    # Save model
    model_path = os.path.join(output_dir, 'final_rf_model.pkl')
    joblib.dump(model, model_path)
    print(f"\nSaved model to: {model_path}")

    # Save feature names
    feature_names_path = os.path.join(output_dir, 'feature_names.json')
    with open(feature_names_path, 'w') as f:
        json.dump(feature_names, f, indent=2)
    print(f"Saved feature names to: {feature_names_path}")

    # Save feature importance
    importance_path = os.path.join(output_dir, 'feature_importance.json')
    with open(importance_path, 'w') as f:
        json.dump(feature_importance, f, indent=2)
    print(f"Saved feature importance to: {importance_path}")

    # Save metrics
    metadata = {
        'training_date': datetime.now().isoformat(),
        'model_type': 'RandomForestRegressor',
        'n_estimators': int(model.n_estimators),
        'max_features': model.max_features,
        'min_samples_leaf': int(model.min_samples_leaf),
        'random_state': int(model.random_state) if model.random_state else None,
        'n_features': len(feature_names),
        'metrics': metrics
    }

    metadata_path = os.path.join(output_dir, 'model_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved model metadata to: {metadata_path}")


def main():
    """Main training pipeline"""
    print("=" * 60)
    print("Random Forest Model Training - Survey Analytics")
    print("=" * 60)

    # Paths
    # We're in 02_Project/api/ml/, need to go up to 02_Project/
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    train_data_path = os.path.join(base_dir, 'Data', '04_Split', 'train_data.csv')
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'outputs')

    # Check if training data exists
    if not os.path.exists(train_data_path):
        print(f"ERROR: Training data not found at {train_data_path}")
        return

    # Load data
    df_train = load_training_data(train_data_path)

    # Prepare features and target
    X_train, y_train, feature_names = prepare_features_and_target(df_train)

    # Train model
    model = train_random_forest(X_train, y_train)

    # Calculate training metrics
    y_train_pred = model.predict(X_train)
    train_metrics = calculate_metrics(y_train, y_train_pred)

    print("\nTraining Metrics:")
    print(f"  RMSE: {train_metrics['rmse']:.6f}")
    print(f"  MAE:  {train_metrics['mae']:.6f}")
    print(f"  R2:   {train_metrics['r2']:.6f}")

    # Get feature importance
    feature_importance = get_feature_importance(model, feature_names)

    print("\nTop 10 Most Important Features:")
    for i, feat in enumerate(feature_importance[:10], 1):
        print(f"  {i}. {feat['feature']}: {feat['importance']:.4f}")

    # Save everything
    save_model_artifacts(
        model,
        feature_names,
        feature_importance,
        train_metrics,
        output_dir
    )

    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)
    print(f"\nModel artifacts saved to: {output_dir}")
    print("\nNext steps:")
    print("  1. Run evaluate_model.py to test on test/validation sets")
    print("  2. Use model_loader.py to load model for predictions")


if __name__ == '__main__':
    main()
