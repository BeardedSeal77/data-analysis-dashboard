'use client'

export default function ReportingDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reporting Dashboard
          </h1>
          <p className="text-gray-600">
            Explore various data visualizations and reports from health survey data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a href="/project/reporting/water">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border-2 border-transparent hover:border-blue-500">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="ml-4 text-xl font-semibold text-gray-900">
                  Water Sources
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Pie chart visualization of household water source distribution
              </p>
              <div className="text-sm text-gray-500">
                <p>11 water source categories</p>
                <p>Improved vs. unimproved breakdown</p>
              </div>
              <div className="flex items-center text-blue-600 font-medium mt-4">
                <span>View Report</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            About These Reports
          </h3>
          <p className="text-blue-800 text-sm">
            These reports are generated from survey data located in 02_Project/Data/Flat Data/.
            Each report provides interactive visualizations and detailed breakdowns of the data.
          </p>
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
      </div>
    </div>
  )
}
