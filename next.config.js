/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix the workspace root issue
  outputFileTracingRoot: __dirname,
  
  async rewrites() {
    return [
      // Proxy API requests to Flask servers
      {
        source: '/api/task/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
      {
        source: '/api/project/:path*',
        destination: 'http://localhost:5001/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig