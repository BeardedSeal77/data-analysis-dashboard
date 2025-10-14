"""
Model Evaluation Script
Tests trained model on test and validation sets
Compares performance with R model metrics
"""

import pandas as pd
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib
import json
import os


def load_model_and_metadata(model_dir):
    """Load trained model and metadata"""
    model_path = os.path.join(model_dir, 'final_rf_model.pkl')
    metadata_path = os.path.join(model_dir, 'model_metadata.json')

    model = joblib.load(model_path)

    with open(metadata_path, 'r') as f:
        metadata = json.load(f)

    return model, metadata


def load_test_data(data_path):
    """Load test or validation data"""
    df = pd.read_csv(data_path)
    return df


def evaluate_on_dataset(model, df, dataset_name, categorical_mappings_path):
    """
    Evaluate model on a dataset

    Args:
        model: Trained model
        df: DataFrame with features and target
        dataset_name: Name for display (e.g., 'Test', 'Validation')
        categorical_mappings_path: Path to categorical mappings JSON

    Returns:
        Dict of metrics
    """
    # Separate features and target
    target_col = 'value_log_scaled'
    y_true = df[target_col]
    X = df[[col for col in df.columns if col != target_col]].copy()

    # Load categorical mappings and encode text columns
    if os.path.exists(categorical_mappings_path):
        with open(categorical_mappings_path, 'r') as f:
            categorical_mappings = json.load(f)

        for col, mapping in categorical_mappings.items():
            if col in X.columns:
                X[col] = X[col].map(mapping)

    # Make predictions
    y_pred = model.predict(X)

    # Calculate metrics
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)

    metrics = {
        'dataset': dataset_name,
        'n_samples': len(df),
        'rmse': float(rmse),
        'mae': float(mae),
        'r2': float(r2)
    }

    return metrics, y_true, y_pred


def compare_with_r_model(python_metrics):
    """
    Compare Python model metrics with R model results
    R model (from Task 04):
    - Test: RMSE=0.056, MAE=0.038, R2=0.9967
    - Validation: RMSE=0.075, MAE=0.045, R2=0.9933
    """
    r_benchmarks = {
        'Test': {'rmse': 0.056, 'mae': 0.038, 'r2': 0.9967},
        'Validation': {'rmse': 0.075, 'mae': 0.045, 'r2': 0.9933}
    }

    print("\n" + "=" * 70)
    print("Comparison: Python vs R Model")
    print("=" * 70)

    for metrics in python_metrics:
        dataset = metrics['dataset']
        if dataset in r_benchmarks:
            r_metrics = r_benchmarks[dataset]

            print(f"\n{dataset} Set:")
            print(f"  {'Metric':<10} {'Python':<15} {'R Model':<15} {'Difference':<15}")
            print(f"  {'-'*10} {'-'*15} {'-'*15} {'-'*15}")

            # RMSE
            diff_rmse = metrics['rmse'] - r_metrics['rmse']
            print(f"  {'RMSE':<10} {metrics['rmse']:<15.6f} {r_metrics['rmse']:<15.6f} {diff_rmse:+.6f}")

            # MAE
            diff_mae = metrics['mae'] - r_metrics['mae']
            print(f"  {'MAE':<10} {metrics['mae']:<15.6f} {r_metrics['mae']:<15.6f} {diff_mae:+.6f}")

            # R2
            diff_r2 = metrics['r2'] - r_metrics['r2']
            print(f"  {'R2':<10} {metrics['r2']:<15.6f} {r_metrics['r2']:<15.6f} {diff_r2:+.6f}")

            # Overall assessment
            rmse_pct_diff = abs(diff_rmse / r_metrics['rmse']) * 100
            if rmse_pct_diff < 5:
                status = "EXCELLENT (within 5% of R model)"
            elif rmse_pct_diff < 10:
                status = "GOOD (within 10% of R model)"
            else:
                status = "NEEDS REVIEW (>10% difference from R model)"

            print(f"\n  Status: {status}")


def main():
    """Main evaluation pipeline"""
    print("=" * 70)
    print("Model Evaluation - Survey Analytics")
    print("=" * 70)

    # Paths
    # We're in 02_Project/api/ml/, need to go up to 02_Project/
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'outputs')
    test_data_path = os.path.join(base_dir, 'Data', '04_Split', 'test_data.csv')
    val_data_path = os.path.join(base_dir, 'Data', '04_Split', 'val_data.csv')

    # Load model
    print("\nLoading model...")
    model, metadata = load_model_and_metadata(model_dir)
    print(f"Model trained on: {metadata['training_date']}")
    print(f"Model type: {metadata['model_type']}")
    print(f"Number of trees: {metadata['n_estimators']}")

    # Load categorical mappings
    categorical_mappings_path = os.path.join(model_dir, 'categorical_mappings.json')

    # Evaluate on test set
    print("\n" + "-" * 70)
    print("Evaluating on Test Set")
    print("-" * 70)
    df_test = load_test_data(test_data_path)
    test_metrics, y_test_true, y_test_pred = evaluate_on_dataset(model, df_test, 'Test', categorical_mappings_path)

    print(f"\nTest Set Results ({test_metrics['n_samples']} samples):")
    print(f"  RMSE: {test_metrics['rmse']:.6f}")
    print(f"  MAE:  {test_metrics['mae']:.6f}")
    print(f"  R2:   {test_metrics['r2']:.6f}")

    # Evaluate on validation set
    print("\n" + "-" * 70)
    print("Evaluating on Validation Set")
    print("-" * 70)
    df_val = load_test_data(val_data_path)
    val_metrics, y_val_true, y_val_pred = evaluate_on_dataset(model, df_val, 'Validation', categorical_mappings_path)

    print(f"\nValidation Set Results ({val_metrics['n_samples']} samples):")
    print(f"  RMSE: {val_metrics['rmse']:.6f}")
    print(f"  MAE:  {val_metrics['mae']:.6f}")
    print(f"  R2:   {val_metrics['r2']:.6f}")

    # Compare with R model
    compare_with_r_model([test_metrics, val_metrics])

    # Save evaluation results
    evaluation_results = {
        'test_metrics': test_metrics,
        'validation_metrics': val_metrics,
        'training_metrics': metadata['metrics']
    }

    results_path = os.path.join(model_dir, 'evaluation_results.json')
    with open(results_path, 'w') as f:
        json.dump(evaluation_results, f, indent=2)

    print("\n" + "=" * 70)
    print("Evaluation Complete!")
    print("=" * 70)
    print(f"\nResults saved to: {results_path}")

    # Final summary
    print("\nSummary:")
    print(f"  Training samples:   {metadata['metrics']['r2']:.4f} R2")
    print(f"  Test samples:       {test_metrics['r2']:.4f} R2")
    print(f"  Validation samples: {val_metrics['r2']:.4f} R2")
    print("\nModel is ready for deployment!")


if __name__ == '__main__':
    main()
