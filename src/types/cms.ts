/**
 * CMS API DTO tipleri (Spring Boot elly repo).
 *
 * Tüm endpoint'ler `RootEntityResponse<T>` wrapper'ı döner — bu projede
 * `BaseResponse<T>` olarak tanımlı (bkz. `src/types/BaseResponse.ts`).
 * Service katmanında `response.data` ile açılır.
 */

// ========== Email Templates (v4) ==========

export interface EmailTemplate {
  id?: number
  tenantId: string | null
  templateKey: string
  subject: string
  htmlBody: string
  description?: string | null
  active: boolean
  version: number
  optimisticLockVersion: number
  createdAt?: string
  updatedAt?: string
}

export interface EmailTemplateCreateRequest {
  templateKey: string
  subject: string
  htmlBody: string
  description?: string | null
  active: boolean
}

export interface EmailTemplateUpdateRequest {
  subject: string
  htmlBody: string
  description?: string | null
  active: boolean
  optimisticLockVersion: number
}

export interface EmailTemplatePreviewRequest {
  data: Record<string, unknown>
}

export interface EmailTemplatePreviewResponse {
  html: string
  subject: string
}

// ========== Email Logs (v3 retry) ==========

export type EmailLogStatus = 'PENDING' | 'SENT' | 'FAILED'

export interface EmailLog {
  id: number
  recipient: string
  subject: string
  templateName: string
  status: EmailLogStatus
  retryCount: number
  errorMessage?: string | null
  createdAt: string
  sentAt: string | null
}

// ========== RabbitMQ Admin ==========

export interface RabbitOverview {
  rabbitmqVersion: string | null
  erlangVersion: string | null
  clusterName: string | null
  totalMessages: number | null
  totalConsumers: number | null
  queueCount: number | null
  exchangeCount: number | null
  connectionCount: number | null
  channelCount: number | null
}

export interface RabbitQueue {
  name: string
  vhost: string
  messages: number | null
  messagesReady: number | null
  messagesUnacknowledged: number | null
  consumers: number | null
  state: string | null
  arguments: Record<string, unknown>
  policy: string | null
  durable: boolean | null
  autoDelete: boolean | null
  exclusive: boolean | null
}

export interface RabbitMessage {
  payload: string
  payloadEncoding: 'string' | 'base64'
  properties: Record<string, unknown>
  messageCount: number | null
  routingKey: string
  redelivered: boolean
  exchange: string
}

export interface RabbitRepublishRequest {
  targetQueue: string
  payload: string
  contentType?: string
}

// ========== Paging (Spring Data Page) ==========

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first?: boolean
  last?: boolean
  empty?: boolean
}

// ========== Permission constants (CMS ile eşleşen) ==========

export const Permissions = {
  EMAIL_TEMPLATES_READ: 'email_templates:read',
  EMAIL_TEMPLATES_MANAGE: 'email_templates:manage',
  EMAILS_READ: 'emails:read',
  EMAILS_RETRY: 'emails:retry',
  RABBIT_READ: 'rabbit:read',
  RABBIT_MANAGE: 'rabbit:manage',
} as const

export type Permission = (typeof Permissions)[keyof typeof Permissions]
