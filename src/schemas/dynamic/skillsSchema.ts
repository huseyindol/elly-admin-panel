import { z } from 'zod'

// Zod Schema
export const SkillSchema = z.object({
  name: z.string().min(1).describe('Yetenek Adı'),
  level: z.string().describe('Seviye'),
  years: z.string().describe('Deneyim Süresi'),
  imageUrl: z.string().url().describe('Görsel URL'),
  url: z.string().url().describe('Referans Link'),
  sortOrder: z.coerce.number().int().min(0).default(0).describe('Sıralama'),
})

// Type export
export type SkillType = z.infer<typeof SkillSchema>

// Form field configuration
export const skillsFieldConfig = {
  name: {
    label: 'Yetenek Adı',
    placeholder: 'örnek: React',
    inputType: 'text' as const,
  },
  level: {
    label: 'Seviye',
    inputType: 'select' as const,
    options: [
      { label: 'Expert', value: 'Expert' },
      { label: 'Advanced', value: 'Advanced' },
      { label: 'Intermediate', value: 'Intermediate' },
    ],
  },
  years: {
    label: 'Deneyim',
    placeholder: 'örnek: 5+',
    inputType: 'text' as const,
  },
  imageUrl: {
    label: 'Görsel URL',
    placeholder: 'https://...',
    inputType: 'url' as const,
  },
  url: {
    label: 'Referans Link',
    placeholder: 'https://...',
    inputType: 'url' as const,
  },
  sortOrder: {
    label: 'Sıralama',
    placeholder: '0',
    inputType: 'number' as const,
  },
}

export type SkillsFieldConfig = typeof skillsFieldConfig
