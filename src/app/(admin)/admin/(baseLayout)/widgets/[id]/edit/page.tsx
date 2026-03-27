'use client'

import { DualListbox } from '@/app/(admin)/admin/_components'
import { useAdminTheme } from '@/app/(admin)/admin/_hooks'
import { useTemplates } from '@/app/(admin)/admin/_hooks/useTemplates'
import {
  getBannersSummaryBySubFolderService,
  getBannersSummaryService,
  getSubFoldersService,
} from '@/app/(admin)/admin/_services/banners.services'
import { getPostsSummaryService } from '@/app/(admin)/admin/_services/posts.services'
import {
  getWidgetByIdService,
  updateWidgetService,
} from '@/app/(admin)/admin/_services/widgets.services'
import { hasIdArrayChanges } from '@/app/(admin)/admin/_utils/arrayUtils'
import { UpdateWidgetInput, UpdateWidgetSchema } from '@/schemas/widget.schema'
import { BannerSummary, PostSummary } from '@/types/BaseResponse'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export default function EditWidgetPage() {
  const params = useParams()
  const widgetId = params.id as string
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()
  const [selectedBanners, setSelectedBanners] = useState<BannerSummary[]>([])
  const [selectedPosts, setSelectedPosts] = useState<PostSummary[]>([])
  const [initialBannerIds, setInitialBannerIds] = useState<number[]>([])
  const [initialPostIds, setInitialPostIds] = useState<number[]>([])
  const { templates: widgetTemplates } = useTemplates('widgets')

  // Selected sub-folder for banner filtering
  const [selectedSubFolder, setSelectedSubFolder] = useState<string>('all')

  // Fetch widget data
  const {
    data: widgetData,
    isLoading: isWidgetLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['widget', widgetId],
    queryFn: () => getWidgetByIdService(widgetId),
    enabled: !!widgetId,
  })

  // Fetch sub-folders for banner filtering
  const { data: subFoldersData } = useQuery({
    queryKey: ['banner-sub-folders'],
    queryFn: getSubFoldersService,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch ALL banners summary for initialization (to populate selected banners)
  const { data: allBannersData } = useQuery({
    queryKey: ['banners-summary-all'],
    queryFn: getBannersSummaryService,
  })

  // Fetch filtered banners summary based on selected sub-folder
  const { data: filteredBannersData, isLoading: isBannersLoading } = useQuery({
    queryKey: ['banners-summary', selectedSubFolder],
    queryFn: () => getBannersSummaryBySubFolderService(selectedSubFolder),
    staleTime: 5 * 60 * 1000,
  })

  // Available banners (filtered by sub-folder, excluding already selected ones)
  const availableBanners = useMemo(() => {
    const filteredBanners = filteredBannersData?.data ?? []
    const selectedIds = new Set(selectedBanners.map(b => b.id))
    return filteredBanners.filter(banner => !selectedIds.has(banner.id))
  }, [filteredBannersData, selectedBanners])

  // Sub-folder list
  const subFoldersList = subFoldersData?.data ?? []

  // Fetch posts summary
  const { data: postsData } = useQuery({
    queryKey: ['posts-summary'],
    queryFn: getPostsSummaryService,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateWidgetInput>({
    resolver: zodResolver(UpdateWidgetSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'BANNER',
      content: '',
      orderIndex: 0,
      status: true,
      template: '',
      bannerIds: [],
      postIds: [],
    },
  })

  // Watch type field for conditional rendering
  const selectedType = watch('type')

  // Populate form when data is loaded
  useEffect(() => {
    if (widgetData?.data) {
      const widget = widgetData.data
      reset({
        name: widget.name,
        description: widget.description || '',
        type: (widget.type as string).toUpperCase() as 'BANNER' | 'POST',
        content: widget.content || '',
        orderIndex: widget.orderIndex,
        status: widget.status,
        template: widget.template || '',
        bannerIds: [],
        postIds: [],
      })

      // Set selected banners from widget data using allBannersData
      if (widget.banners && allBannersData?.data) {
        const bannerIds = widget.banners.map(b => Number(b.id))
        setInitialBannerIds(bannerIds)
        const selectedBannerItems = allBannersData.data.filter(b =>
          bannerIds.includes(b.id),
        )
        setSelectedBanners(selectedBannerItems)
      }

      // Set selected posts from widget data
      if (widget.posts && postsData?.data) {
        const postIds = widget.posts.map(p => Number(p.id))
        setInitialPostIds(postIds)
        const selectedPostItems = postsData.data.filter(p =>
          postIds.includes(p.id),
        )
        setSelectedPosts(selectedPostItems)
      }
    }
  }, [widgetData, allBannersData, postsData, reset])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateWidgetInput) =>
      updateWidgetService(widgetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets'] })
      queryClient.invalidateQueries({ queryKey: ['widget', widgetId] })
      toast.success('Widget başarıyla güncellendi')
    },
    onError: error => {
      console.error('Update error:', error)
      toast.error('Güncelleme sırasında bir hata oluştu')
      toast.error(error.message)
    },
  })

  // Check if banner or post selections changed using utility
  const hasBannerChanges = () =>
    hasIdArrayChanges(selectedBanners, initialBannerIds)

  const hasPostChanges = () => hasIdArrayChanges(selectedPosts, initialPostIds)

  const onSubmit = (data: UpdateWidgetInput) => {
    const hasAssignmentChanges = hasBannerChanges() || hasPostChanges()

    if (!isDirty && !hasAssignmentChanges) {
      toast.info('Herhangi bir değişiklik yapılmadı')
      return
    }

    const submitData: UpdateWidgetInput = {
      ...data,
      bannerIds: data.type === 'BANNER' ? selectedBanners.map(b => b.id) : [],
      postIds: data.type === 'POST' ? selectedPosts.map(p => p.id) : [],
    }
    updateMutation.mutate(submitData)
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

  function getFilterButtonClass(isActive: boolean) {
    if (isActive)
      return 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
    return isDarkMode
      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
      : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }

  // Loading state
  if (isWidgetLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
            Widget yükleniyor...
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
          Hata: {error?.message || 'Widget yüklenirken bir hata oluştu'}
        </div>
        <Link
          href="/admin/widgets"
          className={`inline-flex items-center gap-2 text-sm ${
            isDarkMode ? 'text-violet-400' : 'text-violet-600'
          }`}
        >
          ← Widgetlara Dön
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/widgets"
          className={`transition-colors hover:text-violet-400 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          Widgetlar
        </Link>
        <span className={isDarkMode ? 'text-slate-600' : 'text-gray-400'}>
          /
        </span>
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
          Düzenle: {widgetData?.data?.name}
        </span>
      </div>

      {/* Page Header */}
      <div>
        <h1
          className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Widget Düzenle
        </h1>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          Widget bilgilerini güncelleyin
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
            'Widget güncellenirken bir hata oluştu'}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            Widget Bilgileri
          </h2>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className={labelClass}>
                İsim *
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className={inputClass}
                placeholder="Widget ismi"
              />
              {errors.name && (
                <p className={errorClass}>{errors.name.message}</p>
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
                placeholder="Widget açıklaması"
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
                {widgetTemplates
                  .filter(t => t.value !== '')
                  .map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className={labelClass}>
                Tip *
              </label>
              <select id="type" {...register('type')} className={inputClass}>
                <option value="BANNER">Banner</option>
                <option value="POST">Post</option>
              </select>
              {errors.type && (
                <p className={errorClass}>{errors.type.message}</p>
              )}
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

        {/* Banner Assignment - sadece BANNER tipi seçildiğinde göster */}
        {selectedType === 'BANNER' && (
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
              Banner Ataması
            </h2>

            {/* Sub-Folder Filter */}
            {subFoldersList.length > 0 && (
              <div className="mb-4">
                <p
                  className={`mb-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
                >
                  Alt klasöre göre filtrele:
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSubFolder('all')}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${getFilterButtonClass(selectedSubFolder === 'all')}`}
                  >
                    Tümü
                  </button>
                  {subFoldersList.map(folder => (
                    <button
                      key={folder}
                      type="button"
                      onClick={() => setSelectedSubFolder(folder)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${getFilterButtonClass(selectedSubFolder === folder)}`}
                    >
                      {folder}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isBannersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                <span
                  className={`ml-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
                >
                  Bannerlar yükleniyor...
                </span>
              </div>
            ) : (
              <DualListbox<BannerSummary>
                available={availableBanners}
                selected={selectedBanners}
                onChange={setSelectedBanners}
                getItemLabel={item => item.title}
                getItemSubLabel={item =>
                  `${item.subFolder || 'Genel'} • ${item.status ? 'Aktif' : 'Pasif'}`
                }
                emptyLeftText={
                  selectedSubFolder !== 'all'
                    ? `"${selectedSubFolder}" klasöründe banner bulunamadı`
                    : 'Banner bulunamadı'
                }
                emptyRightText="Banner seçilmedi"
              />
            )}
          </div>
        )}

        {/* Post Assignment - sadece POST tipi seçildiğinde göster */}
        {selectedType === 'POST' && (
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
              Post Ataması
            </h2>
            <DualListbox<PostSummary>
              available={postsData?.data || []}
              selected={selectedPosts}
              onChange={setSelectedPosts}
              getItemLabel={item => item.title}
              getItemSubLabel={item => `/${item.slug}`}
              emptyLeftText="Post bulunamadı"
              emptyRightText="Post seçilmedi"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/admin/widgets"
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
            className="bg-linear-to-r flex-1 rounded-xl from-violet-500 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
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
