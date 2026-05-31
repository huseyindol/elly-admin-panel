/** Bildirim (Notification) tipleri — backend sözleşmesi (basedb, kullanıcıya özel) */

export type NotificationType =
  | 'FORM_SUBMISSION'
  | 'EMAIL_FAILED'
  | 'CHAT_MESSAGE'
  | 'USER_REGISTERED'
  | 'MAIL_VERIFY_FAILED'
  | 'SYSTEM'

/**
 * DOM global `Notification` ile çakışmaması için `AppNotification` adı kullanılır.
 */
export interface AppNotification {
  id: number
  userId: number
  type: NotificationType
  title: string
  message: string
  /** Panelde gidilecek yol; backend hazır verir (null ise tıklama no-op) */
  link: string | null
  read: boolean
  /** Olayın geldiği tenant — yalnızca bilgi amaçlı */
  tenantId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}
