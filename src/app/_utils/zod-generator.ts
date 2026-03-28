import type { Field, FieldType } from '@/types/form'
import { z } from 'zod'

/**
 * Dynamically generates a Zod schema from form field definitions.
 *
 * @param fields - Array of field definitions
 * @param visibleFields - Optional Set of visible field IDs (hidden fields become optional)
 * @returns Zod object schema for form validation
 */
export function generateZodSchema(
  fields: Field[],
  visibleFields?: Set<string>,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    let fieldSchema = createFieldSchema(field)

    // If visibleFields is provided, make hidden fields optional
    if (visibleFields && !visibleFields.has(field.id)) {
      fieldSchema = fieldSchema.optional()
    } else if (!field.required) {
      fieldSchema = fieldSchema.optional()
    }

    shape[field.id] = fieldSchema
  }

  return z.object(shape)
}

/**
 * Creates a Zod schema for a single field based on its type and validation rules.
 */
function createFieldSchema(field: Field): z.ZodTypeAny {
  const { type, label, required, validation } = field
  let schema: z.ZodTypeAny

  switch (type) {
    case 'email':
      schema = z.string().email(`${label} geçerli bir e-posta olmalıdır`)
      if (validation?.max != null) {
        schema = (schema as z.ZodString).max(
          validation.max,
          `${label} en fazla ${validation.max} karakter olabilir`,
        )
      }
      break

    case 'number':
      schema = z.coerce.number()
      if (validation?.min != null) {
        schema = (schema as z.ZodNumber).min(
          validation.min,
          `${label} en az ${validation.min} olmalıdır`,
        )
      }
      if (validation?.max != null) {
        schema = (schema as z.ZodNumber).max(
          validation.max,
          `${label} en fazla ${validation.max} olabilir`,
        )
      }
      break

    case 'checkbox':
      schema = z.boolean()
      break

    case 'select':
    case 'radio':
      schema = z.string()
      break

    case 'date':
      schema = z
        .string()
        .refine(val => !val || !Number.isNaN(Date.parse(val)), {
          message: `${label} geçerli bir tarih olmalıdır`,
        })
      break

    case 'phone':
      schema = z.string()
      if (validation?.pattern) {
        schema = (schema as z.ZodString).regex(
          new RegExp(validation.pattern),
          `${label} geçerli bir telefon numarası olmalıdır`,
        )
      } else {
        schema = (schema as z.ZodString).regex(
          /^(\+90|0)?\d{10}$/,
          `${label} geçerli bir telefon numarası olmalıdır`,
        )
      }
      break

    case 'url':
      schema = z.string().url(`${label} geçerli bir URL olmalıdır`)
      break

    case 'text':
    case 'textarea':
    default:
      schema = z.string()
      if (validation?.min != null) {
        schema = (schema as z.ZodString).min(
          validation.min,
          `${label} en az ${validation.min} karakter olmalıdır`,
        )
      }
      if (validation?.max != null) {
        schema = (schema as z.ZodString).max(
          validation.max,
          `${label} en fazla ${validation.max} karakter olabilir`,
        )
      }
      if (validation?.pattern) {
        schema = (schema as z.ZodString).regex(
          new RegExp(validation.pattern),
          `${label} geçersiz format`,
        )
      }
      break
  }

  // Add required validation
  if (required && type !== 'checkbox') {
    if (schema instanceof z.ZodString) {
      schema = schema.min(1, `${label} zorunludur`)
    }
  }

  return schema
}

/**
 * Gets the default value for a field based on its type.
 */
export function getDefaultFieldValue(type: FieldType): unknown {
  switch (type) {
    case 'checkbox':
      return false
    case 'number':
      return undefined
    case 'select':
    case 'radio':
      return ''
    default:
      return ''
  }
}

/**
 * Generates default values for all form fields.
 */
export function generateDefaultValues(
  fields: Field[],
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  for (const field of fields) {
    defaults[field.id] = getDefaultFieldValue(field.type)
  }
  return defaults
}
