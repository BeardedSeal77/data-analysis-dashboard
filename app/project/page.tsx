'use client'

import { useState, useEffect } from 'react'
import { getHealth, getModelInfo, trainModel } from './lib/api'
import type { ModelInfo } from './lib/types'

export default function ProjectDashboard() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTraining, setIsTraining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trainSuccess, setTrainSuccess] = useState(false)

  useEffect(() => {
    loadModelInfo()
  }, [])

  async function loadModelInfo() {
    setIsLoading(true)
    try {
      const health = await getHealth()
      if (health.model_loaded) {
        const info = await getModelInfo()
        setModelInfo(info)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model info')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTrain() {
    setIsTraining(true)
    setError(null)
    setTrainSuccess(false)

    try {
      const result = await trainModel()
      setTrainSuccess(true)
      // Reload model info after training
      await loadModelInfo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed')
    } finally {
      setIsTraining(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ML Dashboard
          </h1>
          <p className="text-gray-600">
            Train models and make predictions on health survey data
          </p>
        </div>

        {/* Success Message */}
        {trainSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-semibold">
              Model trained successfully! Updated metrics shown below.
            </p>
          </div>
        )}

        {/* Model Status Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Model Status
            </h2>
            <button
              onClick={handleTrain}
              disabled={isTraining}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm"
            >
              {isTraining ? 'Training...' : 'Train Model'}
            </button>
          </div>

          {isLoading ? (
            <p className="text-gray-500">Loading model information...</p>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          ) : modelInfo ? (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-lg font-semibold text-green-600">Loaded</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">R² Score</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {modelInfo.metrics.r2.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">RMSE</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {modelInfo.metrics.rmse.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Training Samples</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {modelInfo.n_samples}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Last trained: {new Date(modelInfo.training_date).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="text-yellow-800 text-sm">
                No model loaded. Click "Train Model" to train using local data.
              </p>
            </div>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Prediction Card */}
          <a href="/project/predict">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border-2 border-transparent hover:border-green-500">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="ml-4 text-xl font-semibold text-gray-900">
                  Make Predictions
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Upload survey CSV to get predictions for all entries
              </p>
              <div className="flex items-center text-green-600 font-medium">
                <span>Go to Predictions</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>

          {/* Feature Importance Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="ml-4 text-xl font-semibold text-gray-900">
                Model Insights
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Random Forest with 750 trees trained on 27 engineered features
            </p>
            <div className="text-sm text-gray-500">
              <p>• Features: precision, indicator type, sample size</p>
              <p>• Target: log-scaled health indicator values</p>
              <p>• Training data: 02_Project/Data/04_Split/</p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Quick Start
          </h3>
          <ol className="text-blue-800 text-sm space-y-2">
            <li>1. Click "Train Model" to train on local data (02_Project/Data/04_Split/train_data.csv)</li>
            <li>2. Wait for training to complete (~10 seconds)</li>
            <li>3. Go to "Make Predictions" and upload your survey CSV</li>
            <li>4. Download predictions CSV with results added</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
