import { z } from 'zod'

// SEO Info Schema (shared with pages)
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

// Create Post Schema - POST /api/v1/posts
export const CreatePostSchema = z.object({
  title: z
    .string()
    .min(1, 'Başlık zorunludur')
    .max(200, 'Başlık 200 karakteri geçemez'),
  content: z.string().optional(),
  slug: z
    .string()
    .min(1, 'Slug zorunludur')
    .max(200, 'Slug 200 karakteri geçemez')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug sadece küçük harf, rakam ve tire içerebilir',
    ),
  status: z.boolean().default(true),
  orderIndex: z.number().int().min(0).default(0),
  template: z.string().max(50, 'Template 50 karakteri geçemez').optional(),
  seoInfo: SeoInfoSchema.optional(),
})

// Update Post Schema - PUT /api/v1/posts/{id}
export const UpdatePostSchema = CreatePostSchema

// Type exports - use z.input for form input types
export type CreatePostInput = z.input<typeof CreatePostSchema>
export type UpdatePostInput = z.input<typeof UpdatePostSchema>
export type SeoInfoInput = z.input<typeof SeoInfoSchema>
