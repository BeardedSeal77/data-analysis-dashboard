"""
ML Service Module
Handles model training, evaluation, and predictions
Includes preprocessing for raw survey CSV data
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score


class MLService:
    """
    Machine Learning Service for Survey Analytics

    Workflow:
    1. Train model from pre-processed CSV (train_data.csv from R preprocessing)
    2. Make predictions on new pre-processed CSV data
    3. Data must already have the 27 engineered features from R
    """

    def __init__(self, model_dir):
        """
        Initialize ML Service

        Args:
            model_dir: Directory to save/load model artifacts
        """
        self.model_dir = model_dir
        self.model = None
        self.metadata = None
        self.feature_names = None
        self.feature_importance = None
        self.categorical_mappings = None
        self.value_log_scaler = None
        self.is_loaded = False

        # Create outputs directory if it doesn't exist
        os.makedirs(model_dir, exist_ok=True)

    def train_model(self, df_train, hyperparams=None):
        """
        Train Random Forest model from pre-processed training data

        Args:
            df_train: DataFrame with engineered features + target (value_log_scaled)
            hyperparams: Optional dict of hyperparameters

        Returns:
            Dict with training results
        """
        # Default hyperparameters
        if hyperparams is None:
            hyperparams = {
                'n_estimators': 750,
                'max_features': 'sqrt',
                'min_samples_leaf': 5,
                'random_state': 123,
                'n_jobs': -1
            }

        # Separate features and target
        target_col = 'value_log_scaled'
        if target_col not in df_train.columns:
            raise ValueError(f"Target column '{target_col}' not found in training data")

        y_train = df_train[target_col]
        X_train = df_train[[col for col in df_train.columns if col != target_col]].copy()

        if 'value_log' in df_train.columns:
            value_log_mean = float(df_train['value_log'].mean())
            value_log_std = float(df_train['value_log'].std())
            self.value_log_scaler = {
                'mean': value_log_mean,
                'std': value_log_std
            }
            print(f"[ML-SERVICE] Saved value_log scaler: mean={value_log_mean:.4f}, std={value_log_std:.4f}")

        # Handle categorical columns (encode text to numbers)
        self.categorical_mappings = {}
        for col in X_train.columns:
            if X_train[col].dtype == 'object' or X_train[col].dtype.name == 'category':
                unique_vals = X_train[col].unique()
                mapping = {val: idx for idx, val in enumerate(unique_vals)}
                self.categorical_mappings[col] = mapping
                X_train[col] = X_train[col].map(mapping)

        # Store feature names
        self.feature_names = X_train.columns.tolist()

        # Train model
        print(f"[ML-SERVICE] Training Random Forest...")
        print(f"[ML-SERVICE] Samples: {len(X_train)}, Features: {len(self.feature_names)}")

        self.model = RandomForestRegressor(**hyperparams)
        self.model.fit(X_train, y_train)

        # Calculate training metrics
        y_pred = self.model.predict(X_train)
        metrics = self._calculate_metrics(y_train, y_pred)

        # Get feature importance
        self.feature_importance = [
            {'feature': name, 'importance': float(imp)}
            for name, imp in zip(self.feature_names, self.model.feature_importances_)
        ]
        self.feature_importance.sort(key=lambda x: x['importance'], reverse=True)

        # Save metadata
        self.metadata = {
            'training_date': datetime.now().isoformat(),
            'model_type': 'RandomForestRegressor',
            'n_estimators': hyperparams['n_estimators'],
            'max_features': hyperparams['max_features'],
            'min_samples_leaf': hyperparams['min_samples_leaf'],
            'random_state': hyperparams.get('random_state'),
            'n_features': len(self.feature_names),
            'n_samples': len(X_train),
            'metrics': metrics
        }

        # Save everything to disk
        self._save_artifacts()

        self.is_loaded = True

        print(f"[ML-SERVICE] Training complete - R2: {metrics['r2']:.4f}")

        return {
            'metrics': metrics,
            'n_features': len(self.feature_names),
            'n_samples': len(X_train)
        }

    def evaluate_model(self, df_test, dataset_name='Test'):
        """
        Evaluate model on test/validation data

        Args:
            df_test: DataFrame with same structure as training data
            dataset_name: Name for display (e.g., 'Test', 'Validation')

        Returns:
            Dict with evaluation metrics
        """
        if not self.is_loaded:
            raise ValueError("Model not loaded")

        # Separate features and target
        target_col = 'value_log_scaled'
        y_true = df_test[target_col]
        X_test = df_test[[col for col in df_test.columns if col != target_col]].copy()

        # Apply categorical mappings
        if self.categorical_mappings:
            for col, mapping in self.categorical_mappings.items():
                if col in X_test.columns:
                    X_test[col] = X_test[col].map(mapping)

        # Make predictions
        y_pred = self.model.predict(X_test)

        # Calculate metrics
        metrics = self._calculate_metrics(y_true, y_pred)

        print(f"[ML-SERVICE] {dataset_name} Set - R2: {metrics['r2']:.4f}, RMSE: {metrics['rmse']:.4f}")

        return {
            'metrics': metrics,
            'n_samples': len(X_test)
        }

    def predict_from_dataframe(self, df):
        """
        Make predictions from pre-processed DataFrame

        Args:
            df: DataFrame with same engineered features as training data

        Returns:
            Array of predictions (scaled values)
        """
        if not self.is_loaded:
            raise ValueError("Model not loaded")

        # Prepare features (exclude target if present)
        target_col = 'value_log_scaled'
        if target_col in df.columns:
            X = df[[col for col in df.columns if col != target_col]].copy()
        else:
            X = df.copy()

        # Apply categorical mappings
        if self.categorical_mappings:
            for col, mapping in self.categorical_mappings.items():
                if col in X.columns:
                    X[col] = X[col].map(mapping)

        # Ensure correct feature order
        X = X[self.feature_names]

        # Make predictions
        predictions = self.model.predict(X)

        return predictions

    def inverse_transform_predictions(self, predictions_scaled):
        """
        Convert scaled predictions back to original survey values

        Transformation chain (reversed):
        1. value_log_scaled → value_log (inverse z-score)
        2. value_log → value (inverse log1p)

        Args:
            predictions_scaled: Array of predictions in value_log_scaled space

        Returns:
            Array of predictions in original value space (percentages)
        """
        if self.value_log_scaler is None:
            print("[ML-SERVICE WARNING] No scaler available, returning scaled values")
            return predictions_scaled

        predictions_log = (predictions_scaled * self.value_log_scaler['std']) + self.value_log_scaler['mean']

        predictions_original = np.expm1(predictions_log)

        return predictions_original

    def load_model(self):
        """Load model and all artifacts from disk"""
        try:
            model_path = os.path.join(self.model_dir, 'final_rf_model.pkl')
            if not os.path.exists(model_path):
                return False

            # Load model
            self.model = joblib.load(model_path)

            # Load metadata
            with open(os.path.join(self.model_dir, 'model_metadata.json'), 'r') as f:
                self.metadata = json.load(f)

            # Load feature names
            with open(os.path.join(self.model_dir, 'feature_names.json'), 'r') as f:
                self.feature_names = json.load(f)

            # Load feature importance
            with open(os.path.join(self.model_dir, 'feature_importance.json'), 'r') as f:
                self.feature_importance = json.load(f)

            # Load categorical mappings if they exist
            mappings_path = os.path.join(self.model_dir, 'categorical_mappings.json')
            if os.path.exists(mappings_path):
                with open(mappings_path, 'r') as f:
                    self.categorical_mappings = json.load(f)

            # Load value_log scaler if it exists
            scaler_path = os.path.join(self.model_dir, 'value_log_scaler.json')
            if os.path.exists(scaler_path):
                with open(scaler_path, 'r') as f:
                    self.value_log_scaler = json.load(f)

            self.is_loaded = True
            return True

        except Exception as e:
            print(f"[ML-SERVICE ERROR] Failed to load model: {e}")
            return False

    def get_model_info(self):
        """Get model metadata and performance metrics"""
        if not self.is_loaded:
            raise ValueError("Model not loaded")

        return {
            'model_type': self.metadata['model_type'],
            'training_date': self.metadata['training_date'],
            'n_estimators': self.metadata['n_estimators'],
            'n_features': self.metadata['n_features'],
            'n_samples': self.metadata.get('n_samples', 'unknown'),  # Handle old models
            'metrics': self.metadata['metrics'],
            'status': 'loaded'
        }

    def get_feature_importance(self, top_n=10):
        """Get top N most important features"""
        if not self.is_loaded:
            raise ValueError("Model not loaded")

        return self.feature_importance[:top_n]

    def get_feature_metadata(self):
        """Get information about required features"""
        if not self.is_loaded:
            raise ValueError("Model not loaded")

        return {
            'feature_names': self.feature_names,
            'n_features': len(self.feature_names),
            'categorical_features': list(self.categorical_mappings.keys()) if self.categorical_mappings else []
        }

    def _calculate_metrics(self, y_true, y_pred):
        """Calculate regression metrics"""
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        mae = float(mean_absolute_error(y_true, y_pred))
        r2 = float(r2_score(y_true, y_pred))

        return {'rmse': rmse, 'mae': mae, 'r2': r2}

    def _save_artifacts(self):
        """Save model and metadata to disk"""
        # Save model
        joblib.dump(self.model, os.path.join(self.model_dir, 'final_rf_model.pkl'))

        # Save feature names
        with open(os.path.join(self.model_dir, 'feature_names.json'), 'w') as f:
            json.dump(self.feature_names, f, indent=2)

        # Save feature importance
        with open(os.path.join(self.model_dir, 'feature_importance.json'), 'w') as f:
            json.dump(self.feature_importance, f, indent=2)

        # Save metadata
        with open(os.path.join(self.model_dir, 'model_metadata.json'), 'w') as f:
            json.dump(self.metadata, f, indent=2)

        # Save categorical mappings
        if self.categorical_mappings:
            with open(os.path.join(self.model_dir, 'categorical_mappings.json'), 'w') as f:
                json.dump(self.categorical_mappings, f, indent=2)

        # Save value_log scaler
        if self.value_log_scaler:
            with open(os.path.join(self.model_dir, 'value_log_scaler.json'), 'w') as f:
                json.dump(self.value_log_scaler, f, indent=2)

        print(f"[ML-SERVICE] Model artifacts saved to {self.model_dir}")
