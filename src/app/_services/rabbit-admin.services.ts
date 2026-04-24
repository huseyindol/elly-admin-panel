import { unwrapOrThrow } from '@/lib/api/api-error'
import type { BaseResponse } from '@/types/BaseResponse'
import type {
  RabbitMessage,
  RabbitOverview,
  RabbitQueue,
  RabbitRepublishRequest,
} from '@/types/cms'
import { fetcher } from '@/utils/services/fetcher'

const BASE = '/api/v1/admin/rabbit'

export const getRabbitOverviewService = async () => {
  const response: BaseResponse<RabbitOverview> = await fetcher(
    `${BASE}/overview`,
    { method: 'GET' },
  )
  return unwrapOrThrow(response, 'RabbitMQ broker durumu alınamadı')
}

export const getRabbitQueuesService = async () => {
  const response: BaseResponse<RabbitQueue[]> = await fetcher(
    `${BASE}/queues`,
    { method: 'GET' },
  )
  return unwrapOrThrow(response, 'Queue listesi alınamadı')
}

export const getRabbitQueueService = async (name: string) => {
  const response: BaseResponse<RabbitQueue> = await fetcher(
    `${BASE}/queues/${encodeURIComponent(name)}`,
    { method: 'GET' },
  )
  return unwrapOrThrow(response, `Queue "${name}" alınamadı`)
}

export const peekQueueMessagesService = async (
  name: string,
  count: number = 10,
) => {
  const response: BaseResponse<RabbitMessage[]> = await fetcher(
    `${BASE}/queues/${encodeURIComponent(name)}/messages?count=${count}`,
    { method: 'GET' },
  )
  return unwrapOrThrow(response, 'Queue mesajları okunamadı')
}

export const purgeQueueService = async (name: string) => {
  const response: BaseResponse<void> = await fetcher(
    `${BASE}/queues/${encodeURIComponent(name)}/purge`,
    { method: 'POST' },
  )
  return unwrapOrThrow(response, `Queue "${name}" purge edilemedi`)
}

export const republishQueueMessageService = async (
  sourceQueue: string,
  body: RabbitRepublishRequest,
) => {
  const response: BaseResponse<void> = await fetcher(
    `${BASE}/queues/${encodeURIComponent(sourceQueue)}/republish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return unwrapOrThrow(response, 'Mesaj yeniden publish edilemedi')
}
