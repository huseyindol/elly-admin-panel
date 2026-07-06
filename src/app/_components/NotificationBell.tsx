'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { useAdminTheme } from '../_hooks'
import {
  useBrowserNotifications,
  useNotificationList,
  useNotificationMutations,
  useNotificationsRealtime,
  useUnreadCount,
} from '@/app/_hooks/useNotifications'
import type { AppNotification } from '@/types/notification'

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'az önce'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} dk önce`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} sa önce`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} gün önce`
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
  })
}

export function NotificationBell() {
  const { isDarkMode } = useAdminTheme()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // WS → query köprüsü (canlı güncelleme)
  useNotificationsRealtime()
  // Sekme odakta değilken native tarayıcı bildirimi göster
  useBrowserNotifications()

  const { data: unreadCount = 0 } = useUnreadCount()
  const { data: page, isLoading } = useNotificationList(10)
  const { markRead, markAllRead, remove } = useNotificationMutations()

  const notifications = page?.content ?? []

  const handleItemClick = (n: AppNotification) => {
    if (!n.read) markRead.mutate(n.id)
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`relative rounded-xl p-2.5 transition-colors ${
          isDarkMode
            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
        }`}
        aria-label="Bildirimler"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="notification-badge absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-medium text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 h-full w-full cursor-default"
          />
          <div
            className={`absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl shadow-2xl ${
              isDarkMode
                ? 'border border-slate-700/50 bg-slate-900'
                : 'border border-gray-200 bg-white'
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between border-b px-4 py-3 ${
                isDarkMode ? 'border-slate-800' : 'border-gray-100'
              }`}
            >
              <span
                className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Bildirimler
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="inline-flex items-center gap-1 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300 disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Tümünü okundu
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading && (
                <p
                  className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
                >
                  Yükleniyor...
                </p>
              )}
              {!isLoading && notifications.length === 0 && (
                <p
                  className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
                >
                  Bildirim yok
                </p>
              )}

              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`group flex items-start gap-2 border-b px-3 py-2.5 transition-colors last:border-b-0 ${
                    isDarkMode
                      ? 'border-slate-800/60 hover:bg-slate-800/50'
                      : 'border-gray-50 hover:bg-gray-50'
                  } ${!n.read ? (isDarkMode ? 'bg-violet-500/5' : 'bg-violet-50/50') : ''}`}
                >
                  {/* Okunmamış göstergesi */}
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.read ? 'bg-transparent' : 'bg-violet-500'
                    }`}
                    aria-hidden
                  />

                  <button
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p
                      className={`truncate text-sm ${
                        n.read
                          ? isDarkMode
                            ? 'text-slate-300'
                            : 'text-gray-700'
                          : isDarkMode
                            ? 'font-semibold text-white'
                            : 'font-semibold text-gray-900'
                      }`}
                    >
                      {n.title}
                    </p>
                    <p
                      className={`truncate text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
                    >
                      {n.message}
                    </p>
                    <p
                      className={`mt-0.5 text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
                    >
                      {formatRelative(n.createdAt)}
                    </p>
                  </button>

                  {/* Sil */}
                  <button
                    type="button"
                    onClick={() => remove.mutate(n.id)}
                    disabled={remove.isPending}
                    aria-label="Bildirimi sil"
                    className={`shrink-0 rounded-lg p-1 opacity-0 transition-opacity disabled:opacity-40 group-hover:opacity-100 ${
                      isDarkMode
                        ? 'text-slate-500 hover:bg-slate-800 hover:text-rose-400'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-rose-500'
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
