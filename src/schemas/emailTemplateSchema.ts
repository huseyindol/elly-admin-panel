import { z } from 'zod'

export const emailTemplateSchema = z.object({
  templateKey: z
    .string()
    .min(2, 'Minimum 2 karakter')
    .max(100, 'Maximum 100 karakter')
    .regex(
      /^[a-z0-9-]+$/,
      'Sadece küçük harf, rakam ve tire (-) kullanılabilir',
    ),
  subject: z
    .string()
    .min(1, 'Konu boş olamaz')
    .max(255, 'Maximum 255 karakter'),
  description: z
    .string()
    .max(500, 'Maximum 500 karakter')
    .nullable()
    .optional(),
  htmlBody: z.string().min(1, 'HTML body boş olamaz'),
  active: z.boolean(),
})

export type EmailTemplateFormValues = z.infer<typeof emailTemplateSchema>

export const emailTemplateUpdateSchema = emailTemplateSchema
  .omit({ templateKey: true })
  .extend({
    optimisticLockVersion: z.number(),
  })

export type EmailTemplateUpdateValues = z.infer<
  typeof emailTemplateUpdateSchema
>
