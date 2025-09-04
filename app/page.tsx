import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-highlight-med rounded-lg p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text mb-4">
            BIN381 Data Analysis Dashboard
          </h1>
          <p className="text-xl text-muted mb-8">
            Welcome to your comprehensive data analysis and project management platform
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Task Management Card */}
            <Link 
              href="/task-management"
              className="block bg-surface hover:bg-overlay border border-highlight-med rounded-lg p-6 transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-4">📋</div>
                <h2 className="text-2xl font-semibold text-primary mb-2">
                  Task Management
                </h2>
                <p className="text-text">
                  Track progress, assign tasks to team members, and monitor milestones. 
                  Connected to live MongoDB for real-time collaboration.
                </p>
              </div>
            </Link>

            {/* Data Project Card */}
            <Link 
              href="/project"
              className="block bg-surface hover:bg-overlay border border-highlight-med rounded-lg p-6 transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-4">📊</div>
                <h2 className="text-2xl font-semibold text-success mb-2">
                  Data Analysis Project
                </h2>
                <p className="text-text">
                  Analyze large datasets, perform data cleaning, and create visualizations. 
                  Powered by PostgreSQL and advanced analytics tools.
                </p>
              </div>
            </Link>
          </div>

          <div className="mt-8 text-sm text-muted">
            <p className="text-subtle">Built with Next.js, Flask, and modern data analysis tools</p>
          </div>
        </div>
      </div>
    </div>
  )
}