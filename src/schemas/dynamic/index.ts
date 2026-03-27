import { experienceFieldConfig, ExperienceSchema } from './experienceSchema'
import { SkillSchema, skillsFieldConfig } from './skillsSchema'

// Dynamic schema registry - tüm dynamic schemalari burada tutuyoruz
export const dynamicSchemas = {
  skills: {
    schema: SkillSchema,
    fieldConfig: skillsFieldConfig,
    label: 'Yetenekler',
    sectionKey: 'portfolio_skills',
  },
  experience: {
    schema: ExperienceSchema,
    fieldConfig: experienceFieldConfig,
    label: 'Deneyimler',
    sectionKey: 'portfolio_experience',
  },
} as const

// ContentType - registry'deki schema key'leri
export type ContentType = keyof typeof dynamicSchemas

// Schema item type
export interface SchemaRegistryItem {
  schema: typeof SkillSchema | typeof ExperienceSchema
  fieldConfig: typeof skillsFieldConfig | typeof experienceFieldConfig
  label: string
  sectionKey: string
}

// Helper function to get schema by content type
export function getSchemaByContentType(contentType: ContentType) {
  return dynamicSchemas[contentType]
}

// Helper function to get all content types
export function getContentTypes(): { value: ContentType; label: string }[] {
  return Object.entries(dynamicSchemas).map(([key, value]) => ({
    value: key as ContentType,
    label: value.label,
  }))
}

export type { ExperienceType } from './experienceSchema'
export type { SkillType } from './skillsSchema'

// Re-export schemas
export { experienceFieldConfig, ExperienceSchema } from './experienceSchema'
export { SkillSchema, skillsFieldConfig } from './skillsSchema'
