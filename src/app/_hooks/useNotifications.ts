'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteNotificationService,
  getUnreadCountService,
  listNotificationsService,
  markAllNotificationsReadService,
  markNotificationReadService,
} from '@/app/_services/notifications.services'
import { useChatWsStore } from '@/stores/chat-ws-store'
import type { Page } from '@/types/cms'
import type { AppNotification } from '@/types/notification'

export const notificationKeys = {
  all: ['notifications'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  list: (size: number) => [...notificationKeys.all, 'list', size] as const,
}

/** Okunmamış sayısı — REST + 60sn fallback; WS köprüsü canlı günceller. */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCountService,
    refetchInterval: 60_000,
  })
}

/** Dropdown için son bildirimler (ilk ~10). */
export function useNotificationList(size = 10) {
  return useQuery({
    queryKey: notificationKeys.list(size),
    queryFn: () => listNotificationsService({ size }),
  })
}

export function useNotificationMutations() {
  const qc = useQueryClient()
  const invalidateAll = () =>
    qc.invalidateQueries({ queryKey: notificationKeys.all })

  const markRead = useMutation({
    mutationFn: markNotificationReadService,
    onSuccess: invalidateAll,
  })
  const markAllRead = useMutation({
    mutationFn: markAllNotificationsReadService,
    onSuccess: invalidateAll,
  })
  const remove = useMutation({
    mutationFn: deleteNotificationService,
    onSuccess: invalidateAll,
  })

  return { markRead, markAllRead, remove }
}

/**
 * WS → TanStack Query köprüsü. Header'da bir kez çağrılır.
 * chat-ws-store'daki WS sinyallerini dinleyip query cache'i günceller.
 */
export function useNotificationsRealtime() {
  const qc = useQueryClient()
  const notificationSeq = useChatWsStore(s => s.notificationSeq)
  const notificationSignal = useChatWsStore(s => s.notificationSignal)
  const wsUnreadCount = useChatWsStore(s => s.notificationUnreadCount)

  // Yeni bildirim → liste query'lerinin başına ekle + sayacı tazele
  useEffect(() => {
    if (notificationSeq === 0 || !notificationSignal) return
    const n = notificationSignal
    qc.setQueriesData<Page<AppNotification>>(
      { queryKey: [...notificationKeys.all, 'list'] },
      old => {
        if (!old) return old
        if (old.content.some(x => x.id === n.id)) return old
        return {
          ...old,
          content: [n, ...old.content],
          totalElements: old.totalElements + 1,
        }
      },
    )
    qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
  }, [notificationSeq, notificationSignal, qc])

  // WS'ten gelen okunmamış sayısı → rozet (kaynak-doğruluk)
  useEffect(() => {
    if (wsUnreadCount == null) return
    qc.setQueryData(notificationKeys.unreadCount(), wsUnreadCount)
  }, [wsUnreadCount, qc])
}

/**
 * Tarayıcı bildirimi (Web Notifications API). WS'ten yeni bildirim düştüğünde,
 * sekme görünür + odaklı DEĞİLSE native bildirim gösterir (bakıyorsa header
 * rozeti yeterli). İzin, panel açıldığında bir kez istenir; kullanıcı reddederse
 * sessizce devre dışı kalır. Tıklama: pencereye odaklan + bildirimin link'ine git.
 */
export function useBrowserNotifications() {
  const notificationSeq = useChatWsStore(s => s.notificationSeq)
  const notificationSignal = useChatWsStore(s => s.notificationSignal)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (notificationSeq === 0 || !notificationSignal) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (document.visibilityState === 'visible' && document.hasFocus()) return

    const n = notificationSignal
    try {
      const notif = new Notification(n.title || 'Bildirim', {
        body: n.message,
        tag: `elly-notification-${n.id}`, // aynı bildirim mükerrer gösterilmez
        icon: '/favicon.ico',
      })
      notif.onclick = () => {
        window.focus()
        if (n.link) window.location.assign(n.link)
        notif.close()
      }
    } catch {
      // bazı tarayıcılar (örn. mobil) Notification constructor'ını desteklemez — sessiz geç
    }
  }, [notificationSeq, notificationSignal])
}
