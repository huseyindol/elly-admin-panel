import type { Field, FieldType } from '@/types/form'
import { z } from 'zod'

// Field config type for dynamic schemas
export interface FieldConfig {
  label: string
  placeholder?: string
  inputType: string
  options?:
    | readonly { label: string; value: string }[]
    | { label: string; value: string }[]
  helpText?: string
}

export type FieldConfigMap = Record<string, FieldConfig>

/**
 * Extended Field type with additional properties for dynamic forms
 */
export interface DynamicField extends Field {
  inputType?:
    | 'tags'
    | 'textarea'
    | 'text'
    | 'select'
    | 'url'
    | 'email'
    | 'number'
    | 'checkbox'
    | 'radio'
    | 'date'
    | 'phone'
  helpText?: string
  placeholder?: string
}

/**
 * Maps field config inputType to Field type
 */
function mapInputTypeToFieldType(inputType: string): FieldType {
  switch (inputType) {
    case 'tags':
      return 'text' // Tags is rendered as text base
    case 'textarea':
      return 'textarea'
    case 'select':
      return 'select'
    case 'url':
      return 'url'
    case 'email':
      return 'email'
    case 'number':
      return 'number'
    case 'checkbox':
      return 'checkbox'
    case 'radio':
      return 'radio'
    case 'date':
      return 'date'
    case 'phone':
      return 'phone'
    default:
      return 'text'
  }
}

/**
 * Checks if a Zod type is optional
 */
function isOptional(schema: z.ZodType): boolean {
  // Check if it's wrapped in optional or has default
  const typeName = schema.constructor.name
  return (
    typeName === 'ZodOptional' ||
    typeName === 'ZodNullable' ||
    typeName === 'ZodDefault'
  )
}

/**
 * Gets the inner type name from a Zod schema
 */
function getZodTypeName(schema: z.ZodType): string {
  return schema.constructor.name
}

/**
 * Determines if a field is an array type
 */
function isArrayType(schema: z.ZodType): boolean {
  const typeName = getZodTypeName(schema)
  return typeName === 'ZodArray'
}

/**
 * Generates DynamicField array with all config options from Zod schema and fieldConfig
 * This is a simplified version that relies heavily on fieldConfig for metadata
 */
export function generateDynamicFields(
  zodSchema: z.ZodObject<z.ZodRawShape>,
  fieldConfig: FieldConfigMap,
): DynamicField[] {
  const shape = zodSchema.shape
  const fields: DynamicField[] = []

  for (const [key, schema] of Object.entries(shape)) {
    const zodField = schema as z.ZodType
    const config = fieldConfig[key]

    if (!config) {
      // Skip fields without config
      continue
    }

    const inputType = config.inputType as DynamicField['inputType']
    const fieldType = mapInputTypeToFieldType(config.inputType)

    const field: DynamicField = {
      id: key,
      type: fieldType,
      label: config.label,
      required: !isOptional(zodField),
      validation: null,
      condition: null,
      inputType: inputType,
      helpText: config.helpText,
      placeholder: config.placeholder,
    }

    // Add options for select/radio fields
    if (config.options) {
      field.options = [...config.options].map(opt => ({
        label: opt.label,
        value: opt.value,
      }))
    }

    // Mark tags fields based on array type
    if (isArrayType(zodField) && !inputType) {
      field.inputType = 'tags'
    }

    fields.push(field)
  }

  return fields
}

/**
 * Generates Field array from Zod schema and field config (legacy function for compatibility)
 */
export function generateFieldsFromZodSchema(
  zodSchema: z.ZodObject<z.ZodRawShape>,
  fieldConfig: FieldConfigMap,
): (Field & { helpText?: string })[] {
  return generateDynamicFields(zodSchema, fieldConfig)
}
