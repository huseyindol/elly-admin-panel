'use client'

import {
  getVisibleFieldIds,
  isFieldVisible,
} from '@/app/(admin)/admin/_utils/condition-evaluator'
import {
  generateDefaultValues,
  generateZodSchema,
} from '@/app/(admin)/admin/_utils/zod-generator'
import type { Field, FormSchema } from '@/types/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { UseFormReturn, useForm } from 'react-hook-form'

interface UseFormSchemaOptions {
  schema: FormSchema
  defaultValues?: Record<string, unknown>
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>
}

interface UseFormSchemaReturn {
  form: UseFormReturn<Record<string, unknown>>
  visibleFields: Field[]
  isFieldVisibleById: (fieldId: string) => boolean
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
}

/**
 * Custom hook for managing dynamic form schema with React Hook Form.
 * Handles:
 * - Dynamic Zod schema generation
 * - Conditional field visibility
 */
export function useFormSchema({
  schema,
  defaultValues: customDefaults,
  onSubmit,
}: UseFormSchemaOptions): UseFormSchemaReturn {
  const { fields } = schema.schema

  // Generate default values from field definitions
  const defaultValues = useMemo(() => {
    const generated = generateDefaultValues(fields)
    return { ...generated, ...customDefaults }
  }, [fields, customDefaults])

  // Generate initial Zod schema
  const zodSchema = useMemo(() => {
    return generateZodSchema(fields)
  }, [fields])

  // Initialize form with zodResolver
  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(zodSchema),
    defaultValues,
    mode: 'onChange',
    shouldUnregister: true,
  })

  // Watch all form values for conditional visibility
  const formValues = form.watch()

  // Calculate visible fields based on current form values
  const visibleFields = useMemo(() => {
    return fields.filter(field => isFieldVisible(field, formValues))
  }, [fields, formValues])

  // Check if a specific field is visible
  const isFieldVisibleById = (fieldId: string): boolean => {
    const field = fields.find(f => f.id === fieldId)
    if (!field) return false
    return isFieldVisible(field, formValues)
  }

  // Handle form submission
  const handleSubmit = form.handleSubmit(async data => {
    const visibleFieldIds = getVisibleFieldIds(fields, formValues)
    const filteredData: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(data)) {
      if (visibleFieldIds.has(key)) {
        filteredData[key] = value
      }
    }

    if (onSubmit) {
      await onSubmit(filteredData)
    }
  })

  return {
    form,
    visibleFields,
    isFieldVisibleById,
    handleSubmit,
  }
}
