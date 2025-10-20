import type { Metadata } from 'next'
import './globals.css'
import Navbar from './components/navbar'

export const metadata: Metadata = {
  title: 'BIN381 Data Analysis Dashboard',
  description: 'Data analysis dashboard with task management and project tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-screen bg-base antialiased">
        <Navbar />
        <main className="mx-auto py-6">
          {children}
        </main>
      </body>
    </html>
  )
}