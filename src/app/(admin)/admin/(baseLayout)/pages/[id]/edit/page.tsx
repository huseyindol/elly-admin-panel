'use client'

import { DualListbox, Icons } from '@/app/(admin)/admin/_components'
import { useAdminTheme } from '@/app/(admin)/admin/_hooks'
import { useTemplates } from '@/app/(admin)/admin/_hooks/useTemplates'
import { getComponentsSummaryService } from '@/app/(admin)/admin/_services/components.services'
import {
  getPageBySlugService,
  updatePageService,
} from '@/app/(admin)/admin/_services/pages.services'
import { generateSlug } from '@/app/(admin)/admin/_utils/stringUtils'
import { UpdatePageInput, UpdatePageSchema } from '@/schemas/page'
import { ComponentSummary, ComponentTypeEnum } from '@/types/BaseResponse'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export default function EditPagePage() {
  const params = useParams()
  const pageId = params.id as string
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()
  const [showSeoSettings, setShowSeoSettings] = useState(false)
  const { templates: pageTemplates } = useTemplates('pages')

  // Fetch page data
  const {
    data: pageData,
    isLoading: isPageLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['page', pageId],
    queryFn: () => getPageBySlugService(pageId),
    enabled: !!pageId,
  })

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdatePageInput>({
    resolver: zodResolver(UpdatePageSchema),
    defaultValues: {
      title: '',
      description: '',
      slug: '',
      status: true,
      template: '',
      seoInfo: {
        title: '',
        description: '',
        keywords: '',
        canonicalUrl: '',
        noIndex: false,
      },
      componentIds: [],
    },
  })

  // Watch component IDs for derived state
  const selectedComponentIds = watch('componentIds')

  // Fetch Components Summary
  const { data: componentsData } = useQuery({
    queryKey: ['components-summary'],
    queryFn: getComponentsSummaryService,
  })

  // Derive selected components from form IDs and data sources
  const selectedComponents = useMemo(() => {
    if (!selectedComponentIds || selectedComponentIds.length === 0) return []

    // Map IDs to component objects.
    // Prioritize objects from pageData (initial load) as they are definitely correct for the page
    // Then fallback to componentsData (available list)
    return selectedComponentIds.map(id => {
      const fromPage = pageData?.data?.components?.find(
        c => Number(c.id) === id,
      )
      if (fromPage) return fromPage as unknown as ComponentSummary

      const fromAvailable = componentsData?.data?.find(c => c.id === id)
      if (fromAvailable) return fromAvailable

      // Fallback placeholder if object not found (should not happen normally)
      return {
        id,
        name: 'Unknown Component',
        status: false,
        type: ComponentTypeEnum.WIDGET,
        orderIndex: 0,
      } as ComponentSummary
    })
  }, [selectedComponentIds, pageData, componentsData])

  const handleComponentChange = (selected: ComponentSummary[]) => {
    setValue(
      'componentIds',
      selected.map(c => c.id),
      { shouldDirty: true },
    )
  }

  // Populate form when data is loaded
  useEffect(() => {
    if (pageData?.data) {
      const page = pageData.data
      console.log('page', page)
      console.log('pageTemplates', pageTemplates)
      reset({
        title: page.title,
        description: page.description || '',
        slug: page.slug,
        status: page.status,
        template: page.template || '',
        seoInfo: page.seoInfo
          ? {
              title: page.seoInfo.title || '',
              description: page.seoInfo.description || '',
              keywords: page.seoInfo.keywords || '',
              canonicalUrl: page.seoInfo.canonicalUrl || '',
              noIndex: page.seoInfo.noIndex || false,
              noFollow: page.seoInfo.noFollow || false,
            }
          : undefined,
        componentIds: page.components?.map(c => Number(c.id)) || [],
      })
    }
  }, [pageData, reset])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdatePageInput) =>
      updatePageService(pageData?.data.id as string, data),
    onSuccess: () => {
      // Invalidate pages list and single page cache
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      queryClient.invalidateQueries({ queryKey: ['page', pageId] })
      toast.success('Sayfa başarıyla güncellendi')
    },
    onError: error => {
      console.error('Update error:', error)
      toast.error('Güncelleme sırasında bir hata oluştu')
    },
  })

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setValue('slug', generateSlug(newTitle))
  }

  const onSubmit = (data: UpdatePageInput) => {
    if (!isDirty) {
      toast.info('Herhangi bir değişiklik yapılmadı')
      return
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

  // Loading state
  if (isPageLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="border-3 h-8 w-8 animate-spin rounded-full border-violet-500 border-t-transparent" />
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
            Sayfa yükleniyor...
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
          Hata: {error?.message || 'Sayfa yüklenirken bir hata oluştu'}
        </div>
        <Link
          href="/admin/pages"
          className={`inline-flex items-center gap-2 text-sm ${
            isDarkMode ? 'text-violet-400' : 'text-violet-600'
          }`}
        >
          ← Sayfalara Dön
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/pages"
          className={`transition-colors hover:text-violet-400 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          Sayfalar
        </Link>
        <span className={isDarkMode ? 'text-slate-600' : 'text-gray-400'}>
          /
        </span>
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
          Düzenle: {pageData?.data?.title}
        </span>
      </div>

      {/* Page Header */}
      <div>
        <h1
          className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Sayfayı Düzenle
        </h1>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          Sayfa bilgilerini güncelleyin
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
            'Sayfa güncellenirken bir hata oluştu'}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Card */}
        <div
          className={`rounded-2xl p-6 ${
            isDarkMode
              ? 'border border-slate-800/50 bg-slate-900/60'
              : 'border border-gray-200 bg-white'
          } backdrop-blur-sm`}
        >
          <h2
            className={`mb-4 text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Temel Bilgiler
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
                {...register('title', {
                  onChange: handleTitleChange,
                })}
                className={inputClass}
                placeholder="Sayfa başlığı"
              />
              {errors.title && (
                <p className={errorClass}>{errors.title.message}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className={labelClass}>
                Slug *
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm ${
                    isDarkMode ? 'text-slate-500' : 'text-gray-400'
                  }`}
                >
                  /
                </span>
                <input
                  id="slug"
                  type="text"
                  {...register('slug')}
                  className={inputClass}
                  placeholder="sayfa-slug"
                />
              </div>
              {errors.slug && (
                <p className={errorClass}>{errors.slug.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className={labelClass}>
                Açıklama
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className={inputClass}
                placeholder="Sayfa açıklaması"
              />
            </div>

            {/* Template */}
            <div>
              <label htmlFor="template" className={labelClass}>
                Template
              </label>
              <select
                id="template"
                {...register('template')}
                className={inputClass}
              >
                <option value="">Template Seçin</option>
                {pageTemplates
                  .filter(t => t.value !== '')
                  .map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
              </select>
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
                Aktif (Yayında)
              </label>
            </div>
          </div>
        </div>

        {/* SEO Settings Card */}
        <div
          className={`rounded-2xl p-6 ${
            isDarkMode
              ? 'border border-slate-800/50 bg-slate-900/60'
              : 'border border-gray-200 bg-white'
          } backdrop-blur-sm`}
        >
          <button
            type="button"
            onClick={() => setShowSeoSettings(!showSeoSettings)}
            className="flex w-full items-center justify-between"
          >
            <h2
              className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              SEO Ayarları
            </h2>
            <span
              className={`transition-transform ${
                showSeoSettings ? 'rotate-180' : ''
              }`}
            >
              <Icons.ChevronRight />
            </span>
          </button>

          {showSeoSettings && (
            <div className="mt-4 space-y-4">
              {/* SEO Title */}
              <div>
                <label htmlFor="seoTitle" className={labelClass}>
                  SEO Başlığı
                </label>
                <input
                  id="seoTitle"
                  type="text"
                  {...register('seoInfo.title')}
                  className={inputClass}
                  placeholder="SEO için başlık"
                />
                {errors.seoInfo?.title && (
                  <p className={errorClass}>{errors.seoInfo.title.message}</p>
                )}
              </div>

              {/* SEO Description */}
              <div>
                <label htmlFor="seoDescription" className={labelClass}>
                  Meta Açıklama
                </label>
                <textarea
                  id="seoDescription"
                  {...register('seoInfo.description')}
                  rows={2}
                  className={inputClass}
                  placeholder="Arama motorları için açıklama"
                />
                {errors.seoInfo?.description && (
                  <p className={errorClass}>
                    {errors.seoInfo.description.message}
                  </p>
                )}
              </div>

              {/* Keywords */}
              <div>
                <label htmlFor="keywords" className={labelClass}>
                  Anahtar Kelimeler
                </label>
                <input
                  id="keywords"
                  type="text"
                  {...register('seoInfo.keywords')}
                  className={inputClass}
                  placeholder="kelime1, kelime2, kelime3"
                />
              </div>

              {/* Canonical URL */}
              <div>
                <label htmlFor="canonicalUrl" className={labelClass}>
                  Canonical URL
                </label>
                <input
                  id="canonicalUrl"
                  type="text"
                  {...register('seoInfo.canonicalUrl')}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>

              {/* NoIndex / NoFollow */}
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <input
                    id="noIndex"
                    type="checkbox"
                    {...register('seoInfo.noIndex')}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-violet-500"
                  />
                  <label
                    htmlFor="noIndex"
                    className={`text-sm ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-600'
                    }`}
                  >
                    noindex
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="noFollow"
                    type="checkbox"
                    {...register('seoInfo.noFollow')}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-violet-500"
                  />
                  <label
                    htmlFor="noFollow"
                    className={`text-sm ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-600'
                    }`}
                  >
                    nofollow
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Components Assignment */}
        <div
          className={`rounded-2xl p-6 ${
            isDarkMode
              ? 'border border-slate-800/50 bg-slate-900/60'
              : 'border border-gray-200 bg-white'
          } backdrop-blur-sm`}
        >
          <h2
            className={`mb-4 text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Bileşen (Component) Atama
          </h2>
          <DualListbox
            available={componentsData?.data || []}
            selected={selectedComponents}
            onChange={handleComponentChange}
            label="Sayfaya atanacak bileşenleri seçin"
            getItemLabel={item => item.name}
            getItemSubLabel={item => item.type}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/admin/pages"
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
