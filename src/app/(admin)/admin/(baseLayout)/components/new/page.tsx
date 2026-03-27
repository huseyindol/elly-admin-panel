'use client'

import { DualListbox, Icons } from '@/app/(admin)/admin/_components'
import { useAdminTheme } from '@/app/(admin)/admin/_hooks'
import { useTemplates } from '@/app/(admin)/admin/_hooks/useTemplates'
import {
  getBannersSummaryBySubFolderService,
  getSubFoldersService,
} from '@/app/(admin)/admin/_services/banners.services'
import { createComponentService } from '@/app/(admin)/admin/_services/components.services'
import { getFormsSummaryService } from '@/app/(admin)/admin/_services/forms.services'
import { getWidgetsSummaryService } from '@/app/(admin)/admin/_services/widgets.services'
import {
  CreateComponentInput,
  CreateComponentSchema,
} from '@/schemas/component'
import { BannerSummary, WidgetSummary } from '@/types/BaseResponse'
import { FormSchema } from '@/types/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export default function NewComponentPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedBanners, setSelectedBanners] = useState<BannerSummary[]>([])
  const [selectedWidgets, setSelectedWidgets] = useState<WidgetSummary[]>([])
  const [selectedForms, setSelectedForms] = useState<FormSchema[]>([])
  const { templates: componentTemplates } = useTemplates('components')

  // Selected sub-folder for banner filtering
  const [selectedSubFolder, setSelectedSubFolder] = useState<string>('all')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateComponentInput>({
    resolver: zodResolver(CreateComponentSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'BANNER',
      content: '',
      orderIndex: 0,
      status: true,
      template: '',
      pageIds: [],
      bannerIds: [],
      widgetIds: [],
      formIds: [],
    },
  })

  // Watch type field for conditional rendering
  const selectedType = watch('type')

  // Fetch sub-folders for banner filtering
  const { data: subFoldersData } = useQuery({
    queryKey: ['banner-sub-folders'],
    queryFn: getSubFoldersService,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch banners summary based on selected sub-folder
  const { data: bannersData, isLoading: isBannersLoading } = useQuery({
    queryKey: ['banners-summary', selectedSubFolder],
    queryFn: () => getBannersSummaryBySubFolderService(selectedSubFolder),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch widgets summary
  const { data: widgetsData } = useQuery({
    queryKey: ['widgets-summary'],
    queryFn: getWidgetsSummaryService,
  })

  // Fetch forms for assignment
  const { data: formsData } = useQuery({
    queryKey: ['forms-summary'],
    queryFn: getFormsSummaryService,
  })

  // Available banners (exclude already selected ones)
  const availableBanners = useMemo(() => {
    const allBanners = bannersData?.data ?? []
    const selectedIds = new Set(selectedBanners.map(b => b.id))
    return allBanners.filter(banner => !selectedIds.has(banner.id))
  }, [bannersData, selectedBanners])

  // Sub-folder list
  const subFoldersList = subFoldersData?.data ?? []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateComponentInput) => createComponentService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] })
      toast.success('Component başarıyla oluşturuldu')
      router.push('/admin/components')
    },
    onError: error => {
      console.error('Create error:', error)
      toast.error('Component oluşturulurken bir hata oluştu')
      toast.error(error.message)
    },
  })

  const onSubmit = (data: CreateComponentInput) => {
    const submitData: CreateComponentInput = {
      ...data,
      bannerIds: data.type === 'BANNER' ? selectedBanners.map(b => b.id) : [],
      widgetIds: data.type === 'WIDGET' ? selectedWidgets.map(w => w.id) : [],
      formIds: data.type === 'FORM' ? selectedForms.map(f => f.id) : [],
    }
    createMutation.mutate(submitData)
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

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/components"
          className={`transition-colors hover:text-violet-400 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          Componentler
        </Link>
        <span className={isDarkMode ? 'text-slate-600' : 'text-gray-400'}>
          /
        </span>
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
          Yeni Component
        </span>
      </div>

      {/* Page Header */}
      <div>
        <h1
          className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Yeni Component Oluştur
        </h1>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          Sayfa için yeni bir component oluşturun
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
            'Component oluşturulurken bir hata oluştu'}
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
            Component Bilgileri
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
                placeholder="Component ismi"
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
                placeholder="Component açıklaması"
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
                {componentTemplates
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
                <option value="WIDGET">Widget</option>
                <option value="FORM">Form</option>
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

        {/* Widget Assignment - sadece WIDGET tipi seçildiğinde göster */}
        {selectedType === 'WIDGET' && (
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
              Widget Ataması
            </h2>
            <DualListbox<WidgetSummary>
              available={widgetsData?.data || []}
              selected={selectedWidgets}
              onChange={setSelectedWidgets}
              getItemLabel={item => item.name}
              getItemSubLabel={item => item.type}
              emptyLeftText="Widget bulunamadı"
              emptyRightText="Widget seçilmedi"
            />
          </div>
        )}

        {/* Form Assignment - sadece FORM tipi seçildiğinde göster */}
        {selectedType === 'FORM' && (
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
              Form Ataması
            </h2>
            <DualListbox<FormSchema>
              available={(formsData?.data || []).filter(
                f => !selectedForms.some(sf => sf.id === f.id),
              )}
              selected={selectedForms}
              onChange={setSelectedForms}
              getItemLabel={item => item.title}
              getItemSubLabel={item =>
                `v${item.version} • ${item.active ? 'Aktif' : 'Pasif'}`
              }
              emptyLeftText="Form bulunamadı"
              emptyRightText="Form seçilmedi"
            />
          </div>
        )}

        {/* Advanced Settings */}
        <div
          className={`rounded-2xl p-6 ${
            isDarkMode
              ? 'border border-slate-800/50 bg-slate-900/60'
              : 'border border-gray-200 bg-white'
          } backdrop-blur-sm`}
        >
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between"
          >
            <h2
              className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Gelişmiş Ayarlar
            </h2>
            <span
              className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            >
              <Icons.ChevronRight />
            </span>
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              {/* Content */}
              <div>
                <label htmlFor="content" className={labelClass}>
                  İçerik
                </label>
                <textarea
                  id="content"
                  {...register('content')}
                  rows={4}
                  className={inputClass}
                  placeholder="HTML veya JSON içerik"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/admin/components"
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
                <span>Kaydediliyor...</span>
              </span>
            ) : (
              'Component Oluştur'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
