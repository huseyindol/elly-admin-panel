'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  getHistoryService,
  deleteMessageService,
} from '@/app/_services/chat.services'
import { useChatWsStore } from '@/stores/chat-ws-store'
import { useAdminTheme } from '@/app/_hooks'
import { getMyUserId } from '@/utils/chat-role'
import { Trash2, Paperclip, FileText, ImageIcon } from 'lucide-react'
import type { ChatMessage } from '@/types/chat'

interface Props {
  groupId: string
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)$/i

function getFileName(url: string): string {
  try {
    const u = new URL(url, 'http://x')
    const last = u.pathname.split('/').pop() ?? url
    return decodeURIComponent(last)
  } catch {
    return url
  }
}

export function ChatWindow({ groupId }: Props) {
  const { isDarkMode } = useAdminTheme()
  const { messages, prependHistory, sendRead, markMessageDeleted } =
    useChatWsStore()
  const groupMessages = messages[groupId] ?? []
  const bottomRef = useRef<HTMLDivElement>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [myUserId, setMyUserId] = useState<number | null>(null)
  const oldestId = groupMessages[0]?.id

  useEffect(() => {
    getMyUserId().then(setMyUserId)
  }, [])

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
    try {
      const older = await getHistoryService(groupId, oldestId)
      if (older.length < 50) setHasMore(false)
      prependHistory(groupId, older)
    } finally {
      setLoadingMore(false)
    }
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
      setActiveId(null)
    }
  }

  const renderContent = (msg: ChatMessage, isOwn: boolean) => {
    if (msg.deleted) {
      return (
        <span
          className={`text-sm italic ${
            isOwn
              ? 'text-violet-100/70'
              : isDarkMode
                ? 'text-slate-500'
                : 'text-gray-400'
          }`}
        >
          [silindi]
        </span>
      )
    }

    if (msg.contentType === 'FILE' || msg.contentType === 'IMAGE') {
      const url = msg.fileUrl ?? msg.content
      const isImage =
        msg.contentType === 'IMAGE' || IMAGE_EXT.test(getFileName(url))
      if (isImage) {
        return (
          <a href={url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={getFileName(url)}
              className="max-h-60 max-w-full rounded-lg object-cover"
              loading="lazy"
            />
          </a>
        )
      }
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
            isOwn
              ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
              : isDarkMode
                ? 'border-slate-700 bg-slate-900/50 text-slate-200 hover:bg-slate-800'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="max-w-[200px] truncate">{getFileName(url)}</span>
        </a>
      )
    }

    return (
      <span
        className={`whitespace-pre-wrap break-words text-sm ${
          isOwn ? 'text-white' : isDarkMode ? 'text-slate-100' : 'text-gray-800'
        }`}
      >
        {msg.content}
      </span>
    )
  }

  return (
    <div
      className="flex h-full flex-col overflow-y-auto px-3 py-4 sm:px-4"
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

      {groupMessages.length === 0 && !loadingMore && (
        <p
          className={`py-8 text-center text-sm ${
            isDarkMode ? 'text-slate-500' : 'text-gray-400'
          }`}
        >
          Henüz mesaj yok. İlk mesajı sen gönder!
        </p>
      )}

      <div className="flex flex-col gap-2">
        {groupMessages.map((msg, idx) => {
          const isOwn = myUserId !== null && msg.senderId === myUserId
          const prev = groupMessages[idx - 1]
          const isGrouped =
            prev !== undefined &&
            prev.senderId === msg.senderId &&
            !prev.deleted &&
            new Date(msg.createdAt).getTime() -
              new Date(prev.createdAt).getTime() <
              5 * 60 * 1000
          const isActive = activeId === msg.id
          const canDelete = isOwn && !msg.deleted

          return (
            <div
              key={msg.id}
              className={`group relative flex w-full ${
                isOwn ? 'justify-end' : 'justify-start'
              } ${isGrouped ? 'mt-0.5' : 'mt-2'}`}
              onMouseEnter={() => setActiveId(msg.id)}
              onMouseLeave={() =>
                setActiveId(prev => (prev === msg.id ? null : prev))
              }
            >
              <div
                className={`flex max-w-[85%] flex-col sm:max-w-[70%] ${
                  isOwn ? 'items-end' : 'items-start'
                }`}
              >
                {/* Gönderen adı — grup içinde yalnızca başka kullanıcılar için ve gruplanmamış ilk mesajda */}
                {!isOwn && !isGrouped && (
                  <span
                    className={`mb-0.5 px-1 text-xs font-medium ${
                      isDarkMode ? 'text-violet-300' : 'text-violet-600'
                    }`}
                  >
                    {msg.senderUsername}
                  </span>
                )}

                {msg.parentId && (
                  <div
                    className={`mb-1 max-w-full truncate border-l-2 pl-2 text-xs italic ${
                      isDarkMode
                        ? 'border-slate-600 text-slate-500'
                        : 'border-gray-300 text-gray-400'
                    }`}
                  >
                    Yanıtlıyor
                  </div>
                )}

                <div className="relative flex items-end gap-1.5">
                  {/* Mesaj baloncuğu */}
                  <div
                    onClick={() =>
                      setActiveId(prev => (prev === msg.id ? null : msg.id))
                    }
                    className={`relative rounded-2xl px-3 py-2 shadow-sm ${
                      isOwn
                        ? 'rounded-br-md bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                        : isDarkMode
                          ? 'rounded-bl-md bg-slate-800 text-slate-100'
                          : 'rounded-bl-md bg-gray-100 text-gray-800'
                    }`}
                  >
                    {/* File mesajları için ikon başlık */}
                    {(msg.contentType === 'FILE' ||
                      msg.contentType === 'IMAGE') &&
                      !msg.deleted && (
                        <div
                          className={`mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wide ${
                            isOwn
                              ? 'text-white/70'
                              : isDarkMode
                                ? 'text-slate-500'
                                : 'text-gray-500'
                          }`}
                        >
                          {msg.contentType === 'IMAGE' ? (
                            <ImageIcon className="h-3 w-3" />
                          ) : (
                            <Paperclip className="h-3 w-3" />
                          )}
                          <span>
                            {msg.contentType === 'IMAGE' ? 'Görsel' : 'Dosya'}
                          </span>
                        </div>
                      )}

                    {renderContent(msg, isOwn)}

                    {msg.editedAt && !msg.deleted && (
                      <span
                        className={`ml-1 text-[10px] italic ${
                          isOwn
                            ? 'text-white/60'
                            : isDarkMode
                              ? 'text-slate-500'
                              : 'text-gray-400'
                        }`}
                      >
                        (düzenlendi)
                      </span>
                    )}
                  </div>

                  {/* Hover delete — absolute, layout shift yapmaz */}
                  {canDelete && (
                    <button
                      type="button"
                      disabled={deletingId === msg.id}
                      onClick={() => handleDelete(msg.id)}
                      className={`shrink-0 rounded-full p-1 transition-opacity disabled:opacity-40 ${
                        isActive
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100'
                      } ${
                        isDarkMode
                          ? 'bg-slate-800 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400'
                          : 'bg-white text-gray-400 shadow-sm hover:bg-rose-50 hover:text-rose-500'
                      }`}
                      aria-label="Mesajı sil"
                      title="Mesajı sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Zaman damgası — baloncuğun altında küçük */}
                <span
                  className={`mt-0.5 px-1 text-[10px] ${
                    isDarkMode ? 'text-slate-500' : 'text-gray-400'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div ref={bottomRef} />
    </div>
  )
}
