// Form Engine Types
// Strictly aligned with NEXTJS_API_GUIDE.md specification

// ============================================
// Enums & Basic Types
// ============================================

export type FormLayout = 'single' | 'vertical' | 'wizard'

export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'multi_checkbox'
  | 'radio'
  | 'textarea'
  | 'date'
  | 'phone'
  | 'url'

export type ConditionOperator = 'EQUALS' | 'NOT_EQUALS' | 'GT' | 'LT'

// ============================================
// Condition & Validation Rules
// ============================================

export interface ConditionRule {
  field: string // ID of field to watch
  operator: ConditionOperator
  value: string | number | boolean
}

export interface ValidationRule {
  min?: number | null
  max?: number | null
  pattern?: string | null
}

export interface FieldOption {
  label: string
  value: string
}

// ============================================
// Field Definition
// ============================================

export interface Field {
  id: string
  type: FieldType
  label: string
  required: boolean
  options?: FieldOption[] | null
  validation?: ValidationRule | null
  condition?: ConditionRule | null
  stepId?: string
}

// ============================================
// Form Config
// ============================================

export interface FormConfig {
  layout: FormLayout
  submitLabel?: string
}

// ============================================
// Schema Definition (nested inside FormSchema)
// ============================================

export interface Step {
  id: string
  title: string
  description?: string
}

export interface FormSchemaDefinition {
  config: FormConfig
  fields: Field[]
  steps?: Step[]
}

// ============================================
// Form Schema (API Response Model)
// ============================================

export interface FormSchema {
  id: number
  title: string
  version: number
  schema: FormSchemaDefinition
  active: boolean
  createdAt?: string
  updatedAt?: string
}

// ============================================
// Form Submission (API Response Model)
// ============================================

export interface FormSubmission {
  id: number
  formDefinitionId: number
  formTitle: string
  payload: Record<string, unknown>
  submittedAt: string
  createdAt?: string
}

// ============================================
// Summary Types for Lists
// ============================================

export interface FormSchemaSummary {
  id: number
  title: string
  version: number
  active: boolean
  createdAt?: string
  updatedAt?: string
}
