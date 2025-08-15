'use client'

import { Fragment, useState, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, DocumentIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess?: () => void
}

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}

export default function DocumentUploadModal({ isOpen, onClose, onUploadSuccess }: DocumentUploadModalProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setIsUploading(true)
    const newUploads: UploadProgress[] = acceptedFiles.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }))

    setUploads(newUploads)

    // Upload files one by one
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      await uploadFile(file, i)
    }

    setIsUploading(false)
  }, [])

  const uploadFile = async (file: File, index: number) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', file.name)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(api.url('api/documents/upload'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update progress to show processing
        setUploads(prev => prev.map((upload, i) => 
          i === index 
            ? { ...upload, progress: 50, status: 'processing' }
            : upload
        ))

        // Simulate processing time
        setTimeout(() => {
          setUploads(prev => prev.map((upload, i) => 
            i === index 
              ? { ...upload, progress: 100, status: 'completed' }
              : upload
          ))
        }, 1500)

        toast.success(`${file.name} uploaded successfully!`)
        onUploadSuccess?.()
      } else {
        const error = await response.json()
        setUploads(prev => prev.map((upload, i) => 
          i === index 
            ? { ...upload, status: 'error', error: error.message || 'Upload failed' }
            : upload
        ))
        toast.error(`Failed to upload ${file.name}`)
      }
    } catch (error) {
      setUploads(prev => prev.map((upload, i) => 
        i === index 
          ? { ...upload, status: 'error', error: 'Network error' }
          : upload
      ))
      toast.error(`Error uploading ${file.name}`)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: isUploading
  })

  const handleClose = () => {
    if (!isUploading) {
      setUploads([])
      onClose()
    }
  }

  const getStatusColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading': return 'text-blue-600'
      case 'processing': return 'text-yellow-600'
      case 'completed': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusText = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading...'
      case 'processing': return 'Processing...'
      case 'completed': return 'Completed'
      case 'error': return 'Error'
      default: return ''
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Upload Documents
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 disabled:opacity-50"
                    onClick={handleClose}
                    disabled={isUploading}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Upload Area */}
                <div
                  {...getRootProps()}
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                    ${isDragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : isUploading 
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <input {...getInputProps()} />
                  
                  {isDragActive ? (
                    <div className="text-blue-600">
                      <CloudArrowUpIcon className="mx-auto h-12 w-12 mb-4" />
                      <p className="text-lg font-medium">Drop files here...</p>
                    </div>
                  ) : (
                    <div className={isUploading ? 'text-gray-400' : 'text-gray-600'}>
                      <DocumentIcon className="mx-auto h-12 w-12 mb-4" />
                      <p className="text-lg font-medium mb-2">
                        {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-sm">
                        PDF, DOCX, TXT, or Images up to 50MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Progress */}
                {uploads.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Upload Progress</h4>
                    <div className="space-y-3">
                      {uploads.map((upload, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {upload.fileName}
                            </span>
                            <span className={`text-sm font-medium ${getStatusColor(upload.status)}`}>
                              {getStatusText(upload.status)}
                            </span>
                          </div>
                          
                          {upload.status !== 'error' && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  upload.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${upload.progress}%` }}
                              />
                            </div>
                          )}
                          
                          {upload.error && (
                            <p className="text-sm text-red-600 mt-1">{upload.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Close'}
                  </Button>
                  {uploads.some(u => u.status === 'completed') && (
                    <Button onClick={handleClose}>
                      Done
                    </Button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 