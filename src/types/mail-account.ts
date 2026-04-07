export interface MailAccount {
  id: number
  name: string
  fromAddress: string
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  isDefault: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface MailAccountRequest {
  name: string
  fromAddress: string
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword?: string
  isDefault?: boolean
  active?: boolean
}
