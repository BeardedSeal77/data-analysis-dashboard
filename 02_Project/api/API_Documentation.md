# Health Survey ML API Documentation

Base URL: `http://localhost:5001`

---

## Health Check

### GET `/api/health`
Check if API is running and model is loaded.

**Response:**
```json
{
  "status": "OK",
  "message": "Survey Analytics ML API",
  "model_loaded": true,
  "port": 5001,
  "timestamp": "2025-10-13T16:45:00.000000"
}
```

---

## Model Management

### GET `/api/ml/model-info`
Get information about the loaded model.

**Response:**
```json
{
  "model_type": "RandomForestRegressor",
  "training_date": "2025-10-13T16:39:21.355039",
  "n_estimators": 750,
  "n_features": 27,
  "n_samples": 560,
  "metrics": {
    "rmse": 0.1882,
    "mae": 0.1393,
    "r2": 0.9654
  },
  "status": "loaded"
}
```

### GET `/api/ml/feature-importance?top_n=10`
Get top N most important features.

**Query Parameters:**
- `top_n` (optional, default=10): Number of features to return

**Response:**
```json
{
  "top_features": [
    {
      "feature": "value_log",
      "importance": 0.3977
    },
    {
      "feature": "precision_scaled",
      "importance": 0.1473
    }
  ],
  "count": 10
}
```

---

## Training

### POST `/api/ml/train`
Train a new model from uploaded training data.

**Form Data:**
- `file`: CSV file with training data (must have `value_log_scaled` column)

**Expected CSV Format:**
Must include columns from `train_data.csv`:
- Target: `value_log_scaled`
- Features: 27 engineered features (precision_scaled, indicator_encoded, type_I, etc.)

**Example using curl:**
```bash
curl -X POST http://localhost:5001/api/ml/train \
  -F "file=@C:/path/to/train_data.csv"
```

**Response:**
```json
{
  "success": true,
  "message": "Model trained successfully",
  "metrics": {
    "rmse": 0.1882,
    "mae": 0.1393,
    "r2": 0.9654
  },
  "n_features": 27,
  "n_samples": 560,
  "timestamp": "2025-10-13T17:00:00.000000"
}
```

### POST `/api/ml/evaluate`
Evaluate model on test/validation data.

**Form Data:**
- `file`: CSV file with test data
- `dataset_name` (optional): Name for display (default: "Test")

**Example using curl:**
```bash
curl -X POST http://localhost:5001/api/ml/evaluate \
  -F "file=@C:/path/to/test_data.csv" \
  -F "dataset_name=Test"
```

**Response:**
```json
{
  "success": true,
  "dataset": "Test",
  "metrics": {
    "rmse": 0.2092,
    "mae": 0.1592,
    "r2": 0.9533
  },
  "n_samples": 149
}
```

---

## Prediction

### POST `/api/ml/predict-csv`
Upload CSV and get predictions for all rows.

**Form Data:**
- `file`: CSV file with same features as training data
- `format` (optional): Return format - "json" or "csv" (default: "json")

**CSV must have the same 27 features** as training data (without target column).

**Example - Return JSON:**
```bash
curl -X POST http://localhost:5001/api/ml/predict-csv \
  -F "file=@C:/path/to/survey_data.csv" \
  -F "format=json"
```

**Response (JSON):**
```json
{
  "success": true,
  "row_count": 100,
  "predictions": [
    {
      "precision_scaled": 0.66,
      "type_I": 1,
      ...
      "predicted_value_log_scaled": -1.587
    }
  ],
  "timestamp": "2025-10-13T17:00:00.000000"
}
```

**Example - Return CSV:**
```bash
curl -X POST http://localhost:5001/api/ml/predict-csv \
  -F "file=@C:/path/to/survey_data.csv" \
  -F "format=csv" \
  -o predictions.csv
```

Returns CSV file with original data + `predicted_value_log_scaled` column.

### POST `/api/ml/predict-sample`
Preview first 10 predictions without downloading full results.

**Form Data:**
- `file`: CSV file

**Response:**
```json
{
  "success": true,
  "sample_size": 10,
  "total_rows": 560,
  "sample": [
    {
      "precision_scaled": 0.66,
      ...
      "predicted_value_log_scaled": -1.587
    }
  ]
}
```

---

## Data Info

### POST `/api/ml/data-info`
Get information about uploaded CSV without making predictions.

**Form Data:**
- `file`: CSV file

**Response:**
```json
{
  "row_count": 560,
  "column_count": 28,
  "columns": ["value_log_scaled", "precision_scaled", ...],
  "dtypes": {
    "value_log_scaled": "float64",
    "precision_scaled": "float64",
    "indicator_importance": "object"
  },
  "missing_values": {
    "value_log_scaled": 0,
    "precision_scaled": 0
  },
  "sample_rows": [
    {
      "value_log_scaled": 0.262,
      "precision_scaled": 0.66,
      ...
    }
  ]
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing file, invalid data)
- `404` - Not Found (model not loaded)
- `500` - Internal Server Error

---

## Testing with Postman/Thunder Client

### 1. Test Health Check
```
GET http://localhost:5001/api/health
```

### 2. Check Model Info
```
GET http://localhost:5001/api/ml/model-info
```

### 3. Train Model
```
POST http://localhost:5001/api/ml/train
Body: form-data
  - file: [Select train_data.csv]
```

### 4. Evaluate Model
```
POST http://localhost:5001/api/ml/evaluate
Body: form-data
  - file: [Select test_data.csv]
  - dataset_name: "Test"
```

### 5. Make Predictions
```
POST http://localhost:5001/api/ml/predict-csv
Body: form-data
  - file: [Select survey_data.csv]
  - format: "json"
```

---

## Data Requirements

### Training/Evaluation CSV Format
Must contain these columns (from R preprocessing):

**Target:**
- `value_log_scaled`

**Features (27 total):**
1. `precision_scaled`
2. `characteristic_order_scaled`
3. `indicator_order_scaled`
4. `data_quality_score_scaled`
5. `is_preferred`
6. `high_precision`
7. `indicator_encoded`
8. `survey_cohort`
9. `dataset_source_encoded`
10. `char_order_quintile`
11. `indicator_importance` (text: "Low", "Medium", "High")
12. `sample_size_tier` (text: "Small", "Medium", "Large")
13. `by_var_0`
14. `by_var_14000`
15. `by_var_14001`
16. `by_var_14002`
17. `by_var_Other`
18. `type_D`
19. `type_I`
20. `type_S`
21. `type_T`
22. `type_U`
23. `char_Five year periods`
24. `char_Source of vaccination information`
25. `char_Total`
26. `char_Total 15-49`
27. `value_log` (not used in model but present in data)

### Prediction CSV Format
Same as training, but **without** the `value_log_scaled` target column.

---

## Workflow Example

1. **Start Server:**
   ```bash
   Z_start-dev.bat
   ```

2. **Check Health:**
   ```bash
   curl http://localhost:5001/api/health
   ```

3. **Train Model:**
   ```bash
   curl -X POST http://localhost:5001/api/ml/train \
     -F "file=@02_Project/Data/04_Split/train_data.csv"
   ```

4. **Evaluate Model:**
   ```bash
   curl -X POST http://localhost:5001/api/ml/evaluate \
     -F "file=@02_Project/Data/04_Split/test_data.csv" \
     -F "dataset_name=Test"
   ```

5. **Make Predictions:**
   ```bash
   curl -X POST http://localhost:5001/api/ml/predict-csv \
     -F "file=@02_Project/Data/04_Split/val_data.csv" \
     -F "format=csv" \
     -o predictions.csv
   ```

---

## Notes

- Model is automatically loaded on startup if it exists
- Training overwrites existing model
- All CSV uploads must use pre-processed data from R
- Categorical columns (`indicator_importance`, `sample_size_tier`) are automatically encoded
- Predictions are in log-scaled space - interpret accordingly
