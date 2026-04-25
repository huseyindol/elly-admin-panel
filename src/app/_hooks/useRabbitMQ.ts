'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/api-error'
import type { RabbitRepublishRequest } from '@/types/cms'
import {
  getRabbitOverviewService,
  getRabbitQueueService,
  getRabbitQueuesService,
  peekQueueMessagesService,
  purgeQueueService,
  republishQueueMessageService,
} from '../_services/rabbit-admin.services'

export const rabbitKeys = {
  all: ['rabbit'] as const,
  overview: () => [...rabbitKeys.all, 'overview'] as const,
  queues: () => [...rabbitKeys.all, 'queues'] as const,
  queue: (name: string) => [...rabbitKeys.all, 'queue', name] as const,
  messages: (name: string) => [...rabbitKeys.all, 'messages', name] as const,
}

export function useRabbitOverview() {
  return useQuery({
    queryKey: rabbitKeys.overview(),
    queryFn: () => getRabbitOverviewService(),
    refetchInterval: query => (query.state.error ? false : 30_000),
    refetchIntervalInBackground: false,
    staleTime: 15_000,
    retry: 1,
  })
}

export function useRabbitQueues() {
  return useQuery({
    queryKey: rabbitKeys.queues(),
    queryFn: () => getRabbitQueuesService(),
    refetchInterval: query => (query.state.error ? false : 15_000),
    refetchIntervalInBackground: false,
    staleTime: 10_000,
    retry: 1,
  })
}

export function useRabbitQueue(name: string | null) {
  return useQuery({
    queryKey: rabbitKeys.queue(name ?? ''),
    queryFn: () => getRabbitQueueService(name as string),
    enabled: !!name,
  })
}

/**
 * Peek işlemi ilk açılışta otomatik yüklenmez — kullanıcı butona basınca
 * `refetch()` ile tetiklenir (destructive hissi vermesin diye).
 */
export function useQueueMessages(name: string | null, count: number = 10) {
  return useQuery({
    queryKey: [...rabbitKeys.messages(name ?? ''), count],
    queryFn: () => peekQueueMessagesService(name as string, count),
    enabled: false,
    staleTime: 0,
  })
}

export function usePurgeQueue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => purgeQueueService(name),
    onSuccess: (_, name) => {
      qc.invalidateQueries({ queryKey: rabbitKeys.all })
      toast.success(`Queue "${name}" temizlendi`)
    },
    onError: (err: Error) => {
      const message =
        err instanceof ApiError
          ? mapRabbitApiError(err)
          : (err.message ?? 'Queue temizlenemedi')
      toast.error(message)
    },
  })
}

export function useRepublishMessage(sourceQueue: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: RabbitRepublishRequest) => {
      if (!sourceQueue) {
        throw new Error('Kaynak queue seçili değil')
      }
      return republishQueueMessageService(sourceQueue, body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rabbitKeys.all })
      toast.success('Mesaj yeniden publish edildi')
    },
    onError: (err: Error) => {
      const message =
        err instanceof ApiError
          ? mapRabbitApiError(err)
          : (err.message ?? 'Mesaj yeniden publish edilemedi')
      toast.error(message)
    },
  })
}

function mapRabbitApiError(err: ApiError): string {
  if (err.isUnavailable) return 'RabbitMQ şu an erişilemez'
  if (err.isForbidden) return 'Bu işlem için yetkin yok'
  if (err.isNotFound) return 'Queue bulunamadı'
  if (err.status === 409) return 'Queue şu an kullanımda'
  return err.message
}
