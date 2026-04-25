'use client'

import {
  ImageUploadBox,
  initialResponsiveImages,
  type ResponsiveImages,
  type ResponsiveImageType,
} from '@/app/_components'
import { useAdminTheme } from '@/app/_hooks'
import {
  BannerImageFiles,
  createBannerService,
} from '@/app/_services/banners.services'
import { generateAltTextAction } from '@/actions/generate-field'
import AiFieldButton from '@/components/ui/AiFieldButton'
import { CreateBannerInput, CreateBannerSchema } from '@/schemas/banner.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

type ImageInputMode = 'upload' | 'url'

export default function NewBannerPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()

  // Image input mode: upload files or enter URLs
  const [imageInputMode, setImageInputMode] = useState<ImageInputMode>('upload')

  // Responsive images state - single object for all device types (for upload mode)
  const [images, setImages] = useState<ResponsiveImages>(
    initialResponsiveImages,
  )

  // URL inputs state (for url mode)
  const [imageUrls, setImageUrls] = useState({
    desktop: '',
    tablet: '',
    mobile: '',
  })

  const [imageError, setImageError] = useState<string | null>(null)
  const [altTextLoading, setAltTextLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateBannerInput>({
    resolver: zodResolver(CreateBannerSchema),
    defaultValues: {
      title: '',
      altText: '',
      link: '',
      target: '_blank',
      type: '',
      orderIndex: 0,
      status: true,
      subFolder: '',
    },
  })

  const title = watch('title')

  const handleAiAltText = async () => {
    if (!title) return
    setAltTextLoading(true)
    const res = await generateAltTextAction(title)
    if (res.success && res.altText) {
      setValue('altText', res.altText, { shouldDirty: true })
      toast.success('Alt metin oluşturuldu')
    } else {
      toast.error(res.error ?? 'Alt metin oluşturulamadı')
    }
    setAltTextLoading(false)
  }

  // Handle image change for specific device type
  const handleImageChange = (
    type: ResponsiveImageType,
    file: File,
    preview: string,
  ) => {
    setImageError(null)
    setImages(prev => ({
      ...prev,
      [type]: { file, preview, isExisting: false },
    }))
  }

  // Handle image clear for specific device type
  const handleImageClear = (type: ResponsiveImageType) => {
    setImages(prev => ({
      ...prev,
      [type]: { file: null, preview: null, isExisting: false },
    }))
  }

  // Handle URL input change
  const handleUrlChange = (type: ResponsiveImageType, url: string) => {
    setImageUrls(prev => ({
      ...prev,
      [type]: url,
    }))
  }

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateBannerInput) => {
      if (imageInputMode === 'upload') {
        if (!images.desktop.file) {
          throw new Error('Desktop görseli zorunludur')
        }
        const imageFiles: BannerImageFiles = {
          desktop: images.desktop.file,
          tablet: images.tablet.file,
          mobile: images.mobile.file,
        }
        return createBannerService(data, imageFiles)
      } else {
        // URL mode - send URLs in data.images
        if (!imageUrls.desktop) {
          throw new Error("Desktop görsel URL'si zorunludur")
        }
        const dataWithImages: CreateBannerInput = {
          ...data,
          images: {
            desktop: imageUrls.desktop || undefined,
            tablet: imageUrls.tablet || undefined,
            mobile: imageUrls.mobile || undefined,
          },
        }
        // No files to upload
        return createBannerService(dataWithImages, {})
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] })
      toast.success('Banner başarıyla oluşturuldu')
      router.push('/banners')
    },
    onError: error => {
      console.error('Create error:', error)
      toast.error(error.message || 'Banner oluşturulurken bir hata oluştu')
    },
  })

  const onSubmit = (data: CreateBannerInput) => {
    if (imageInputMode === 'upload' && !images.desktop.file) {
      setImageError('Desktop görseli zorunludur')
      return
    }
    if (imageInputMode === 'url' && !imageUrls.desktop) {
      setImageError("Desktop görsel URL'si zorunludur")
      return
    }
    createMutation.mutate(data)
  }

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500'
  }`

  const labelClass = `block text-sm font-medium mb-2 ${
    isDarkMode ? 'text-slate-300' : 'text-gray-700'
  }`

  const errorClass = 'mt-1 text-xs text-rose-400'

  function getModeButtonClass(isActive: boolean) {
    if (isActive) return 'bg-violet-500 text-white'
    return isDarkMode
      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/banners"
          className={`transition-colors hover:text-violet-400 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          Bannerlar
        </Link>
        <span className={isDarkMode ? 'text-slate-600' : 'text-gray-400'}>
          /
        </span>
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
          Yeni Banner
        </span>
      </div>

      {/* Page Header */}
      <div>
        <h1
          className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Yeni Banner Oluştur
        </h1>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          Yeni bir banner oluşturun
        </p>
      </div>

      {/* Error Message */}
      {createMutation.isError && (
        <div
          className={`rounded-xl p-4 ${
            isDarkMode
              ? 'bg-rose-500/20 text-rose-300'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          Hata:{' '}
          {createMutation.error?.message ||
            'Banner oluşturulurken bir hata oluştu'}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Responsive Image Upload */}
        <div
          className={`rounded-2xl p-6 ${
            isDarkMode
              ? 'border border-slate-800/50 bg-slate-900/60'
              : 'border border-gray-200 bg-white'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2
              className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Banner Görselleri
            </h2>

            {/* Mode Switch */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setImageInputMode('upload')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${getModeButtonClass(imageInputMode === 'upload')}`}
              >
                📤 Görsel Yükle
              </button>
              <button
                type="button"
                onClick={() => setImageInputMode('url')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${getModeButtonClass(imageInputMode === 'url')}`}
              >
                🔗 URL Gir
              </button>
            </div>
          </div>

          <p
            className={`mb-4 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            {imageInputMode === 'upload'
              ? 'Farklı cihazlar için responsive görseller yükleyin. Desktop görseli zorunludur.'
              : 'Görsellerin URL adreslerini girin. Desktop URL zorunludur.'}
          </p>

          {imageInputMode === 'upload' ? (
            <div className="flex gap-4">
              <ImageUploadBox
                label="Desktop"
                required
                imageState={images.desktop}
                onImageChange={(file, preview) =>
                  handleImageChange('desktop', file, preview)
                }
                onImageClear={() => handleImageClear('desktop')}
              />
              <ImageUploadBox
                label="Tablet"
                imageState={images.tablet}
                onImageChange={(file, preview) =>
                  handleImageChange('tablet', file, preview)
                }
                onImageClear={() => handleImageClear('tablet')}
              />
              <ImageUploadBox
                label="Mobile"
                imageState={images.mobile}
                onImageChange={(file, preview) =>
                  handleImageChange('mobile', file, preview)
                }
                onImageClear={() => handleImageClear('mobile')}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="desktopUrl" className={labelClass}>
                  Desktop URL *
                </label>
                <input
                  id="desktopUrl"
                  type="text"
                  value={imageUrls.desktop}
                  onChange={e => handleUrlChange('desktop', e.target.value)}
                  className={inputClass}
                  placeholder="https://example.com/desktop-banner.jpg"
                />
              </div>
              <div>
                <label htmlFor="tabletUrl" className={labelClass}>
                  Tablet URL
                </label>
                <input
                  id="tabletUrl"
                  type="text"
                  value={imageUrls.tablet}
                  onChange={e => handleUrlChange('tablet', e.target.value)}
                  className={inputClass}
                  placeholder="https://example.com/tablet-banner.jpg"
                />
              </div>
              <div>
                <label htmlFor="mobileUrl" className={labelClass}>
                  Mobile URL
                </label>
                <input
                  id="mobileUrl"
                  type="text"
                  value={imageUrls.mobile}
                  onChange={e => handleUrlChange('mobile', e.target.value)}
                  className={inputClass}
                  placeholder="https://example.com/mobile-banner.jpg"
                />
              </div>
            </div>
          )}

          {imageError && <p className={`mt-3 ${errorClass}`}>{imageError}</p>}
        </div>

        {/* Banner Info */}
        <div
          className={`rounded-2xl p-6 ${
            isDarkMode
              ? 'border border-slate-800/50 bg-slate-900/60'
              : 'border border-gray-200 bg-white'
          }`}
        >
          <h2
            className={`mb-4 text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Banner Bilgileri
          </h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className={labelClass}>
                Başlık *
              </label>
              <input
                id="title"
                type="text"
                {...register('title')}
                className={inputClass}
                placeholder="Banner başlığı"
              />
              {errors.title && (
                <p className={errorClass}>{errors.title.message}</p>
              )}
            </div>

            {/* Alt Text */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <label
                  htmlFor="altText"
                  className={labelClass}
                  style={{ marginBottom: 0 }}
                >
                  Alt Metin
                </label>
                <AiFieldButton
                  onClick={handleAiAltText}
                  isLoading={altTextLoading}
                  disabled={!title}
                  label="AI ile oluştur"
                />
              </div>
              <input
                id="altText"
                type="text"
                {...register('altText')}
                className={inputClass}
                placeholder="Görsel alt metni (SEO için önemli)"
              />
            </div>

            {/* SubFolder */}
            <div>
              <label htmlFor="subFolder" className={labelClass}>
                Alt Klasör
              </label>
              <input
                id="subFolder"
                type="text"
                {...register('subFolder')}
                className={inputClass}
                placeholder="örn: promo, hero, sidebar"
              />
            </div>

            {/* Link */}
            <div>
              <label htmlFor="link" className={labelClass}>
                Link
              </label>
              <input
                id="link"
                type="text"
                {...register('link')}
                className={inputClass}
                placeholder="https://example.com"
              />
              {errors.link && (
                <p className={errorClass}>{errors.link.message}</p>
              )}
            </div>

            {/* Target */}
            <div>
              <label htmlFor="target" className={labelClass}>
                Link Hedefi
              </label>
              <select
                id="target"
                {...register('target')}
                className={inputClass}
              >
                <option value="_blank">Yeni Sekmede Aç</option>
                <option value="_self">Aynı Sekmede Aç</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className={labelClass}>
                Tip
              </label>
              <input
                id="type"
                type="text"
                {...register('type')}
                className={inputClass}
                placeholder="örn: hero, sidebar, popup"
              />
            </div>

            {/* Order Index */}
            <div>
              <label htmlFor="orderIndex" className={labelClass}>
                Sıra
              </label>
              <input
                id="orderIndex"
                type="number"
                {...register('orderIndex', { valueAsNumber: true })}
                className={inputClass}
                placeholder="0"
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <input
                id="status"
                type="checkbox"
                {...register('status')}
                className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
              />
              <label
                htmlFor="status"
                className={`text-sm ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}
              >
                Aktif
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/banners"
            className={`flex-1 rounded-xl px-4 py-3 text-center text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Yükleniyor...</span>
              </span>
            ) : (
              'Banner Oluştur'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
