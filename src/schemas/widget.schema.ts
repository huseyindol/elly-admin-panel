import { z } from 'zod'

// Widget Types enum matching backend
export const WidgetTypeEnum = z.enum(['BANNER', 'POST'])

// Create Widget Schema - POST /api/v1/widgets
export const CreateWidgetSchema = z.object({
  name: z
    .string()
    .min(1, 'İsim zorunludur')
    .max(100, 'İsim 100 karakteri geçemez'),
  description: z.string().optional(),
  type: WidgetTypeEnum.default('BANNER'),
  content: z.string().optional(),
  orderIndex: z.number().int().min(0).default(0),
  status: z.boolean().default(true),
  template: z.string().max(50, 'Template 50 karakteri geçemez').optional(),
  bannerIds: z.array(z.number()).optional(),
  postIds: z.array(z.number()).optional(),
})

// Update Widget Schema - PUT /api/v1/widgets/{id}
export const UpdateWidgetSchema = CreateWidgetSchema

// Type exports - use z.input for form input types
export type CreateWidgetInput = z.input<typeof CreateWidgetSchema>
export type UpdateWidgetInput = z.input<typeof UpdateWidgetSchema>
export type WidgetType = z.infer<typeof WidgetTypeEnum>
