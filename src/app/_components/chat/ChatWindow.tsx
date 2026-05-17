'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  getHistoryService,
  deleteMessageService,
} from '@/app/_services/chat.services'
import { useChatWsStore } from '@/stores/chat-ws-store'
import { useAdminTheme } from '@/app/_hooks'
import { Trash2 } from 'lucide-react'

interface Props {
  groupId: string
}

export function ChatWindow({ groupId }: Props) {
  const { isDarkMode } = useAdminTheme()
  const { messages, prependHistory, sendRead, markMessageDeleted } =
    useChatWsStore()
  const groupMessages = messages[groupId] ?? []
  const bottomRef = useRef<HTMLDivElement>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const oldestId = groupMessages[0]?.id

  useEffect(() => {
    getHistoryService(groupId)
      .then(msgs => {
        prependHistory(groupId, msgs)
        if (msgs.length < 50) setHasMore(false)
        sendRead(groupId)
      })
      .catch(() => {})
  }, [groupId, prependHistory, sendRead])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [groupMessages.length])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !oldestId) return
    setLoadingMore(true)
    const older = await getHistoryService(groupId, oldestId)
    if (older.length < 50) setHasMore(false)
    prependHistory(groupId, older)
    setLoadingMore(false)
  }, [groupId, oldestId, loadingMore, hasMore, prependHistory])

  const handleDelete = async (messageId: string) => {
    setDeletingId(messageId)
    try {
      await deleteMessageService(messageId)
      markMessageDeleted(groupId, messageId)
    } catch {
      // backend 403 → sessizce geç
    } finally {
      setDeletingId(null)
      setHoveredId(null)
    }
  }

  return (
    <div
      className="flex h-full flex-col space-y-1 overflow-y-auto p-4"
      onScroll={e => {
        if (e.currentTarget.scrollTop === 0) loadMore()
      }}
    >
      {loadingMore && (
        <p
          className={`py-2 text-center text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
        >
          Yükleniyor...
        </p>
      )}

      {groupMessages.map(msg => (
        <div
          key={msg.id}
          className="group relative flex flex-col"
          onMouseEnter={() => setHoveredId(msg.id)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() =>
            setHoveredId(prev => (prev === msg.id ? null : msg.id))
          }
        >
          {msg.parentId && (
            <div
              className={`mb-1 border-l-2 pl-2 text-xs italic ${
                isDarkMode
                  ? 'border-slate-600 text-slate-500'
                  : 'border-gray-300 text-gray-400'
              }`}
            >
              Yanıtlıyor
            </div>
          )}
          <div className="flex items-start gap-2">
            <span
              className={`shrink-0 text-xs font-medium ${
                isDarkMode ? 'text-violet-400' : 'text-violet-600'
              }`}
            >
              {msg.senderUsername}
            </span>
            <div className="min-w-0 flex-1">
              {msg.deleted ? (
                <span
                  className={`text-sm italic ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
                >
                  [silindi]
                </span>
              ) : (
                <span
                  className={`break-words text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}
                >
                  {msg.content}
                </span>
              )}
              {msg.editedAt && !msg.deleted && (
                <span
                  className={`ml-1 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
                >
                  (düzenlendi)
                </span>
              )}
            </div>
            <span
              className={`shrink-0 text-xs ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}
            >
              {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {/* Soft delete — hover'da görünür, zaten silinmişse gizle */}
            {!msg.deleted && hoveredId === msg.id && (
              <button
                type="button"
                disabled={deletingId === msg.id}
                onClick={() => handleDelete(msg.id)}
                className={`shrink-0 rounded p-0.5 transition-colors ${
                  isDarkMode
                    ? 'text-slate-500 hover:bg-rose-500/10 hover:text-rose-400'
                    : 'text-gray-400 hover:bg-rose-50 hover:text-rose-500'
                } disabled:opacity-40`}
                aria-label="Mesajı sil"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}

      {groupMessages.length === 0 && (
        <p
          className={`py-8 text-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
        >
          Henüz mesaj yok. İlk mesajı sen gönder!
        </p>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
