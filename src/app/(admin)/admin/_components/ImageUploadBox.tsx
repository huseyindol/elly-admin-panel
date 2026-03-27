'use client'

import { useAdminTheme } from '@/app/(admin)/admin/_hooks'
import Image from 'next/image'
import { useRef } from 'react'
import { Icons } from './Icons'

export interface ImageState {
  file: File | null
  preview: string | null
  isExisting?: boolean
}

export type ResponsiveImageType = 'desktop' | 'tablet' | 'mobile'

export interface ResponsiveImages {
  desktop: ImageState
  tablet: ImageState
  mobile: ImageState
}

export const initialImageState: ImageState = {
  file: null,
  preview: null,
  isExisting: false,
}

export const initialResponsiveImages: ResponsiveImages = {
  desktop: { ...initialImageState },
  tablet: { ...initialImageState },
  mobile: { ...initialImageState },
}

interface ImageUploadBoxProps {
  label: string
  required?: boolean
  imageState: ImageState
  onImageChange: (file: File, preview: string) => void
  onImageClear: () => void
}

export function ImageUploadBox({
  label,
  required,
  imageState,
  onImageChange,
  onImageClear,
}: ImageUploadBoxProps) {
  const { isDarkMode } = useAdminTheme()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        onImageChange(file, reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClear = () => {
    onImageClear()
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="flex-1">
      <p
        className={`mb-2 text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
      >
        {label} {required && '*'}
      </p>
      {imageState.preview ? (
        <div className="relative">
          <div className="relative h-32 w-full overflow-hidden rounded-xl">
            <Image
              src={imageState.preview}
              alt={`${label} Preview`}
              fill
              className="object-cover"
            />
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-2 rounded-full bg-rose-500 p-1 text-white hover:bg-rose-600"
          >
            <Icons.X />
          </button>
          {imageState.isExisting !== undefined && (
            <p
              className={`mt-1 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
            >
              {imageState.isExisting ? 'Mevcut görsel' : 'Yeni görsel seçildi'}
            </p>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label={`${label} yüklemek için tıklayın`}
          className={`flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
            isDarkMode
              ? 'border-slate-700 hover:border-violet-500'
              : 'border-gray-300 hover:border-violet-500'
          }`}
        >
          <span className="text-2xl">📸</span>
          <p
            className={`mt-1 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
          >
            {label}
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {imageState.preview && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`mt-2 text-xs ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}
        >
          Görseli Değiştir
        </button>
      )}
    </div>
  )
}
