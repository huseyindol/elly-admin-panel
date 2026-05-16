'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getHistoryService } from '@/app/_services/chat.services'
import { useChatWsStore } from '@/stores/chat-ws-store'
import { useAdminTheme } from '@/app/_hooks'

interface Props {
  groupId: string
}

export function ChatWindow({ groupId }: Props) {
  const { isDarkMode } = useAdminTheme()
  const { messages, prependHistory, sendRead } = useChatWsStore()
  const groupMessages = messages[groupId] ?? []
  const bottomRef = useRef<HTMLDivElement>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0) loadMore()
  }

  return (
    <div
      className="flex h-full flex-col space-y-1 overflow-y-auto p-4"
      onScroll={handleScroll}
    >
      {loadingMore && (
        <p
          className={`py-2 text-center text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
        >
          Yükleniyor...
        </p>
      )}

      {groupMessages.map(msg => (
        <div key={msg.id} className="flex flex-col">
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
