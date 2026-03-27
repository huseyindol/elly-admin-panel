'use client'

import { useAdminTheme } from '@/app/(admin)/admin/_hooks'
import { useFormSchema } from '@/app/(admin)/admin/_hooks/useFormSchema'
import type { FormSchema } from '@/types/form'
import { FormProvider } from 'react-hook-form'
import { FieldRenderer } from './FieldRenderer'

interface DynamicFormProps {
  schema: FormSchema
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>
  isSubmitting?: boolean
  className?: string
}

/**
 * DynamicForm - Main container for schema-driven forms in admin panel.
 * Renders all fields in a vertical stack with submit button.
 */
export function DynamicForm({
  schema,
  onSubmit,
  isSubmitting = false,
  className,
}: Readonly<DynamicFormProps>) {
  const { isDarkMode } = useAdminTheme()

  const { form, visibleFields, handleSubmit } = useFormSchema({
    schema,
    onSubmit,
  })

  const { config } = schema.schema

  // ============================================
  // Styling
  // ============================================
  const cardClass = `rounded-2xl p-6 ${
    isDarkMode
      ? 'border border-slate-800/50 bg-slate-900/60'
      : 'border border-gray-200 bg-white'
  } backdrop-blur-sm`

  const buttonPrimaryClass =
    'flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50'

  // ============================================
  // Main Render
  // ============================================
  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit}
        className={`${cardClass} ${className || ''}`}
      >
        {/* Form Title */}
        <div className="mb-6">
          <h2
            className={`text-xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {schema.title}
          </h2>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {visibleFields.map(field => (
            <FieldRenderer key={field.id} field={field} form={form} />
          ))}
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full ${buttonPrimaryClass}`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Gönderiliyor...</span>
              </span>
            ) : (
              config.submitLabel || 'Gönder'
            )}
          </button>
        </div>
      </form>
    </FormProvider>
  )
}

export default DynamicForm
