'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface WaterSource {
  ID: number
  Province: string
  'Water Source': string
  percentage: number
}

const COLORS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#6366f1',
  '#84cc16',
  '#f97316',
  '#a855f7',
  '#14b8a6'
]

const PROVINCES = [
  'All Provinces',
  'Gauteng',
  'KwaZulu-Natal',
  'Western Cape',
  'Eastern Cape',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Free State',
  'Northern Cape'
]

export default function WaterSourcePage() {
  const [allWaterData, setAllWaterData] = useState<WaterSource[]>([])
  const [selectedProvince, setSelectedProvince] = useState<string>('All Provinces')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWaterData()
  }, [])

  async function loadWaterData() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/data/Water_Provincial.csv')
      if (!response.ok) {
        throw new Error(`Failed to fetch water data: ${response.statusText}`)
      }
      const csvText = await response.text()

      const lines = csvText.trim().split('\n')
      const data: WaterSource[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',')
        const id = parseInt(values[0])
        const province = values[1]
        const waterSource = values[2]
        const percentage = parseFloat(values[3])

        if (!isNaN(percentage)) {
          data.push({
            ID: id,
            Province: province,
            'Water Source': waterSource,
            percentage: percentage
          })
        }
      }

      setAllWaterData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load water data')
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredData = () => {
    if (selectedProvince === 'All Provinces') {
      const grouped: { [key: string]: number } = {}
      allWaterData.forEach(row => {
        if (!grouped[row['Water Source']]) {
          grouped[row['Water Source']] = 0
        }
        grouped[row['Water Source']] += row.percentage
      })

      const provinceCount = PROVINCES.length - 1
      return Object.entries(grouped).map(([source, total], idx) => ({
        ID: idx + 1,
        Province: 'All Provinces',
        'Water Source': source,
        percentage: total / provinceCount
      }))
    } else {
      return allWaterData.filter(row => row.Province === selectedProvince)
    }
  }

  const filteredData = getFilteredData()

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-gray-700">{payload[0].value.toFixed(1)}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Water Source Distribution
          </h1>
          <p className="text-gray-600">
            Analysis of household water sources from health survey data
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">Loading water source data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error}</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Water Source Breakdown
                </h2>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">
                    Province:
                  </label>
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    {PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={500}>
                <PieChart>
                  <Pie
                    data={filteredData}
                    dataKey="percentage"
                    nameKey="Water Source"
                    cx="50%"
                    cy="50%"
                    outerRadius={180}
                    label={({ percentage }) => `${percentage.toFixed(1)}%`}
                    labelLine={true}
                  >
                    {filteredData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <h2 className="text-xl font-semibold text-gray-900 p-6 pb-4">
                Detailed Breakdown - {selectedProvince}
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Water Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((source, idx) => (
                      <tr key={source.ID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {source['Water Source']}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {source.percentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Key Insights - {selectedProvince}
              </h3>
              <ul className="text-blue-800 text-sm space-y-2">
                <li>• Improved water source access: {filteredData.find(s => s['Water Source'] === 'improved water source')?.percentage.toFixed(1)}%</li>
                <li>• Water piped into dwelling: {filteredData.find(s => s['Water Source'] === 'water piped into dwelling')?.percentage.toFixed(1)}%</li>
                <li>• Unimproved water sources: {filteredData.find(s => s['Water Source'] === 'unimproved water source')?.percentage.toFixed(1)}%</li>
                <li>• Surface water usage: {filteredData.find(s => s['Water Source'] === 'surface water')?.percentage.toFixed(1)}%</li>
              </ul>
            </div>

            <div className="mt-6 bg-yellow-50 border border-yellow-300 rounded-lg p-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                    Data Disclaimer
                  </h3>
                  <p className="text-yellow-800 text-sm">
                    All reports have provincial data randomly generated for demonstration purposes.
                    The provincial breakdowns are not official data and should not be used for actual analysis or decision-making.
                    National-level data is based on official survey sources.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
