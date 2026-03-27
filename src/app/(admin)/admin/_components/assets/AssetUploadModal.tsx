'use client'

import { Modal } from '@/app/(admin)/admin/_components/Modal'
import { useAdminTheme } from '@/app/(admin)/admin/_hooks'
import {
  uploadAssetService,
  uploadMultiAssetsService,
} from '@/app/(admin)/admin/_services/assets.services'
import { useState } from 'react'
import { toast } from 'sonner'

interface AssetUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AssetUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: AssetUploadModalProps) {
  const { isDarkMode } = useAdminTheme()
  const [loading, setLoading] = useState(false)
  const [uploadType, setUploadType] = useState<'single' | 'multi'>('single')
  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [multiFiles, setMultiFiles] = useState<File[]>([])
  const [subFolder, setSubFolder] = useState('')

  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSingleFile(file)
    }
  }

  const handleMultiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMultiFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (uploadType === 'single') {
        if (!singleFile) {
          throw new Error('Lütfen bir dosya seçin.')
        }
        await uploadAssetService(singleFile, subFolder)
        toast.success('Dosya başarıyla yüklendi.')
        setSingleFile(null)
      } else {
        if (multiFiles.length === 0) {
          throw new Error('Lütfen en az bir dosya seçin.')
        }
        await uploadMultiAssetsService(multiFiles, subFolder)
        toast.success('Dosyalar başarıyla yüklendi.')
        setMultiFiles([])
      }
      setSubFolder('')
      onSuccess()
      onClose()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Yükleme sırasında bir hata oluştu.'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = `w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 ${
    isDarkMode
      ? 'border-slate-700 bg-slate-900 text-white focus:ring-violet-500'
      : 'border-gray-300 bg-white text-gray-900 focus:ring-violet-500'
  }`

  const labelClasses = `mb-2 block text-sm font-medium ${
    isDarkMode ? 'text-slate-300' : 'text-gray-700'
  }`

  const fileInputClasses = `block w-full text-sm ${
    isDarkMode ? 'text-slate-300' : 'text-gray-500'
  } file:mr-4 file:rounded-full file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100`

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Asset Yükle">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Upload Type Selection */}
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              checked={uploadType === 'single'}
              onChange={() => setUploadType('single')}
              className="h-4 w-4 text-violet-600"
            />
            <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
              Tek Dosya
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              checked={uploadType === 'multi'}
              onChange={() => setUploadType('multi')}
              className="h-4 w-4 text-violet-600"
            />
            <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
              Çoklu Dosya
            </span>
          </label>
        </div>

        {/* SubFolder Input */}
        <div>
          <label htmlFor="subFolder" className={labelClasses}>
            Alt Klasör (Opsiyonel)
          </label>
          <input
            id="subFolder"
            type="text"
            value={subFolder}
            onChange={e => setSubFolder(e.target.value)}
            placeholder="Örn: images/banners"
            className={inputClasses}
          />
        </div>

        {/* File Input */}
        <div>
          <label htmlFor="fileInput" className={labelClasses}>
            Dosya Seçimi
          </label>
          {uploadType === 'single' ? (
            <input
              id="fileInput"
              type="file"
              onChange={handleSingleFileChange}
              className={fileInputClasses}
            />
          ) : (
            <input
              id="fileInput"
              type="file"
              multiple
              onChange={handleMultiFileChange}
              className={fileInputClasses}
            />
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? 'Yükleniyor...' : 'Yükle'}
        </button>
      </form>
    </Modal>
  )
}
