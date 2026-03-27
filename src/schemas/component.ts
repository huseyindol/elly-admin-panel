import { z } from 'zod'

// Component Types enum matching backend
export const ComponentTypeEnum = z.enum(['BANNER', 'WIDGET', 'FORM'])

// Create Component Schema - POST /api/v1/components
export const CreateComponentSchema = z.object({
  name: z
    .string()
    .min(1, 'İsim zorunludur')
    .max(100, 'İsim 100 karakteri geçemez'),
  description: z.string().optional(),
  type: ComponentTypeEnum.default('BANNER'),
  content: z.string().optional(),
  orderIndex: z.number().int().min(0).default(0),
  status: z.boolean().default(true),
  template: z.string().max(50, 'Template 50 karakteri geçemez').optional(),
  pageIds: z.array(z.number()).optional(),
  bannerIds: z.array(z.number()).optional(),
  widgetIds: z.array(z.number()).optional(),
  formIds: z.array(z.number()).optional(),
})

// Update Component Schema - PUT /api/v1/components/{id}
export const UpdateComponentSchema = CreateComponentSchema

// Type exports - use z.input for form input types
export type CreateComponentInput = z.input<typeof CreateComponentSchema>
export type CreateComponentOutput = z.output<typeof CreateComponentSchema>
export type UpdateComponentInput = z.input<typeof UpdateComponentSchema>
export type ComponentType = z.infer<typeof ComponentTypeEnum>
