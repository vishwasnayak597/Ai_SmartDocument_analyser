'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { MagnifyingGlassIcon, XMarkIcon, DocumentIcon, EyeIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Document {
  _id: string
  title: string
  originalFileName: string
  fileType: string
  fileSize: number
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  summary?: {
    short: string
  }
  keywords?: string[]
  sentiment?: {
    label: string
    score: number
  }
  createdAt: string
  readingTime: number
}

interface DocumentSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DocumentSearchModal({ isOpen, onClose }: DocumentSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  const searchDocuments = async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setDocuments([])
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(api.url(`api/documents/search?q=${encodeURIComponent(query)}&page=${page}&limit=10`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        setDocuments(result.data.documents)
        setPagination(result.data.pagination)
      } else {
        toast.error('Failed to search documents')
        setDocuments([])
      }
    } catch (error) {
      toast.error('Error searching documents')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchDocuments(searchQuery)
      } else {
        setDocuments([])
      }
    }, 300) // Debounce search

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleProcessDocument = async (documentId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(api.url(`api/analysis/process/${documentId}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success('Document processing started!')
        // Refresh search results
        searchDocuments(searchQuery, pagination.page)
      } else {
        toast.error('Failed to start processing')
      }
    } catch (error) {
      toast.error('Error processing document')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSentimentColor = (sentiment?: { label: string, score: number }) => {
    if (!sentiment) return 'text-gray-600'
    switch (sentiment.label) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Search Documents
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search documents by title, content, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Search Results */}
                <div className="max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Searching...</p>
                    </div>
                  ) : documents.length > 0 ? (
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <div key={doc._id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <DocumentIcon className="h-5 w-5 text-gray-400" />
                                <h4 className="text-lg font-medium text-gray-900">{doc.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.processingStatus)}`}>
                                  {doc.processingStatus}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                                <div>File: {doc.originalFileName}</div>
                                <div>Size: {formatFileSize(doc.fileSize)}</div>
                                <div>Type: {doc.fileType.toUpperCase()}</div>
                                <div>Reading: {doc.readingTime} min</div>
                              </div>

                              {doc.summary && (
                                <p className="text-sm text-gray-700 mb-2 line-clamp-2">{doc.summary.short}</p>
                              )}

                              {doc.keywords && doc.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {doc.keywords.slice(0, 5).map((keyword, index) => (
                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {doc.sentiment && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <span className="text-gray-600">Sentiment:</span>
                                  <span className={`font-medium ${getSentimentColor(doc.sentiment)}`}>
                                    {doc.sentiment.label} ({(doc.sentiment.score * 100).toFixed(0)}%)
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col space-y-2 ml-4">
                              <Button size="sm" variant="outline">
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {doc.processingStatus === 'pending' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleProcessDocument(doc._id)}
                                >
                                  <CloudArrowDownIcon className="h-4 w-4 mr-1" />
                                  Process
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <div className="text-center py-8">
                      <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h4 className="mt-2 text-lg font-medium text-gray-900">No documents found</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        Try searching with different keywords or check your spelling.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h4 className="mt-2 text-lg font-medium text-gray-900">Start searching</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        Enter keywords to search through your documents.
                      </p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {documents.length} of {pagination.total} results
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => searchDocuments(searchQuery, pagination.page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => searchDocuments(searchQuery, pagination.page + 1)}
                      >
                        Next
                      </Button>
                    </div>
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