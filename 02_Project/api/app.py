"""
Health Survey ML API
Train models and make predictions on survey data
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from datetime import datetime
import pandas as pd
import numpy as np
import json
from ml_service import MLService
import io

app = Flask(__name__)
CORS(app)

# Initialize ML Service
ML_MODEL_DIR = os.path.join(os.path.dirname(__file__), 'ml', 'outputs')
ml_service = MLService(ML_MODEL_DIR)

# Custom JSON encoder for numpy types
class NumpyJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, datetime):
            return obj.isoformat()
        if pd.isna(obj):
            return None
        return super(NumpyJSONEncoder, self).default(obj)

app.json_encoder = NumpyJSONEncoder


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check"""
    return jsonify({
        "status": "OK",
        "message": "Survey Analytics ML API",
        "model_loaded": ml_service.is_loaded,
        "port": 5001,
        "timestamp": datetime.now().isoformat()
    })


# ============================================================
# MODEL MANAGEMENT
# ============================================================

@app.route('/api/ml/model-info', methods=['GET'])
def ml_model_info():
    """Get model metadata and metrics"""
    try:
        if not ml_service.is_loaded:
            return jsonify({
                "status": "NOT_LOADED",
                "message": "No model loaded. Train or load a model first."
            }), 404

        info = ml_service.get_model_info()
        return jsonify(info)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/ml/feature-importance', methods=['GET'])
def ml_feature_importance():
    """Get feature importance rankings"""
    try:
        if not ml_service.is_loaded:
            return jsonify({"error": "No model loaded"}), 404

        top_n = request.args.get('top_n', 10, type=int)
        importance = ml_service.get_feature_importance(top_n=top_n)
        return jsonify({
            "top_features": importance,
            "count": len(importance)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/ml/reload', methods=['POST'])
def ml_reload():
    """Reload model from disk (after training via script)"""
    try:
        if ml_service.load_model():
            return jsonify({
                "success": True,
                "message": "Model reloaded successfully",
                "model_info": ml_service.get_model_info()
            })
        else:
            return jsonify({
                "success": False,
                "message": "No model found to reload"
            }), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# TRAINING
# ============================================================

@app.route('/api/ml/train', methods=['POST'])
def ml_train():
    """
    Train model using local training data
    Uses 02_Project/Data/04_Split/train_data.csv
    """
    try:
        # Path to local training data
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        train_path = os.path.join(base_dir, 'Data', '04_Split', 'train_data.csv')

        if not os.path.exists(train_path):
            return jsonify({"error": f"Training data not found at {train_path}"}), 404

        # Read training data
        df_train = pd.read_csv(train_path)

        # Train model
        result = ml_service.train_model(df_train)

        return jsonify({
            "success": True,
            "message": "Model trained successfully",
            "metrics": result['metrics'],
            "n_features": result['n_features'],
            "n_samples": result['n_samples'],
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/ml/evaluate', methods=['POST'])
def ml_evaluate():
    """
    Evaluate model on test/validation data
    Expects test_data.csv or val_data.csv in the request
    """
    try:
        if not ml_service.is_loaded:
            return jsonify({"error": "No model loaded. Train a model first."}), 404

        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        dataset_name = request.form.get('dataset_name', 'Test')

        # Read test data
        df_test = pd.read_csv(file)

        # Evaluate
        result = ml_service.evaluate_model(df_test, dataset_name)

        return jsonify({
            "success": True,
            "dataset": dataset_name,
            "metrics": result['metrics'],
            "n_samples": result['n_samples']
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# PREDICTION
# ============================================================

@app.route('/api/ml/predict-csv', methods=['POST'])
def ml_predict_csv():
    """
    Upload survey CSV and get predictions for all entries
    Handles preprocessing automatically
    """
    try:
        if not ml_service.is_loaded:
            return jsonify({"error": "No model loaded. Train a model first."}), 404

        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Get return format preference
        return_format = request.form.get('format', 'json')  # 'json' or 'csv'

        # Read CSV
        df = pd.read_csv(file)
        original_df = df.copy()

        # Predict (ml_service handles preprocessing internally)
        predictions_scaled = ml_service.predict_from_dataframe(df)

        # Inverse transform to get original values
        predictions_original = ml_service.inverse_transform_predictions(predictions_scaled)

        # Add both predictions to original dataframe
        original_df['predicted_value_log_scaled'] = predictions_scaled
        original_df['predicted_value'] = predictions_original

        # Return in requested format
        if return_format == 'csv':
            # Convert to CSV and return as file
            output = io.StringIO()
            original_df.to_csv(output, index=False)
            output.seek(0)

            return send_file(
                io.BytesIO(output.getvalue().encode()),
                mimetype='text/csv',
                as_attachment=True,
                download_name='predictions.csv'
            )
        else:
            # Return as JSON
            return jsonify({
                "success": True,
                "row_count": len(original_df),
                "predictions": original_df.to_dict('records'),
                "timestamp": datetime.now().isoformat()
            })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/ml/predict-sample', methods=['POST'])
def ml_predict_sample():
    """
    Get sample predictions (first 10 rows)
    For quick preview without downloading full CSV
    """
    try:
        if not ml_service.is_loaded:
            return jsonify({"error": "No model loaded"}), 404

        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        df = pd.read_csv(file)

        # Predict on first 10 rows
        sample_df = df.head(10)
        predictions_scaled = ml_service.predict_from_dataframe(sample_df)

        # Inverse transform to get original values
        predictions_original = ml_service.inverse_transform_predictions(predictions_scaled)

        sample_df['predicted_value_log_scaled'] = predictions_scaled
        sample_df['predicted_value'] = predictions_original

        return jsonify({
            "success": True,
            "sample_size": len(sample_df),
            "total_rows": len(df),
            "sample": sample_df.to_dict('records')
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/ml/predict-validation', methods=['POST'])
def ml_predict_validation():
    """
    Get predictions on validation data (val_data.csv)
    No file upload needed - uses local validation data
    """
    try:
        if not ml_service.is_loaded:
            return jsonify({"error": "No model loaded"}), 404

        # Path to local validation data
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        val_path = os.path.join(base_dir, 'Data', '04_Split', 'val_data.csv')

        if not os.path.exists(val_path):
            return jsonify({"error": f"Validation data not found at {val_path}"}), 404

        # Read validation data
        df = pd.read_csv(val_path)

        # Predict on first 10 rows
        sample_df = df.head(10)
        predictions_scaled = ml_service.predict_from_dataframe(sample_df)

        # Inverse transform to get original values
        predictions_original = ml_service.inverse_transform_predictions(predictions_scaled)

        sample_df['predicted_value_log_scaled'] = predictions_scaled
        sample_df['predicted_value'] = predictions_original

        return jsonify({
            "success": True,
            "sample_size": len(sample_df),
            "total_rows": len(df),
            "sample": sample_df.to_dict('records')
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# DATA INFO
# ============================================================

@app.route('/api/ml/data-info', methods=['POST'])
def ml_data_info():
    """
    Upload CSV to get data summary without predictions
    Useful for checking data before prediction
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        df = pd.read_csv(file)

        info = {
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": df.columns.tolist(),
            "dtypes": {col: str(df[col].dtype) for col in df.columns},
            "missing_values": {col: int(df[col].isna().sum()) for col in df.columns},
            "sample_rows": df.head(5).to_dict('records')
        }

        return jsonify(info)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("Health Survey ML API")
    print("=" * 60)

    # Try to load existing model
    print("\nChecking for existing model...")
    if ml_service.load_model():
        print("[SUCCESS] Model loaded from disk")
    else:
        print("[INFO] No model found - train a new model via /api/ml/train")

    print("\nStarting Flask server...")
    print("=" * 60)
    print("API Endpoints:")
    print("  Health:              GET  /api/health")
    print("  Model Info:          GET  /api/ml/model-info")
    print("  Feature Importance:  GET  /api/ml/feature-importance")
    print("  Train Model:         POST /api/ml/train")
    print("  Evaluate Model:      POST /api/ml/evaluate")
    print("  Predict CSV:         POST /api/ml/predict-csv")
    print("  Predict Sample:      POST /api/ml/predict-sample")
    print("  Data Info:           POST /api/ml/data-info")
    print("=" * 60)
    print(f"\nServer running at: http://localhost:5001")
    print("=" * 60)
    print()

    app.run(debug=True, host='0.0.0.0', port=5001)
