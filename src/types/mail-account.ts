export interface MailAccount {
  id: number
  name: string
  fromAddress: string
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  /** Tenant'ın ana gönderim hesabı. true → liste ve formlarda "Ana Hesap" rozeti. */
  isPrimary: boolean
  active: boolean
  tenantId: string | null
  createdAt: string
  updatedAt: string
  // smtpPassword: hiçbir zaman response'da dönmez
}

export interface MailAccountRequest {
  name: string
  fromAddress: string
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  /** Oluştururken zorunlu; güncellerken boş bırakılırsa mevcut şifre korunur. */
  smtpPassword?: string
  /** true yapılınca aynı tenantId'nin önceki primary'si otomatik false olur (server-side). */
  isPrimary?: boolean
  active?: boolean
  tenantId?: string
}
