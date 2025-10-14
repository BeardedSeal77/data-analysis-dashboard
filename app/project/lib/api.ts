// API client for ML endpoints
import type {
  HealthResponse,
  ModelInfo,
  FeatureImportanceResponse,
  TrainingResponse,
  EvaluationResponse,
  PredictionResponse,
  SamplePredictionResponse,
  DataInfo,
  ErrorResponse
} from './types';

const API_BASE = 'http://localhost:5001';

// Helper function to handle responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
}

// GET endpoints
export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/api/health`);
  return handleResponse<HealthResponse>(response);
}

export async function getModelInfo(): Promise<ModelInfo> {
  const response = await fetch(`${API_BASE}/api/ml/model-info`);
  return handleResponse<ModelInfo>(response);
}

export async function getFeatureImportance(topN: number = 10): Promise<FeatureImportanceResponse> {
  const response = await fetch(`${API_BASE}/api/ml/feature-importance?top_n=${topN}`);
  return handleResponse<FeatureImportanceResponse>(response);
}

// POST endpoints
export async function trainModel(): Promise<TrainingResponse> {
  // No file needed - trains using local data
  const response = await fetch(`${API_BASE}/api/ml/train`, {
    method: 'POST'
  });

  return handleResponse<TrainingResponse>(response);
}

export async function evaluateModel(file: File, datasetName: string = 'Test'): Promise<EvaluationResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('dataset_name', datasetName);

  const response = await fetch(`${API_BASE}/api/ml/evaluate`, {
    method: 'POST',
    body: formData
  });

  return handleResponse<EvaluationResponse>(response);
}

export async function predictFromCSV(file: File, format: 'json' | 'csv' = 'json'): Promise<PredictionResponse | Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', format);

  const response = await fetch(`${API_BASE}/api/ml/predict-csv`, {
    method: 'POST',
    body: formData
  });

  if (format === 'csv') {
    if (!response.ok) {
      throw new Error('Prediction failed');
    }
    return response.blob();
  }

  return handleResponse<PredictionResponse>(response);
}

export async function getSamplePredictions(file: File): Promise<SamplePredictionResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/ml/predict-sample`, {
    method: 'POST',
    body: formData
  });

  return handleResponse<SamplePredictionResponse>(response);
}

export async function getDataInfo(file: File): Promise<DataInfo> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/ml/data-info`, {
    method: 'POST',
    body: formData
  });

  return handleResponse<DataInfo>(response);
}

export async function reloadModel(): Promise<{ success: boolean; message: string; model_info?: ModelInfo }> {
  const response = await fetch(`${API_BASE}/api/ml/reload`, {
    method: 'POST'
  });

  return handleResponse(response);
}
