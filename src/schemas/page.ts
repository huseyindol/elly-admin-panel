import { z } from 'zod'

// Query Parameters for GET /api/v1/pages/{slug}
export const PageParams = z.object({
  slug: z.string().describe('Page slug'),
})

// SEO Info Schema
export const SeoInfoSchema = z.object({
  title: z
    .string()
    .min(1, 'SEO başlığı zorunludur')
    .max(60, 'SEO başlığı 60 karakteri geçemez'),
  description: z
    .string()
    .min(1, 'SEO açıklaması zorunludur')
    .max(160, 'SEO açıklaması 160 karakteri geçemez'),
  keywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  noIndex: z.boolean().default(false),
  noFollow: z.boolean().default(false),
})

// Create Page Body - POST /api/v1/pages
export const CreatePageSchema = z.object({
  title: z
    .string()
    .min(1, 'Başlık zorunludur')
    .max(100, 'Başlık 100 karakteri geçemez'),
  description: z.string().optional(),
  slug: z
    .string()
    .min(1, 'Slug zorunludur')
    .max(100, 'Slug 100 karakteri geçemez')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug sadece küçük harf, rakam ve tire içerebilir',
    ),
  status: z.boolean().default(true),
  template: z.string().max(50, 'Template 50 karakteri geçemez').optional(),
  seoInfo: SeoInfoSchema.optional(),
  componentIds: z.array(z.number()).optional(), // Component ID'leri number olarak geliyor
})

// Update Page Body - PUT /api/v1/pages/{id}
export const UpdatePageSchema = CreatePageSchema

// Form input types - z.input for react-hook-form compatibility
// (before defaults applied, so optional fields work correctly in forms)
export type CreatePageInput = z.input<typeof CreatePageSchema>
export type UpdatePageInput = z.input<typeof UpdatePageSchema>
export type SeoInfoInput = z.input<typeof SeoInfoSchema>

// API response types are defined in BaseResponse.ts (Page, PageResponseType, etc.)
