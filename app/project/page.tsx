import Link from 'next/link'

export default function ProjectPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-4">
        <Link 
          href="/" 
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Data Analysis Project
        </h1>
        <p className="text-gray-600 mb-6">
          Analyze large datasets, perform data cleaning, and create powerful visualizations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Datasets */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              🗄️ Datasets
            </h2>
            <p className="text-blue-700 text-sm mb-4">
              Upload, explore, and manage your datasets
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              View Datasets
            </button>
          </div>

          {/* Data Analysis */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              🔬 Analysis
            </h2>
            <p className="text-green-700 text-sm mb-4">
              Perform statistical analysis and data exploration
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
              Start Analysis
            </button>
          </div>

          {/* Visualizations */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-purple-900 mb-2">
              📈 Visualizations
            </h2>
            <p className="text-purple-700 text-sm mb-4">
              Create charts, graphs, and interactive dashboards
            </p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
              Create Charts
            </button>
          </div>

          {/* Data Cleaning */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-orange-900 mb-2">
              🧹 Data Cleaning
            </h2>
            <p className="text-orange-700 text-sm mb-4">
              Clean, transform, and prepare your data
            </p>
            <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors">
              Clean Data
            </button>
          </div>

          {/* SQL Queries */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              🔍 SQL Queries
            </h2>
            <p className="text-red-700 text-sm mb-4">
              Execute custom SQL queries on your data
            </p>
            <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
              Query Builder
            </button>
          </div>

          {/* Reports */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              📄 Reports
            </h2>
            <p className="text-gray-700 text-sm mb-4">
              Generate comprehensive analysis reports
            </p>
            <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
              View Reports
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-medium text-green-800 mb-2">
            🚀 Ready to Use
          </h3>
          <p className="text-green-700 text-sm">
            The data analysis API is ready and connected to PostgreSQL. 
            Upload your datasets and start analyzing!
          </p>
          <p className="text-green-600 text-xs mt-2">
            API available at: <code>http://localhost:5001/api/</code>
          </p>
        </div>
      </div>
    </div>
  )
}