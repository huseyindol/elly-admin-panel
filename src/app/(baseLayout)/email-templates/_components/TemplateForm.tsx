'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useAdminTheme } from '@/app/_hooks'
import {
  emailTemplateSchema,
  type EmailTemplateFormValues,
} from '@/schemas/emailTemplateSchema'
import { MonacoBodyEditor } from './MonacoBodyEditor'
import { PreviewPanel } from './PreviewPanel'

interface TemplateFormProps {
  defaultValues?: Partial<EmailTemplateFormValues>
  templateKey?: string
  isEdit?: boolean
  onSubmit: (values: EmailTemplateFormValues) => void
  isLoading?: boolean
  extraHeader?: React.ReactNode
}

export function TemplateForm({
  defaultValues,
  templateKey,
  isEdit = false,
  onSubmit,
  isLoading = false,
  extraHeader,
}: TemplateFormProps) {
  const { isDarkMode } = useAdminTheme()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmailTemplateFormValues>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      active: true,
      htmlBody: '',
      ...defaultValues,
    },
  })

  const htmlBody = watch('htmlBody')

  const inputClass = `w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 ${
    isDarkMode
      ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-600 focus:border-violet-500 focus:ring-violet-500/20'
      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-violet-500/20'
  }`

  const labelClass = `mb-1 block text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`
  const errorClass = 'mt-1 text-xs text-rose-500'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div />
        <div className="flex items-center gap-3">
          {extraHeader}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Kaydediliyor…
              </>
            ) : isEdit ? (
              'Güncelle'
            ) : (
              'Kaydet'
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Template Key */}
        <div>
          <label className={labelClass}>Template Key *</label>
          <input
            {...register('templateKey')}
            className={inputClass}
            placeholder="welcome-email"
            readOnly={isEdit}
            style={isEdit ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          />
          {errors.templateKey && (
            <p className={errorClass}>{errors.templateKey.message}</p>
          )}
          {!isEdit && (
            <p
              className={`mt-1 text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
            >
              Sadece küçük harf, rakam ve tire: <code>welcome-email</code>
            </p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label className={labelClass}>Konu *</label>
          <input
            {...register('subject')}
            className={inputClass}
            placeholder="Hoşgeldin, [[${userName}]]!"
          />
          {errors.subject && (
            <p className={errorClass}>{errors.subject.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className={labelClass}>Açıklama</label>
          <input
            {...register('description')}
            className={inputClass}
            placeholder="Bu template ne için kullanılır?"
          />
          {errors.description && (
            <p className={errorClass}>{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <input
          id="active"
          type="checkbox"
          {...register('active')}
          className="h-4 w-4 rounded border-gray-300 accent-violet-500"
        />
        <label
          htmlFor="active"
          className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
        >
          Aktif
        </label>
      </div>

      {/* HTML Body — Monaco */}
      <div>
        <label className={labelClass}>HTML Body *</label>
        <MonacoBodyEditor
          value={htmlBody}
          onChange={v => setValue('htmlBody', v, { shouldValidate: true })}
        />
        {errors.htmlBody && (
          <p className={errorClass}>{errors.htmlBody.message}</p>
        )}
      </div>

      {/* Preview */}
      <PreviewPanel templateKey={templateKey ?? null} />
    </form>
  )
}
