'use client'

import { useState } from 'react'
import { getSamplePredictions, predictFromCSV } from '../lib/api'
import type { SamplePredictionResponse, PredictionRow } from '../lib/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

export default function PredictPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sampleResult, setSampleResult] = useState<SamplePredictionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (selectedFile: File) => {
    const isCSV = selectedFile.name.toLowerCase().endsWith('.csv') ||
                  selectedFile.type === 'text/csv' ||
                  selectedFile.type === 'application/vnd.ms-excel' ||
                  selectedFile.type === ''

    if (selectedFile && isCSV) {
      setFile(selectedFile)
      setSampleResult(null)
      setError(null)
    } else {
      setError('Please select a valid CSV file')
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handlePreview = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await getSamplePredictions(file)
      setSampleResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadCSV = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const blob = await predictFromCSV(file, 'csv') as Blob

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'predictions.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-12 border-4 border-dashed border-blue-500 shadow-2xl">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-blue-500 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-2xl font-semibold text-gray-900 mb-2">
                Drop your CSV file here
              </p>
              <p className="text-sm text-gray-600">
                Release to upload
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upload Survey Data
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) {
                  handleFileSelect(selectedFile)
                }
              }}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100"
            />
            <p className="mt-2 text-sm text-gray-500">
              CSV must contain the same 27 engineered features as training data
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handlePreview}
              disabled={!file || isLoading}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {isLoading && !sampleResult ? 'Loading...' : 'Preview (First 10 Rows)'}
            </button>

            <button
              onClick={handleDownloadCSV}
              disabled={!file || isLoading}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {isLoading && sampleResult ? 'Downloading...' : 'Download Full Predictions CSV'}
            </button>
          </div>
        </div>

        {/* Preview Results */}
        {sampleResult && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Preview Results
            </h2>

            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing first {sampleResult.sample_size} of {sampleResult.total_rows} rows
              </p>
              <span className="text-sm font-medium text-blue-600">
                {sampleResult.total_rows} total predictions available
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Row
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Predicted Value (%)
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Actual Value (%)
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Difference
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Importance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sampleResult.sample.map((row: PredictionRow, idx: number) => {
                    const predictedValue = row.predicted_value || 0
                    const actualValue = row.value_log ? Math.exp(row.value_log) : null
                    const difference = actualValue !== null ? predictedValue - actualValue : null

                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-green-600">
                          {predictedValue.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-blue-600">
                          {actualValue !== null ? actualValue.toFixed(2) + '%' : 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium">
                          <span className={difference !== null ?
                            (Math.abs(difference) < 5 ? 'text-green-600' :
                             Math.abs(difference) < 10 ? 'text-yellow-600' :
                             'text-red-600') : 'text-gray-400'}>
                            {difference !== null ?
                              (difference > 0 ? '+' : '') + difference.toFixed(2) + '%' :
                              'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600">
                          {row.type_I === 1 ? 'I' : row.type_D === 1 ? 'D' : row.type_S === 1 ? 'S' : row.type_T === 1 ? 'T' : 'U'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600">
                          {row.indicator_importance || 'N/A'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Prediction Error Chart */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Prediction Error by Row
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Positive values indicate over-prediction, negative values indicate under-prediction
              </p>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={sampleResult.sample.map((row: PredictionRow, idx: number) => {
                      const predictedValue = row.predicted_value || 0
                      const actualValue = row.value_log ? Math.exp(row.value_log) : 0
                      const difference = predictedValue - actualValue

                      return {
                        row: `Row ${idx + 1}`,
                        Difference: difference,
                        fill: Math.abs(difference) < 5 ? '#10b981' :
                              Math.abs(difference) < 10 ? '#f59e0b' :
                              '#ef4444'
                      }
                    })}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="row"
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#999' }}
                    />
                    <YAxis
                      label={{ value: 'Difference (%)', angle: -90, position: 'insideLeft', style: { fill: '#666' } }}
                      tick={{ fill: '#666', fontSize: 12 }}
                      axisLine={{ stroke: '#999' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '10px'
                      }}
                      formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(2)}%`, 'Difference']}
                    />
                    <ReferenceLine
                      y={10}
                      stroke="#dc2626"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{
                        value: '+10% Threshold',
                        position: 'right',
                        fill: '#dc2626',
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    />
                    <ReferenceLine
                      y={-10}
                      stroke="#dc2626"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{
                        value: '-10% Threshold',
                        position: 'right',
                        fill: '#dc2626',
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    />
                    <Bar
                      dataKey="Difference"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={60}
                    >
                      {sampleResult.sample.map((row: PredictionRow, idx: number) => {
                        const predictedValue = row.predicted_value || 0
                        const actualValue = row.value_log ? Math.exp(row.value_log) : 0
                        const difference = predictedValue - actualValue
                        const fill = Math.abs(difference) < 5 ? '#10b981' :
                                    Math.abs(difference) < 10 ? '#f59e0b' :
                                    '#ef4444'

                        return <rect key={idx} fill={fill} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 flex justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-gray-700">Good (&lt; 5%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-gray-700">Moderate (5-10%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-gray-700">High (&gt; 10%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-900 text-sm">
                Preview looks good? Download the full CSV with all {sampleResult.total_rows} predictions using the button above.
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800 text-sm font-semibold">Error:</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            How it works:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Upload your pre-processed survey CSV (must have 27 features)</li>
            <li>2. Click "Preview" to see predictions for the first 10 rows</li>
            <li>3. Click "Download" to get the full CSV with predictions added</li>
            <li>4. The output CSV will have predicted_value (original %) and predicted_value_log_scaled columns</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
