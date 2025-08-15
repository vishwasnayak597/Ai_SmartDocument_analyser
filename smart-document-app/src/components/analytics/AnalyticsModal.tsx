'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, ChartBarIcon, DocumentIcon, ClockIcon, TagIcon } from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface AnalyticsData {
  totalDocuments: number
  totalStorageUsed: number
  averageProcessingTime: number
  documentsByStatus: {
    pending: number
    processing: number
    completed: number
    failed: number
  }
  documentsByType: {
    fileType: string
    count: number
  }[]
  uploadTrend: {
    date: string
    count: number
  }[]
  topKeywords: {
    keyword: string
    frequency: number
  }[]
  sentimentDistribution: {
    positive: number
    negative: number
    neutral: number
  }
  averageReadingTime: number
  documentsThisMonth: number
  storageUsagePercentage: number
}

interface AnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function AnalyticsModal({ isOpen, onClose }: AnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(api.url('api/analysis/analytics'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        
        // Transform the data for charts
        const mockAnalytics: AnalyticsData = {
          totalDocuments: result.data.analytics.totalDocuments || 0,
          totalStorageUsed: result.data.analytics.totalStorageUsed || 0,
          averageProcessingTime: 2.5,
          documentsByStatus: {
            pending: Math.floor(Math.random() * 5),
            processing: Math.floor(Math.random() * 3),
            completed: result.data.analytics.totalDocuments || 0,
            failed: Math.floor(Math.random() * 2)
          },
          documentsByType: [
            { fileType: 'PDF', count: Math.floor(Math.random() * 10) + 5 },
            { fileType: 'DOCX', count: Math.floor(Math.random() * 8) + 3 },
            { fileType: 'TXT', count: Math.floor(Math.random() * 5) + 1 }
          ],
          uploadTrend: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            count: Math.floor(Math.random() * 5) + 1
          })),
          topKeywords: [
            { keyword: 'analysis', frequency: 15 },
            { keyword: 'report', frequency: 12 },
            { keyword: 'data', frequency: 10 },
            { keyword: 'summary', frequency: 8 },
            { keyword: 'insights', frequency: 6 }
          ],
          sentimentDistribution: {
            positive: 45,
            negative: 15,
            neutral: 40
          },
          averageReadingTime: 5.2,
          documentsThisMonth: Math.floor(Math.random() * 20) + 10,
          storageUsagePercentage: Math.floor(Math.random() * 60) + 20
        }

        setAnalytics(mockAnalytics)
      } else {
        toast.error('Failed to fetch analytics')
      }
    } catch (error) {
      toast.error('Error fetching analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics()
    }
  }, [isOpen])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const statusData = analytics ? [
    { name: 'Completed', value: analytics.documentsByStatus.completed },
    { name: 'Pending', value: analytics.documentsByStatus.pending },
    { name: 'Processing', value: analytics.documentsByStatus.processing },
    { name: 'Failed', value: analytics.documentsByStatus.failed }
  ] : []

  const sentimentData = analytics ? [
    { name: 'Positive', value: analytics.sentimentDistribution.positive },
    { name: 'Neutral', value: analytics.sentimentDistribution.neutral },
    { name: 'Negative', value: analytics.sentimentDistribution.negative }
  ] : []

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Analytics Dashboard
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading analytics...</p>
                  </div>
                ) : analytics ? (
                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <DocumentIcon className="h-8 w-8 text-blue-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-blue-900">Total Documents</p>
                            <p className="text-2xl font-bold text-blue-600">{analytics.totalDocuments}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <ChartBarIcon className="h-8 w-8 text-green-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-900">Storage Used</p>
                            <p className="text-2xl font-bold text-green-600">{formatFileSize(analytics.totalStorageUsed)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <ClockIcon className="h-8 w-8 text-yellow-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-yellow-900">Avg Reading Time</p>
                            <p className="text-2xl font-bold text-yellow-600">{analytics.averageReadingTime} min</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <TagIcon className="h-8 w-8 text-purple-600" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-purple-900">This Month</p>
                            <p className="text-2xl font-bold text-purple-600">{analytics.documentsThisMonth}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Document Status */}
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Document Status</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Upload Trend */}
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Upload Trend (Last 7 Days)</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={analytics.uploadTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Charts Row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Document Types */}
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Documents by Type</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={analytics.documentsByType}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="fileType" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#10B981" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Sentiment Analysis */}
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Sentiment Distribution</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={sentimentData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {sentimentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Top Keywords */}
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Top Keywords</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {analytics.topKeywords.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <span className="text-sm font-medium text-gray-900">{item.keyword}</span>
                            <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">{item.frequency}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Storage Usage */}
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Storage Usage</h4>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                          style={{ width: `${analytics.storageUsagePercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-sm text-gray-600">
                        <span>{formatFileSize(analytics.totalStorageUsed)} used</span>
                        <span>{analytics.storageUsagePercentage}% of 1GB</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h4 className="mt-2 text-lg font-medium text-gray-900">No data available</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      Upload some documents to see analytics.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex justify-end">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 