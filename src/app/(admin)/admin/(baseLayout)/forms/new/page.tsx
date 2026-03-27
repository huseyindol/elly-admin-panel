'use client'

import { Icons } from '@/app/(admin)/admin/_components'
import { StepManager } from '@/app/(admin)/admin/_components/forms'
import { useAdminTheme } from '@/app/(admin)/admin/_hooks'
import { createFormService } from '@/app/(admin)/admin/_services/forms.services'
import { CreateFormInput, CreateFormSchema } from '@/schemas/form.schema'
import type { Field, FieldOption, FieldType, Step } from '@/types/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Metin' },
  { value: 'email', label: 'E-posta' },
  { value: 'number', label: 'Sayı' },
  { value: 'textarea', label: 'Uzun Metin' },
  { value: 'select', label: 'Seçim Kutusu' },
  { value: 'radio', label: 'Radyo Buton' },
  { value: 'checkbox', label: 'Onay Kutusu' },
  { value: 'date', label: 'Tarih' },
  { value: 'phone', label: 'Telefon' },
  { value: 'url', label: 'URL' },
  { value: 'multi_checkbox', label: 'Çoklu Seçim (Checkbox Group)' },
]

/** Field types that require options */
/** Field types that require options */
const OPTION_FIELD_TYPES = new Set<FieldType>([
  'select',
  'radio',
  'multi_checkbox',
])

/**
 * Normalizes a field object to match the API schema.
 * Converts undefined to null for validation, condition, and options.
 */
function normalizeFieldForApi(field: Field): Field {
  const needsOptions = OPTION_FIELD_TYPES.has(field.type)
  return {
    id: field.id,
    type: field.type,
    label: field.label,
    required: field.required,
    options: needsOptions ? (field.options ?? null) : null,
    validation: field.validation ?? null,
    condition: field.condition ?? null,
    stepId: field.stepId || undefined,
  }
}

export default function NewFormPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()

  // Form fields state
  const [fields, setFields] = useState<Field[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [editingField, setEditingField] = useState<Field | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateFormInput>({
    resolver: zodResolver(CreateFormSchema),
    defaultValues: {
      title: '',
      version: 1,
      active: true,
      schema: {
        config: {
          layout: 'vertical',
          submitLabel: 'Gönder',
        },
        fields: [],
      },
    },
  })

  const layout = useWatch({ control, name: 'schema.config.layout' })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateFormInput) => createFormService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      toast.success('Form başarıyla oluşturuldu')
      router.push('/admin/forms')
    },
    onError: error => {
      console.error('Create error:', error)
      toast.error('Form oluşturulurken bir hata oluştu')
    },
  })

  const addField = () => {
    const newField: Field = {
      id: '',
      type: 'text',
      label: '',
      required: false,
      options: null,
      validation: null,
      condition: null,
    }
    setEditingField(newField)
    setShowFieldModal(true)
  }

  const saveField = (field: Field) => {
    if (editingField) {
      const normalized = normalizeFieldForApi(field)
      const existingIndex = fields.findIndex(f => f.id === editingField.id)
      if (existingIndex >= 0) {
        const updated = [...fields]
        updated[existingIndex] = normalized
        setFields(updated)
      } else {
        setFields([...fields, normalized])
      }
    }
    setShowFieldModal(false)
    setEditingField(null)
  }

  const removeField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId))
  }

  const onFormError = (formErrors: Record<string, unknown>) => {
    console.error('Form validation errors:', formErrors)
    toast.error('Form doğrulama hatası. Lütfen alanları kontrol edin.')
  }

  const onSubmit = (data: CreateFormInput) => {
    if (fields.length === 0) {
      toast.error('En az bir alan eklemelisiniz')
      return
    }

    if (layout === 'wizard') {
      const unassigned = fields.filter(f => !f.stepId)
      if (unassigned.length > 0) {
        toast.error(
          `Sihirbaz modunda tüm alanlar bir adıma atanmalı. Atanmamış alanlar: ${unassigned.map(f => f.label).join(', ')}`,
        )
        return
      }
      if (steps.length === 0) {
        toast.error('Sihirbaz modunda en az bir adım eklemelisiniz')
        return
      }
    }

    const normalizedFields = fields.map(normalizeFieldForApi)
    const formData: CreateFormInput = {
      ...data,
      schema: {
        ...data.schema,
        fields: normalizedFields,
        steps: layout === 'wizard' ? steps : undefined,
      },
    }

    console.log('Form data to send:', JSON.stringify(formData, null, 2))
    createMutation.mutate(formData)
  }

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500'
  }`

  const labelClass = `block text-sm font-medium mb-2 ${
    isDarkMode ? 'text-slate-300' : 'text-gray-700'
  }`

  const cardClass = `rounded-2xl p-6 ${
    isDarkMode
      ? 'border border-slate-800/50 bg-slate-900/60'
      : 'border border-gray-200 bg-white'
  } backdrop-blur-sm`

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/forms"
          className={`transition-colors hover:text-violet-400 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          Formlar
        </Link>
        <span className={isDarkMode ? 'text-slate-600' : 'text-gray-400'}>
          /
        </span>
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
          Yeni Form
        </span>
      </div>

      {/* Page Header */}
      <div>
        <h1
          className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Yeni Form Oluştur
        </h1>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          Dinamik form veya anket oluşturun
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit, onFormError)}
        className="space-y-6"
      >
        {/* Basic Info Card */}
        <div className={cardClass}>
          <h2
            className={`mb-4 text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Temel Bilgiler
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className={labelClass}>
                Form Başlığı *
              </label>
              <input
                id="title"
                type="text"
                {...register('title')}
                className={inputClass}
                placeholder="Form başlığı"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-rose-400">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="layout" className={labelClass}>
                  Düzen
                </label>
                <select
                  id="layout"
                  {...register('schema.config.layout')}
                  className={inputClass}
                >
                  <option value="vertical">Dikey (Tek Sayfa)</option>
                  <option value="single">Tek Sayfa</option>
                  <option value="wizard">Sihirbaz (Çok Adımlı)</option>
                </select>
              </div>

              <div className="flex items-end">
                <label
                  className={`flex cursor-pointer items-center gap-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
                >
                  <input
                    type="checkbox"
                    {...register('active')}
                    className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-violet-500"
                  />
                  <span className="text-sm">Aktif</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="submitLabel" className={labelClass}>
                Gönder Butonu Metni
              </label>
              <input
                id="submitLabel"
                type="text"
                {...register('schema.config.submitLabel')}
                className={inputClass}
                placeholder="Gönder"
              />
            </div>
          </div>
        </div>

        {/* Steps Management (Wizard Only) */}
        {layout === 'wizard' && (
          <div className={`${cardClass} relative z-10`}>
            <StepManager
              steps={steps}
              onChange={setSteps}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* Fields Section */}
        <div className={cardClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2
              className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Form Alanları
            </h2>
            <button
              type="button"
              onClick={addField}
              className="text-sm text-violet-400 hover:text-violet-300"
            >
              + Alan Ekle
            </button>
          </div>

          {fields.length === 0 ? (
            <div
              className={`py-8 text-center ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
            >
              <p className="text-sm">Henüz alan eklenmedi</p>
              <button
                type="button"
                onClick={addField}
                className="mt-2 text-sm text-violet-400 hover:text-violet-300"
              >
                İlk alanı ekle
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map(field => {
                const assignedStep = steps.find(s => s.id === field.stepId)
                return (
                  <div
                    key={field.id}
                    className={`flex items-center justify-between rounded-lg p-3 ${
                      isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          isDarkMode
                            ? 'bg-violet-500/20 text-violet-400'
                            : 'bg-violet-100 text-violet-600'
                        }`}
                      >
                        {FIELD_TYPES.find(t => t.value === field.type)?.label ||
                          field.type}
                      </span>
                      {assignedStep && (
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            isDarkMode
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {assignedStep.title}
                        </span>
                      )}
                      <span
                        className={`font-mono text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
                      >
                        {field.id}
                      </span>
                      <span
                        className={isDarkMode ? 'text-white' : 'text-gray-900'}
                      >
                        {field.label || 'Başlıksız Alan'}
                      </span>
                      {field.required && (
                        <span className="text-xs text-rose-400">*</span>
                      )}
                      {field.options && field.options.length > 0 && (
                        <span
                          className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
                        >
                          ({field.options.length} seçenek)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingField(field)
                          setShowFieldModal(true)
                        }}
                        className={`rounded p-1 transition-colors ${
                          isDarkMode
                            ? 'hover:bg-slate-700'
                            : 'hover:bg-gray-200'
                        }`}
                      >
                        <Icons.Edit />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeField(field.id)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/admin/forms"
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
              'Form Oluştur'
            )}
          </button>
        </div>
      </form>

      {/* Field Edit Modal */}
      {showFieldModal && editingField && (
        <FieldEditModal
          field={editingField}
          steps={layout === 'wizard' ? steps : undefined}
          existingFieldIds={fields
            .filter(f => f.id !== editingField.id)
            .map(f => f.id)}
          otherFields={fields.filter(f => f.id !== editingField.id)}
          onSave={saveField}
          onClose={() => {
            setShowFieldModal(false)
            setEditingField(null)
          }}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  )
}

// ====================================================
// Field Edit Modal Component
// ====================================================
interface FieldEditModalProps {
  field: Field
  steps?: Step[]
  existingFieldIds: string[]
  otherFields: Field[]
  onSave: (field: Field) => void
  onClose: () => void
  isDarkMode: boolean
}

function FieldEditModal({
  field,
  steps,
  existingFieldIds,
  otherFields,
  onSave,
  onClose,
  isDarkMode,
}: FieldEditModalProps) {
  const [editedField, setEditedField] = useState<Field>({
    ...field,
    options: field.options ?? null,
    validation: field.validation ?? null,
    condition: field.condition ?? null,
    stepId: field.stepId,
  })
  const [idError, setIdError] = useState<string | null>(null)

  const needsOptions = OPTION_FIELD_TYPES.has(editedField.type)

  const handleSave = () => {
    // Validate field ID
    if (!editedField.id.trim()) {
      setIdError('Alan ID zorunludur')
      return
    }
    if (!/^[a-zA-Z_]\w*$/.test(editedField.id)) {
      setIdError('ID sadece harf, rakam ve alt çizgi içerebilir')
      return
    }
    if (existingFieldIds.includes(editedField.id)) {
      setIdError('Bu ID zaten kullanılıyor')
      return
    }
    if (!editedField.label.trim()) {
      return
    }

    // Validate options for select/radio
    if (needsOptions) {
      const validOptions = (editedField.options || []).filter(
        o => o.label.trim() && o.value.trim(),
      )
      if (validOptions.length === 0) {
        toast.error(
          'Seçim kutusu ve radyo buton için en az bir seçenek gereklidir',
        )
        return
      }
    }

    // Clean up validation
    let validation = editedField.validation
    if (
      validation &&
      validation.min == null &&
      validation.max == null &&
      !validation.pattern
    ) {
      validation = null
    }

    // Clean up condition
    let condition = editedField.condition
    if (condition && !condition.field) {
      condition = null
    }

    // Clean up options — only keep for select/radio
    let options: FieldOption[] | null = null
    if (needsOptions && editedField.options) {
      options = editedField.options.filter(
        o => o.label.trim() && o.value.trim(),
      )
      if (options.length === 0) options = null
    }

    onSave({
      ...editedField,
      options,
      validation,
      condition,
    })
  }

  // Add a new option
  const addOption = () => {
    const currentOptions = editedField.options || []
    setEditedField({
      ...editedField,
      options: [...currentOptions, { label: '', value: '' }],
    })
  }

  // Update an option
  const updateOption = (index: number, key: 'label' | 'value', val: string) => {
    const updated = [...(editedField.options || [])]
    updated[index] = { ...updated[index], [key]: val }
    setEditedField({ ...editedField, options: updated })
  }

  // Remove an option
  const removeOption = (index: number) => {
    const updated = (editedField.options || []).filter((_, i) => i !== index)
    setEditedField({ ...editedField, options: updated })
  }

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500'
  }`

  const labelClass = `block text-sm font-medium mb-2 ${
    isDarkMode ? 'text-slate-300' : 'text-gray-700'
  }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg rounded-2xl p-6 ${
          isDarkMode
            ? 'border border-slate-700 bg-slate-900'
            : 'border border-gray-200 bg-white'
        }`}
      >
        <h3
          className={`mb-4 text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Alan Düzenle
        </h3>

        <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
          {/* Field ID */}
          <div>
            <label htmlFor="field-id-input" className={labelClass}>
              Alan ID *
            </label>
            <input
              id="field-id-input"
              type="text"
              value={editedField.id}
              onChange={e => {
                setEditedField({ ...editedField, id: e.target.value })
                setIdError(null)
              }}
              className={`${inputClass} font-mono`}
              placeholder="ornek: name, email, rating"
            />
            {idError && <p className="mt-1 text-xs text-rose-400">{idError}</p>}
            <p
              className={`mt-1 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
            >
              Form gönderiminde payload key olarak kullanılır
            </p>
          </div>

          {/* Step Selection (Wizard Only) */}
          {steps && steps.length > 0 && (
            <div>
              <label className={labelClass}>Adım</label>
              <select
                value={editedField.stepId || ''}
                onChange={e =>
                  setEditedField({ ...editedField, stepId: e.target.value })
                }
                className={inputClass}
              >
                <option value="">-- Adım Seçin --</option>
                {steps.map(step => (
                  <option key={step.id} value={step.id}>
                    {step.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Field Type */}
          <div>
            <label className={labelClass}>Alan Tipi *</label>
            <select
              value={editedField.type}
              onChange={e => {
                const newType = e.target.value as FieldType
                const wasOptionType = OPTION_FIELD_TYPES.has(editedField.type)
                const isOptionType = OPTION_FIELD_TYPES.has(newType)
                setEditedField({
                  ...editedField,
                  type: newType,
                  // Initialize options array when switching to option type
                  options: (() => {
                    if (isOptionType) return editedField.options || []
                    if (wasOptionType) return null
                    return editedField.options
                  })(),
                })
              }}
              className={inputClass}
            >
              {FIELD_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Label */}
          <div>
            <label htmlFor="field-label-input" className={labelClass}>
              Etiket *
            </label>
            <input
              id="field-label-input"
              type="text"
              value={editedField.label}
              onChange={e =>
                setEditedField({ ...editedField, label: e.target.value })
              }
              className={inputClass}
              placeholder="Beğeni Derecesi"
            />
          </div>

          {/* Required */}
          <div className="flex items-center gap-3">
            <input
              id="field-required-checkbox"
              type="checkbox"
              checked={editedField.required}
              onChange={e =>
                setEditedField({ ...editedField, required: e.target.checked })
              }
              className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-violet-500"
            />
            <label
              htmlFor="field-required-checkbox"
              className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
            >
              Zorunlu Alan
            </label>
          </div>

          {/* Options — for select & radio */}
          {needsOptions && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className={labelClass}>Seçenekler *</label>
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  + Seçenek Ekle
                </button>
              </div>

              {(!editedField.options || editedField.options.length === 0) && (
                <div
                  className={`rounded-lg border border-dashed p-4 text-center ${
                    isDarkMode
                      ? 'border-slate-700 text-slate-500'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  <p className="text-xs">Henüz seçenek eklenmedi</p>
                  <button
                    type="button"
                    onClick={addOption}
                    className="mt-1 text-xs text-violet-400 hover:text-violet-300"
                  >
                    İlk seçeneği ekle
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {(editedField.options || []).map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option.label}
                      onChange={e =>
                        updateOption(index, 'label', e.target.value)
                      }
                      className={`${inputClass} flex-1`}
                      placeholder="Etiket (Gösterim)"
                    />
                    <input
                      type="text"
                      value={option.value}
                      onChange={e =>
                        updateOption(index, 'value', e.target.value)
                      }
                      className={`${inputClass} flex-1 font-mono`}
                      placeholder="Değer (Kayıt)"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="shrink-0 text-rose-400 hover:text-rose-300"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                ))}
              </div>

              <p
                className={`mt-1 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
              >
                Etiket: kullanıcıya gösterilir. Değer: API&apos;ye gönderilir.
              </p>
            </div>
          )}

          {/* Validation — for text/number/textarea/email/phone/url */}
          {!['checkbox', 'select', 'radio'].includes(editedField.type) && (
            <div>
              <p className={labelClass}>Validasyon</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="validation-min-input"
                    className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
                  >
                    Min
                  </label>
                  <input
                    id="validation-min-input"
                    type="number"
                    value={editedField.validation?.min ?? ''}
                    onChange={e => {
                      const val = e.target.value ? Number(e.target.value) : null
                      setEditedField({
                        ...editedField,
                        validation: {
                          ...editedField.validation,
                          min: val,
                        },
                      })
                    }}
                    className={inputClass}
                    placeholder="Min"
                  />
                </div>
                <div>
                  <label
                    htmlFor="validation-max-input"
                    className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
                  >
                    Max
                  </label>
                  <input
                    id="validation-max-input"
                    type="number"
                    value={editedField.validation?.max ?? ''}
                    onChange={e => {
                      const val = e.target.value ? Number(e.target.value) : null
                      setEditedField({
                        ...editedField,
                        validation: {
                          ...editedField.validation,
                          max: val,
                        },
                      })
                    }}
                    className={inputClass}
                    placeholder="Max"
                  />
                </div>
              </div>
              <div className="mt-2">
                <label
                  htmlFor="validation-pattern-input"
                  className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
                >
                  Pattern (RegEx)
                </label>
                <input
                  id="validation-pattern-input"
                  type="text"
                  value={editedField.validation?.pattern ?? ''}
                  onChange={e => {
                    const val = e.target.value || null
                    setEditedField({
                      ...editedField,
                      validation: {
                        ...editedField.validation,
                        pattern: val,
                      },
                    })
                  }}
                  className={inputClass}
                  placeholder="^[a-zA-Z]+$"
                />
              </div>
            </div>
          )}

          {/* Condition */}
          <div>
            <p className={labelClass}>Koşullu Görünürlük</p>
            <div className="space-y-2">
              <select
                id="condition-field-select"
                value={editedField.condition?.field || ''}
                onChange={e => {
                  const fieldId = e.target.value
                  if (!fieldId) {
                    setEditedField({ ...editedField, condition: null })
                  } else {
                    setEditedField({
                      ...editedField,
                      condition: {
                        field: fieldId,
                        operator: editedField.condition?.operator || 'EQUALS',
                        value: editedField.condition?.value || '',
                      },
                    })
                  }
                }}
                className={inputClass}
              >
                <option value="">Koşul Yok</option>
                {otherFields.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.label || f.id}
                  </option>
                ))}
              </select>

              {editedField.condition && (
                <>
                  <select
                    id="condition-operator-select"
                    value={editedField.condition.operator}
                    onChange={e =>
                      setEditedField({
                        ...editedField,
                        condition: {
                          ...editedField.condition!,
                          operator: e.target
                            .value as import('@/types/form').ConditionOperator,
                        },
                      })
                    }
                    className={inputClass}
                  >
                    <option value="EQUALS">Eşit</option>
                    <option value="NOT_EQUALS">Eşit Değil</option>
                    <option value="GT">Büyük</option>
                    <option value="LT">Küçük</option>
                  </select>
                  <input
                    id="condition-value-input"
                    type="text"
                    value={String(editedField.condition.value)}
                    onChange={e =>
                      setEditedField({
                        ...editedField,
                        condition: {
                          ...editedField.condition!,
                          value: e.target.value,
                        },
                      })
                    }
                    className={inputClass}
                    placeholder="Değer"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-linear-to-r flex-1 rounded-xl from-violet-500 to-purple-600 px-4 py-3 text-sm font-medium text-white"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}
