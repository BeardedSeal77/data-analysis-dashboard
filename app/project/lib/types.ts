// TypeScript types for ML API

export interface ModelMetrics {
  rmse: number;
  mae: number;
  r2: number;
}

export interface ModelInfo {
  model_type: string;
  training_date: string;
  n_estimators: number;
  n_features: number;
  n_samples: number | string;
  metrics: ModelMetrics;
  status: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface FeatureImportanceResponse {
  top_features: FeatureImportance[];
  count: number;
}

export interface HealthResponse {
  status: string;
  message: string;
  model_loaded: boolean;
  port: number;
  timestamp: string;
}

export interface TrainingResponse {
  success: boolean;
  message: string;
  metrics: ModelMetrics;
  n_features: number;
  n_samples: number;
  timestamp: string;
}

export interface EvaluationResponse {
  success: boolean;
  dataset: string;
  metrics: ModelMetrics;
  n_samples: number;
}

export interface PredictionRow {
  [key: string]: any;
  predicted_value_log_scaled: number;
  predicted_value?: number;
}

export interface PredictionResponse {
  success: boolean;
  row_count: number;
  predictions: PredictionRow[];
  timestamp: string;
}

export interface SamplePredictionResponse {
  success: boolean;
  sample_size: number;
  total_rows: number;
  sample: PredictionRow[];
}

export interface DataInfo {
  row_count: number;
  column_count: number;
  columns: string[];
  dtypes: Record<string, string>;
  missing_values: Record<string, number>;
  sample_rows: Record<string, any>[];
}

export interface ErrorResponse {
  error: string;
}
