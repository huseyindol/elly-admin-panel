'use client'

import { BasicInfoSelector, TagsInput } from '@/app/(admin)/admin/_components'
import { useAdminTheme } from '@/app/(admin)/admin/_hooks'
import { createContentService } from '@/app/(admin)/admin/_services/contents.services'
import {
  generateDynamicFields,
  type DynamicField,
  type FieldConfigMap,
} from '@/app/(admin)/admin/_utils/zod-introspection'
import {
  dynamicSchemas,
  getContentTypes,
  type ContentType,
} from '@/schemas/dynamic'
import { ContentInput } from '@/types/content'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export default function NewContentPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()

  // Selected content type
  const [selectedContentType, setSelectedContentType] =
    useState<ContentType>('skills')

  // Basic Info Mode
  const [basicInfoMode, setBasicInfoMode] = useState<'create' | 'select'>(
    'create',
  )
  const [selectedBasicInfoId, setSelectedBasicInfoId] = useState<string>('')

  // Get content type options
  const contentTypes = getContentTypes()

  // Get schema and field config for selected type
  const selectedSchema = useMemo(() => {
    return dynamicSchemas[selectedContentType]
  }, [selectedContentType])

  // Generate dynamic fields from Zod schema
  const dynamicFields = useMemo(() => {
    if (!selectedSchema) return []
    return generateDynamicFields(
      selectedSchema.schema as z.ZodObject<z.ZodRawShape>,
      selectedSchema.fieldConfig as FieldConfigMap,
    )
  }, [selectedSchema])

  // Base form schema for content wrapper fields
  const baseSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    sectionKey: z.string().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).default(0),
  })

  // Form setup
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      title: '',
      description: '',
      sectionKey: selectedSchema?.sectionKey || '',
      isActive: true,
      sortOrder: 0,
    },
  })

  // Metadata values (dynamic fields)
  const [metadataValues, setMetadataValues] = useState<Record<string, unknown>>(
    {},
  )

  // Reset form when content type changes
  useEffect(() => {
    reset({
      title: '',
      description: '',
      sectionKey: selectedSchema?.sectionKey || '',
      isActive: true,
      sortOrder: 0,
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMetadataValues({})
  }, [selectedContentType, selectedSchema, reset])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ContentInput) => createContentService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] })
      toast.success('İçerik başarıyla oluşturuldu')
      router.push('/admin/contents')
    },
    onError: error => {
      console.error('Create error:', error)
      toast.error(error.message || 'İçerik oluşturulurken bir hata oluştu')
    },
  })

  const onSubmit = (data: z.infer<typeof baseSchema>) => {
    // Validate metadata with selected schema
    const metadataValidation = selectedSchema.schema.safeParse(metadataValues)
    if (!metadataValidation.success) {
      toast.error('Lütfen tüm alanları doğru şekilde doldurun')
      console.error('Metadata validation error:', metadataValidation.error)
      return
    }

    if (basicInfoMode === 'select' && !selectedBasicInfoId) {
      toast.error('Lütfen mevcut bir temel bilgi seçin')
      return
    }

    if (basicInfoMode === 'create') {
      if (!data.title?.trim()) {
        toast.error('Başlık alanı zorunludur')
        return
      }
      if (!data.sectionKey?.trim()) {
        toast.error('Section Key alanı zorunludur')
        return
      }
    }

    const contentData: ContentInput = {
      contentType: selectedContentType,
      metadata: metadataValidation.data,
    }

    if (basicInfoMode === 'select') {
      contentData.basicInfoId = selectedBasicInfoId
    } else {
      contentData.basicInfo = {
        title: data.title || '',
        description: data.description,
        sectionKey: data.sectionKey || '',
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      }
    }

    createMutation.mutate(contentData)
  }

  // Update metadata field value
  const updateMetadataField = (fieldId: string, value: unknown) => {
    setMetadataValues(prev => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  // Styling classes
  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500'
  }`

  const labelClass = `block text-sm font-medium mb-2 ${
    isDarkMode ? 'text-slate-300' : 'text-gray-700'
  }`

  const errorClass = 'mt-1 text-xs text-rose-400'

  const cardClass = `rounded-2xl p-6 ${
    isDarkMode
      ? 'border border-slate-800/50 bg-slate-900/60'
      : 'border border-gray-200 bg-white'
  } backdrop-blur-sm`

  // Render dynamic field based on type
  const renderDynamicField = (field: DynamicField) => {
    const value = metadataValues[field.id]

    switch (field.inputType) {
      case 'tags':
        return (
          <TagsInput
            value={(value as string[]) || []}
            onChange={tags => updateMetadataField(field.id, tags)}
            placeholder={field.placeholder}
            helpText={field.helpText}
          />
        )

      case 'textarea':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={e => updateMetadataField(field.id, e.target.value)}
            className={inputClass}
            rows={4}
            placeholder={field.placeholder}
          />
        )

      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={e => updateMetadataField(field.id, e.target.value)}
            className={inputClass}
          >
            <option value="">Seçiniz...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={(value as boolean) || false}
              onChange={e => updateMetadataField(field.id, e.target.checked)}
              className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
            />
            <span
              className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
            >
              {field.label}
            </span>
          </label>
        )

      case 'number':
        return (
          <input
            type="number"
            value={(value as number) ?? ''}
            onChange={e =>
              updateMetadataField(
                field.id,
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className={inputClass}
            placeholder={field.placeholder}
          />
        )

      case 'url':
      case 'email':
        return (
          <input
            type={field.inputType}
            value={(value as string) || ''}
            onChange={e => updateMetadataField(field.id, e.target.value)}
            className={inputClass}
            placeholder={field.placeholder}
          />
        )

      default:
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={e => updateMetadataField(field.id, e.target.value)}
            className={inputClass}
            placeholder={field.placeholder}
          />
        )
    }
  }

  function getTypeButtonClass(isActive: boolean) {
    if (isActive)
      return 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
    return isDarkMode
      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/contents"
          className={`transition-colors hover:text-violet-400 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          İçerikler
        </Link>
        <span className={isDarkMode ? 'text-slate-600' : 'text-gray-400'}>
          /
        </span>
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
          Yeni İçerik
        </span>
      </div>

      {/* Page Header */}
      <div>
        <h1
          className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Yeni İçerik Oluştur
        </h1>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          Dinamik CMS içeriği oluşturun
        </p>
      </div>

      {/* Content Type Selection */}
      <div className={cardClass}>
        <h2
          className={`mb-4 text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          İçerik Tipi
        </h2>

        <div className="flex flex-wrap gap-3">
          {contentTypes.map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => setSelectedContentType(type.value)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${getTypeButtonClass(selectedContentType === type.value)}`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <BasicInfoSelector
          mode={basicInfoMode}
          onModeChange={setBasicInfoMode}
          selectedBasicInfoId={selectedBasicInfoId}
          onSelectBasicInfo={setSelectedBasicInfoId}
        >
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
                placeholder="İçerik başlığı"
              />
              {errors.title && (
                <p className={errorClass}>{errors.title.message}</p>
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
                className={inputClass}
                rows={3}
                placeholder="İçerik açıklaması (opsiyonel)"
              />
            </div>

            {/* Section Key */}
            <div>
              <label htmlFor="sectionKey" className={labelClass}>
                Section Key *
              </label>
              <input
                id="sectionKey"
                type="text"
                {...register('sectionKey')}
                className={inputClass}
                placeholder="örn: portfolio_skills"
              />
              {errors.sectionKey && (
                <p className={errorClass}>{errors.sectionKey.message}</p>
              )}
            </div>

            {/* Sort Order */}
            <div>
              <label htmlFor="sortOrder" className={labelClass}>
                Sıra
              </label>
              <input
                id="sortOrder"
                type="number"
                {...register('sortOrder')}
                className={inputClass}
                placeholder="0"
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center gap-3">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                  />
                )}
              />
              <label
                htmlFor="isActive"
                className={`text-sm ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}
              >
                Aktif
              </label>
            </div>
          </div>
        </BasicInfoSelector>

        {/* Dynamic Fields */}
        <div className={cardClass}>
          <h2
            className={`mb-4 text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {selectedSchema?.label || 'İçerik'} Bilgileri
          </h2>

          <div className="space-y-4">
            {dynamicFields.map(field => (
              <div key={field.id}>
                {field.inputType !== 'checkbox' && (
                  <label htmlFor={field.id} className={labelClass}>
                    {field.label}
                    {field.required && (
                      <span className="ml-1 text-rose-400">*</span>
                    )}
                  </label>
                )}
                {renderDynamicField(field)}
                {field.helpText && field.inputType !== 'tags' && (
                  <p
                    className={`mt-1 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
                  >
                    {field.helpText}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/admin/contents"
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
            className="bg-linear-to-r flex-1 rounded-xl from-violet-500 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Kaydediliyor...</span>
              </span>
            ) : (
              'İçerik Oluştur'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
