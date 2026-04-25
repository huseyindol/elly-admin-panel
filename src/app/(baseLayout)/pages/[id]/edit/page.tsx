'use client'

import { DualListbox, Icons } from '@/app/_components'
import { useAdminTheme } from '@/app/_hooks'
import { useTemplates } from '@/app/_hooks/useTemplates'
import { getComponentsSummaryService } from '@/app/_services/components.services'
import {
  getPageBySlugService,
  updatePageService,
} from '@/app/_services/pages.services'
import { generateSlug } from '@/app/_utils/stringUtils'
import {
  generateDescriptionAction,
  generateSeoFieldsAction,
  generateSlugAction,
} from '@/actions/generate-field'
import AiFieldButton from '@/components/ui/AiFieldButton'
import { UpdatePageInput, UpdatePageSchema } from '@/schemas/page'
import { ComponentSummary, ComponentTypeEnum } from '@/types/BaseResponse'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

export default function EditPagePage() {
  const params = useParams()
  const pageId = params.id as string
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()
  const [showSeoSettings, setShowSeoSettings] = useState(false)
  const [slugLoading, setSlugLoading] = useState(false)
  const [seoLoading, setSeoLoading] = useState(false)
  const [descriptionLoading, setDescriptionLoading] = useState(false)
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
    control,
    getValues,
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

  const [selectedComponentIds, title] = useWatch({
    control,
    name: ['componentIds', 'title'],
  })

  const filteredPageTemplates = useMemo(
    () => pageTemplates.filter(t => t.value !== ''),
    [pageTemplates],
  )

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

  const handleAiSlug = async () => {
    if (!title) return
    setSlugLoading(true)
    const res = await generateSlugAction(title)
    if (res.success && res.slug) {
      setValue('slug', res.slug, { shouldDirty: true })
      toast.success('Slug oluşturuldu')
    } else {
      toast.error(res.error ?? 'Slug oluşturulamadı')
    }
    setSlugLoading(false)
  }

  const handleAiDescription = async () => {
    if (!title) return
    setDescriptionLoading(true)
    const res = await generateDescriptionAction(title, 'sayfa')
    if (res.success && res.description) {
      setValue('description', res.description, { shouldDirty: true })
      toast.success('Açıklama oluşturuldu')
    } else {
      toast.error(res.error ?? 'Açıklama oluşturulamadı')
    }
    setDescriptionLoading(false)
  }

  const handleAiSeo = async () => {
    if (!title) return
    setSeoLoading(true)
    if (!showSeoSettings) setShowSeoSettings(true)
    const res = await generateSeoFieldsAction(title)
    if (res.success && res.data) {
      setValue('seoInfo.title', res.data.seoTitle, { shouldDirty: true })
      setValue('seoInfo.description', res.data.seoDescription, {
        shouldDirty: true,
      })
      setValue('seoInfo.keywords', res.data.seoKeywords, { shouldDirty: true })
      const currentSlug = getValues('slug')
      if (currentSlug) {
        setValue('seoInfo.canonicalUrl', `/${currentSlug}`, {
          shouldDirty: true,
        })
      }
      toast.success('SEO alanları oluşturuldu')
    } else {
      toast.error(res.error ?? 'SEO alanları oluşturulamadı')
    }
    setSeoLoading(false)
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
          href="/pages"
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
          href="/pages"
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
              <div className="mb-2 flex items-center gap-2">
                <label
                  htmlFor="slug"
                  className={labelClass}
                  style={{ marginBottom: 0 }}
                >
                  Slug *
                </label>
                <AiFieldButton
                  onClick={handleAiSlug}
                  isLoading={slugLoading}
                  disabled={!title}
                  label="AI ile oluştur"
                />
              </div>
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
              <div className="mb-2 flex items-center gap-2">
                <label
                  htmlFor="description"
                  className={labelClass}
                  style={{ marginBottom: 0 }}
                >
                  Açıklama
                </label>
                <AiFieldButton
                  onClick={handleAiDescription}
                  isLoading={descriptionLoading}
                  disabled={!title}
                  label="AI ile oluştur"
                />
              </div>
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
                {filteredPageTemplates.map(t => (
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
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowSeoSettings(!showSeoSettings)}
              className="flex items-center gap-3"
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
            <AiFieldButton
              onClick={handleAiSeo}
              isLoading={seoLoading}
              disabled={!title}
              label="AI ile doldur"
            />
          </div>

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
            href="/pages"
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
