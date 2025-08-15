'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DocumentIcon, PlusIcon, ChartBarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import DocumentUploadModal from '@/components/documents/DocumentUploadModal'
import DocumentSearchModal from '@/components/documents/DocumentSearchModal'
import AnalyticsModal from '@/components/analytics/AnalyticsModal'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  subscription: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      try {
        const response = await fetch(api.url('api/auth/profile'), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const result = await response.json()
          setUser(result.data.user)
        } else {
          localStorage.removeItem('token')
          router.push('/')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('token')
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    toast.success('Logged out successfully')
    router.push('/')
  }

  const handleUploadClick = () => {
    setShowUploadModal(true)
  }

  const handleSearchClick = () => {
    setShowSearchModal(true)
  }

  const handleAnalyticsClick = () => {
    setShowAnalyticsModal(true)
  }

  const handleUploadSuccess = () => {
    // Optionally refresh documents list here
    toast.success('Documents uploaded successfully!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <DocumentIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-3 text-xl font-bold text-gray-900">SmartDocs</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.firstName}!
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage and analyze your documents with AI-powered insights.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={handleUploadClick}
              >
                <PlusIcon className="h-6 w-6" />
                <span>Upload Document</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={handleSearchClick}
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
                <span>Search Documents</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={handleAnalyticsClick}
              >
                <ChartBarIcon className="h-6 w-6" />
                <span>View Analytics</span>
              </Button>
            </div>
          </div>

          {/* Recent Documents */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Documents</h3>
              <div className="text-center py-12">
                <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h4 className="mt-2 text-lg font-medium text-gray-900">No documents yet</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Upload your first document to get started with AI-powered analysis.
                </p>
                <div className="mt-6">
                  <Button onClick={handleUploadClick}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Search Modal */}
      <DocumentSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      {/* Analytics Modal */}
      <AnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
      />
    </div>
  )
} 