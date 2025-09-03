import Link from 'next/link'

export default function TaskManagementPage() {
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
          Task Management System
        </h1>
        <p className="text-gray-600 mb-6">
          Manage tasks, track progress, and collaborate with team members.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Task Board */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              📋 Task Board
            </h2>
            <p className="text-blue-700 text-sm mb-4">
              View and manage tasks across different milestones
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              View Tasks
            </button>
          </div>

          {/* Team Members */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              👥 Team Members
            </h2>
            <p className="text-green-700 text-sm mb-4">
              Manage team members and assignments
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
              View Members
            </button>
          </div>

          {/* Analytics */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-purple-900 mb-2">
              📊 Analytics
            </h2>
            <p className="text-purple-700 text-sm mb-4">
              Track progress and team performance
            </p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
              View Analytics
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            🚧 Under Development
          </h3>
          <p className="text-yellow-700 text-sm">
            The task management system is being migrated from the existing HTML/JS implementation 
            to modern React components. Features will be available soon!
          </p>
        </div>
      </div>
    </div>
  )
}