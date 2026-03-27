'use client'

import { useAdminTheme } from '@/app/(admin)/admin/_hooks'
import { isFieldVisible } from '@/app/(admin)/admin/_utils/condition-evaluator'
import type { Field } from '@/types/form'
import { Controller, UseFormReturn, useWatch } from 'react-hook-form'

interface FieldRendererProps {
  field: Field
  form: UseFormReturn<Record<string, unknown>>
  className?: string
}

/**
 * FieldRenderer - Renders a form field based on its type definition.
 * Supports conditional visibility via condition rules.
 */
export function FieldRenderer({ field, form, className }: FieldRendererProps) {
  const { isDarkMode } = useAdminTheme()
  const {
    register,
    control,
    formState: { errors },
  } = form

  // Watch all form values to evaluate conditions
  const formValues = useWatch({ control }) as Record<string, unknown>

  // Conditional visibility check
  if (field.condition) {
    const isVisible = isFieldVisible(field, formValues)
    if (!isVisible) {
      return null
    }
  }

  // Styling
  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500'
  }`

  const labelClass = `block text-sm font-medium mb-2 ${
    isDarkMode ? 'text-slate-300' : 'text-gray-700'
  }`

  const errorClass = 'mt-1 text-xs text-rose-400'

  const error = errors[field.id]
  const errorMessage = error?.message as string | undefined

  // Field rendering by type
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <input
            id={field.id}
            type={field.type === 'phone' ? 'tel' : field.type}
            {...register(field.id)}
            className={inputClass}
          />
        )

      case 'number':
        return (
          <input
            id={field.id}
            type="number"
            {...register(field.id, { valueAsNumber: true })}
            className={inputClass}
            min={field.validation?.min ?? undefined}
            max={field.validation?.max ?? undefined}
          />
        )

      case 'textarea':
        return (
          <textarea
            id={field.id}
            {...register(field.id)}
            className={inputClass}
            rows={4}
          />
        )

      case 'date':
        return (
          <input
            id={field.id}
            type="date"
            {...register(field.id)}
            className={inputClass}
          />
        )

      case 'select':
        return (
          <select id={field.id} {...register(field.id)} className={inputClass}>
            <option value="">Seçiniz...</option>
            {(field.options || []).map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {(field.options || []).length > 0 ? (
              field.options!.map(opt => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-3 ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    {...register(field.id)}
                    className="h-4 w-4 border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))
            ) : (
              <span
                className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
              >
                Seçenek tanımlı değil
              </span>
            )}
          </div>
        )

      case 'multi_checkbox':
        return (
          <div className={className}>
            {(field.options || []).length > 0 ? (
              <div className="space-y-2">
                {field.options!.map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
                  >
                    <input
                      type="checkbox"
                      disabled
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-violet-500"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-sm text-red-500">Seçenek ekleyiniz</div>
            )}
            {errorMessage && <p className={errorClass}>{errorMessage}</p>}
          </div>
        )

      case 'checkbox':
        return (
          <div className={className}>
            <Controller
              control={control}
              name={field.id}
              render={({ field: controllerField }) => (
                <label
                  className={`flex cursor-pointer items-center gap-3 ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!controllerField.value}
                    onChange={controllerField.onChange}
                    onBlur={controllerField.onBlur}
                    name={controllerField.name}
                    ref={controllerField.ref}
                    className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                  />
                  <span className="text-sm">{field.label}</span>
                </label>
              )}
            />
            {errorMessage && <p className={errorClass}>{errorMessage}</p>}
          </div>
        )

      default:
        return (
          <input
            id={field.id}
            type="text"
            {...register(field.id)}
            className={inputClass}
          />
        )
    }
  }

  // Checkbox (single) has inline label, handled inside case above now
  if (field.type === 'checkbox') {
    return renderField()
  }

  return (
    <div className={className}>
      <label htmlFor={field.id} className={labelClass}>
        {field.label}
        {field.required && <span className="ml-1 text-rose-400">*</span>}
      </label>
      {renderField()}
      {errorMessage && <p className={errorClass}>{errorMessage}</p>}
    </div>
  )
}

export default FieldRenderer
