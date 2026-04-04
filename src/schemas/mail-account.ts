import { z } from 'zod'

export const MailAccountSchema = z.object({
  name: z.string().min(1, 'Ad zorunludur'),
  fromAddress: z.string().email('Geçerli bir e-posta adresi giriniz'),
  smtpHost: z.string().min(1, 'SMTP sunucusu zorunludur'),
  smtpPort: z
    .number()
    .int('Port tam sayı olmalıdır')
    .min(1, 'Port 1-65535 aralığında olmalıdır')
    .max(65535, 'Port 1-65535 aralığında olmalıdır'),
  smtpUsername: z.string().min(1, 'SMTP kullanıcı adı zorunludur'),
  smtpPassword: z.string().optional(),
  isDefault: z.boolean().default(false),
  active: z.boolean().default(true),
})

export const CreateMailAccountSchema = MailAccountSchema.extend({
  smtpPassword: z.string().min(1, 'Şifre zorunludur'),
})

export const UpdateMailAccountSchema = MailAccountSchema

export const SmtpTestSchema = z.object({
  testTo: z.string().email('Geçerli bir e-posta adresi giriniz'),
})

export type MailAccountInput = z.input<typeof MailAccountSchema>
export type CreateMailAccountInput = z.input<typeof CreateMailAccountSchema>
export type UpdateMailAccountInput = z.input<typeof UpdateMailAccountSchema>
export type SmtpTestInput = z.input<typeof SmtpTestSchema>
