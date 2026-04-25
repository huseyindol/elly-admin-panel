'use client'

import {
  ImageUploadBox,
  type ResponsiveImages,
  type ResponsiveImageType,
} from '@/app/_components'
import { useAdminTheme } from '@/app/_hooks'
import {
  BannerImageFiles,
  getBannerByIdService,
  updateBannerService,
} from '@/app/_services/banners.services'
import { getImageUrl } from '@/app/_utils/urlUtils'
import { generateAltTextAction } from '@/actions/generate-field'
import AiFieldButton from '@/components/ui/AiFieldButton'
import { UpdateBannerInput, UpdateBannerSchema } from '@/schemas/banner.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

type ImageInputMode = 'upload' | 'url'

// Type for newly selected files
interface NewFilesState {
  desktop: { file: File; preview: string } | null
  tablet: { file: File; preview: string } | null
  mobile: { file: File; preview: string } | null
}

// Type for edited URLs (null means not edited, use original)
interface EditedUrlsState {
  desktop: string | null
  tablet: string | null
  mobile: string | null
}

// Helper function to get image state for a device type
function getImageState(
  type: 'desktop' | 'tablet' | 'mobile',
  newFiles: NewFilesState,
  bannerImages?: { desktop?: string; tablet?: string; mobile?: string },
) {
  if (newFiles[type]) {
    return {
      file: newFiles[type]!.file,
      preview: newFiles[type]!.preview,
      isExisting: false,
    }
  }
  if (bannerImages?.[type]) {
    return {
      file: null,
      preview: getImageUrl(bannerImages[type]!),
      isExisting: true,
    }
  }
  return { file: null, preview: null, isExisting: false }
}

// Helper function to get display URL for a device type
function getDisplayUrl(
  type: 'desktop' | 'tablet' | 'mobile',
  editedUrls: EditedUrlsState,
  bannerImages?: { desktop?: string; tablet?: string; mobile?: string },
): string {
  // If user edited this URL, use edited value
  const editedUrl = editedUrls[type]
  if (editedUrl !== null) {
    return editedUrl
  }
  // Otherwise use original from bannerData
  return bannerImages?.[type] ?? ''
}

export default function EditBannerPage() {
  const params = useParams()
  const bannerId = params.id as string
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()

  // Image input mode: upload files or enter URLs
  const [imageInputMode, setImageInputMode] = useState<ImageInputMode>('upload')

  // Only store newly selected files - existing images are derived from bannerData
  const [newFiles, setNewFiles] = useState<NewFilesState>({
    desktop: null,
    tablet: null,
    mobile: null,
  })

  // Only store user-edited URLs - original URLs come from bannerData
  // null means "not edited, use original"
  const [editedUrls, setEditedUrls] = useState<EditedUrlsState>({
    desktop: null,
    tablet: null,
    mobile: null,
  })

  const [imageError, setImageError] = useState<string | null>(null)
  const [altTextLoading, setAltTextLoading] = useState(false)

  // Fetch banner data
  const {
    data: bannerData,
    isLoading: isBannerLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['banner', bannerId],
    queryFn: () => getBannerByIdService(bannerId),
    enabled: !!bannerId,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateBannerInput>({
    resolver: zodResolver(UpdateBannerSchema),
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

  // Derive display images from bannerData and newFiles
  const displayImages: ResponsiveImages = useMemo(() => {
    const bannerImages = bannerData?.data?.images
    return {
      desktop: getImageState('desktop', newFiles, bannerImages),
      tablet: getImageState('tablet', newFiles, bannerImages),
      mobile: getImageState('mobile', newFiles, bannerImages),
    }
  }, [bannerData, newFiles])

  // Derive display URLs from bannerData and editedUrls
  const displayUrls = useMemo(() => {
    const bannerImages = bannerData?.data?.images
    return {
      desktop: getDisplayUrl('desktop', editedUrls, bannerImages),
      tablet: getDisplayUrl('tablet', editedUrls, bannerImages),
      mobile: getDisplayUrl('mobile', editedUrls, bannerImages),
    }
  }, [bannerData, editedUrls])

  // Populate form when data is loaded (no setState for images/urls needed!)
  useEffect(() => {
    if (bannerData?.data) {
      const banner = bannerData.data
      reset({
        title: banner.title,
        altText: banner.altText || '',
        link: banner.link || '',
        target: (banner.target as '_blank' | '_self') || '_blank',
        type: banner.type || '',
        orderIndex: banner.orderIndex,
        status: banner.status,
        subFolder: banner.subFolder || '',
      })
    }
  }, [bannerData, reset])

  // Handle image change for specific device type
  const handleImageChange = (
    type: ResponsiveImageType,
    file: File,
    preview: string,
  ) => {
    setImageError(null)
    setNewFiles(prev => ({
      ...prev,
      [type]: { file, preview },
    }))
  }

  // Handle image clear for specific device type
  const handleImageClear = (type: ResponsiveImageType) => {
    setNewFiles(prev => ({
      ...prev,
      [type]: null,
    }))
  }

  // Handle URL input change
  const handleUrlChange = (type: ResponsiveImageType, url: string) => {
    setEditedUrls(prev => ({
      ...prev,
      [type]: url,
    }))
  }

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateBannerInput) => {
      if (imageInputMode === 'upload') {
        const imageFiles: BannerImageFiles = {
          desktop: newFiles.desktop?.file ?? null,
          tablet: newFiles.tablet?.file ?? null,
          mobile: newFiles.mobile?.file ?? null,
        }
        return updateBannerService(bannerId, data, imageFiles)
      } else {
        // URL mode - send URLs in data.images
        const dataWithImages: UpdateBannerInput = {
          ...data,
          images: {
            desktop: displayUrls.desktop || undefined,
            tablet: displayUrls.tablet || undefined,
            mobile: displayUrls.mobile || undefined,
          },
        }
        return updateBannerService(bannerId, dataWithImages, {})
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] })
      queryClient.invalidateQueries({ queryKey: ['banner', bannerId] })
      toast.success('Banner başarıyla güncellendi')
    },
    onError: err => {
      console.error('Update error:', err)
      toast.error('Güncelleme sırasında bir hata oluştu')
    },
  })

  const onSubmit = (data: UpdateBannerInput) => {
    if (imageInputMode === 'upload') {
      const hasNewImages =
        newFiles.desktop?.file || newFiles.tablet?.file || newFiles.mobile?.file
      if (!isDirty && !hasNewImages) {
        toast.info('Herhangi bir değişiklik yapılmadı')
        return
      }
    } else {
      // URL mode - check if URLs changed
      const urlsChanged =
        editedUrls.desktop !== null ||
        editedUrls.tablet !== null ||
        editedUrls.mobile !== null
      if (!isDirty && !urlsChanged) {
        toast.info('Herhangi bir değişiklik yapılmadı')
        return
      }
    }
    updateMutation.mutate(data)
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

  // Loading state
  if (isBannerLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
            Banner yükleniyor...
          </span>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div
          className={`rounded-xl p-4 ${
            isDarkMode
              ? 'bg-rose-500/20 text-rose-300'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          Hata: {error?.message || 'Banner yüklenirken bir hata oluştu'}
        </div>
        <Link
          href="/banners"
          className={`inline-flex items-center gap-2 text-sm ${
            isDarkMode ? 'text-violet-400' : 'text-violet-600'
          }`}
        >
          ← Bannerlara Dön
        </Link>
      </div>
    )
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
          Düzenle: {bannerData?.data?.title}
        </span>
      </div>

      {/* Page Header */}
      <div>
        <h1
          className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Banner Düzenle
        </h1>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          Banner bilgilerini güncelleyin
        </p>
      </div>

      {/* Error Message */}
      {updateMutation.isError && (
        <div
          className={`rounded-xl p-4 ${
            isDarkMode
              ? 'bg-rose-500/20 text-rose-300'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          Hata:{' '}
          {updateMutation.error?.message ||
            'Banner güncellenirken bir hata oluştu'}
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
              ? 'Farklı cihazlar için responsive görseller yükleyin.'
              : 'Görsellerin URL adreslerini girin.'}
          </p>

          {imageInputMode === 'upload' ? (
            <div className="flex gap-4">
              <ImageUploadBox
                label="Desktop"
                imageState={displayImages.desktop}
                onImageChange={(file, preview) =>
                  handleImageChange('desktop', file, preview)
                }
                onImageClear={() => handleImageClear('desktop')}
              />
              <ImageUploadBox
                label="Tablet"
                imageState={displayImages.tablet}
                onImageChange={(file, preview) =>
                  handleImageChange('tablet', file, preview)
                }
                onImageClear={() => handleImageClear('tablet')}
              />
              <ImageUploadBox
                label="Mobile"
                imageState={displayImages.mobile}
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
                  Desktop URL
                </label>
                <input
                  id="desktopUrl"
                  type="text"
                  value={displayUrls.desktop}
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
                  value={displayUrls.tablet}
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
                  value={displayUrls.mobile}
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
                placeholder="Görsel alt metni"
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
            disabled={updateMutation.isPending}
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Kaydediliyor...</span>
              </span>
            ) : (
              'Değişiklikleri Kaydet'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
