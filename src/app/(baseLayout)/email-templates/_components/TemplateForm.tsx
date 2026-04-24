'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useController, useForm } from 'react-hook-form'
import { useAdminTheme } from '@/app/_hooks'
import {
  type EmailTemplateFormValues,
  type EmailTemplateUpdateValues,
  emailTemplateSchema,
  emailTemplateUpdateSchema,
} from '@/schemas/emailTemplateSchema'
import { MonacoBodyEditor } from './MonacoBodyEditor'

// ---- Create mode ----

interface CreateTemplateFormProps {
  mode: 'create'
  onSubmit: (values: EmailTemplateFormValues) => void
  isLoading?: boolean
}

// ---- Update mode ----

interface UpdateTemplateFormProps {
  mode: 'update'
  defaultValues: EmailTemplateUpdateValues & { templateKey: string }
  onSubmit: (values: EmailTemplateUpdateValues) => void
  isLoading?: boolean
}

type TemplateFormProps = CreateTemplateFormProps | UpdateTemplateFormProps

export function TemplateForm(props: TemplateFormProps) {
  const { isDarkMode } = useAdminTheme()
  const isUpdate = props.mode === 'update'

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EmailTemplateFormValues | EmailTemplateUpdateValues>({
    resolver: zodResolver(
      isUpdate ? emailTemplateUpdateSchema : emailTemplateSchema,
    ),
    defaultValues: isUpdate
      ? (props as UpdateTemplateFormProps).defaultValues
      : { active: true, htmlBody: '' },
  })

  const { field: htmlBodyField } = useController({ name: 'htmlBody', control })

  const inputClass = `w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
    isDarkMode
      ? 'border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-500'
      : 'border-gray-300 bg-white text-gray-800 placeholder:text-gray-400'
  }`

  const labelClass = `block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`
  const errorClass = 'mt-1 text-xs text-rose-500'

  return (
    <form
      onSubmit={handleSubmit(props.onSubmit as never)}
      className="space-y-6"
    >
      {/* templateKey — sadece create modunda */}
      {!isUpdate && (
        <div>
          <label className={labelClass}>
            Template Key <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('templateKey' as never)}
            placeholder="ornek-template-key"
            className={`${inputClass} font-mono`}
          />
          <p
            className={`mt-1 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
          >
            Sadece küçük harf, rakam ve tire. Oluşturulduktan sonra
            değiştirilemez.
          </p>
          {'templateKey' in errors && errors.templateKey && (
            <p className={errorClass}>{errors.templateKey.message as string}</p>
          )}
        </div>
      )}

      {/* subject */}
      <div>
        <label className={labelClass}>
          Konu <span className="text-rose-500">*</span>
        </label>
        <input
          {...register('subject')}
          placeholder="Thymeleaf değişkenleri kullanabilirsiniz: [[${userName}]]"
          className={inputClass}
        />
        {errors.subject && (
          <p className={errorClass}>{errors.subject.message as string}</p>
        )}
      </div>

      {/* description */}
      <div>
        <label className={labelClass}>Açıklama</label>
        <textarea
          {...register('description')}
          rows={2}
          placeholder="Bu template ne için kullanılıyor?"
          className={inputClass}
        />
        {errors.description && (
          <p className={errorClass}>{errors.description.message as string}</p>
        )}
      </div>

      {/* active */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="active"
          {...register('active')}
          className="h-4 w-4 rounded border-gray-300 accent-violet-500"
        />
        <label htmlFor="active" className={labelClass + ' mb-0 cursor-pointer'}>
          Aktif
        </label>
      </div>

      {/* htmlBody — Monaco editor */}
      <div>
        <label className={labelClass}>
          HTML Body <span className="text-rose-500">*</span>
        </label>
        <MonacoBodyEditor
          value={htmlBodyField.value as string}
          onChange={htmlBodyField.onChange}
        />
        {errors.htmlBody && (
          <p className={errorClass}>{errors.htmlBody.message as string}</p>
        )}
      </div>

      {/* hidden optimisticLockVersion in update mode */}
      {isUpdate && (
        <input type="hidden" {...register('optimisticLockVersion' as never)} />
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={props.isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-60"
        >
          {props.isLoading ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>
    </form>
  )
}
