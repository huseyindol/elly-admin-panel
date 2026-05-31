import type { BaseResponse } from '@/types/BaseResponse'
import type { Page } from '@/types/cms'
import type { AppNotification } from '@/types/notification'
import { fetcher } from '@/utils/services/fetcher'

const BASE = '/api/v1/notifications'

export interface ListNotificationsParams {
  page?: number
  size?: number
  unread?: boolean
}

/**
 * Bildirim listesi (paged, createdAt DESC). X-Tenant-Id GÖNDERİLMEZ —
 * bildirimler basedb'de; backend path'i basedb'ye sabitler.
 */
export const listNotificationsService = async (
  params: ListNotificationsParams = {},
): Promise<Page<AppNotification>> => {
  const search = new URLSearchParams()
  if (params.page != null) search.set('page', String(params.page))
  if (params.size != null) search.set('size', String(params.size))
  if (params.unread) search.set('unread', 'true')
  const query = search.toString()

  const res: BaseResponse<Page<AppNotification>> = await fetcher(
    `${BASE}${query ? `?${query}` : ''}`,
    { method: 'GET' },
  )
  if (!res.result) throw new Error(res.message ?? 'Bildirimler alınamadı')
  return res.data
}

export const getUnreadCountService = async (): Promise<number> => {
  const res: BaseResponse<{ count: number }> = await fetcher(
    `${BASE}/unread-count`,
    { method: 'GET' },
  )
  if (!res.result) throw new Error(res.message ?? 'Okunmamış sayısı alınamadı')
  return res.data.count
}

export const markNotificationReadService = async (
  id: number,
): Promise<AppNotification> => {
  const res: BaseResponse<AppNotification> = await fetcher(
    `${BASE}/${id}/read`,
    { method: 'POST' },
  )
  if (!res.result) throw new Error(res.message ?? 'Okundu işaretlenemedi')
  return res.data
}

export const markAllNotificationsReadService = async (): Promise<number> => {
  const res: BaseResponse<{ updated: number }> = await fetcher(
    `${BASE}/read-all`,
    { method: 'POST' },
  )
  if (!res.result) throw new Error(res.message ?? 'Tümü okundu işaretlenemedi')
  return res.data.updated
}

export const deleteNotificationService = async (id: number): Promise<void> => {
  await fetcher<null>(`${BASE}/${id}`, { method: 'DELETE' })
}
