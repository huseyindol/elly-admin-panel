'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  getHistoryService,
  deleteMessageService,
  listBansService,
  banUserService,
  unbanUserService,
} from '@/app/_services/chat.services'
import { useChatWsStore } from '@/stores/chat-ws-store'
import { useAdminTheme } from '@/app/_hooks'
import { useMyUserId } from '@/stores/user-store'
import { usePermission } from '@/hooks/usePermission'
import { banKey } from '@/utils/chat-role'
import {
  Trash2,
  Paperclip,
  FileText,
  ImageIcon,
  MoreVertical,
  Ban,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
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
  // TC routing için aktif grubun tenantId'si
  const activeGroupTenantId = useChatWsStore(s => s.activeGroupTenantId)
  const bannedKeys = useChatWsStore(s => s.bannedKeys)
  const setBannedKeys = useChatWsStore(s => s.setBannedKeys)
  const groupMessages = messages[groupId] ?? []
  const bottomRef = useRef<HTMLDivElement>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [banMenuId, setBanMenuId] = useState<string | null>(null)
  const [banBusyId, setBanBusyId] = useState<string | null>(null)
  const myUserId = useMyUserId()
  const { hasPermission } = usePermission()
  const canManageBans = hasPermission('chat:manage')
  const isTc = activeGroupTenantId !== null
  const oldestId = groupMessages[0]?.id

  // TC grup açılışında ban listesini yükle → bannedKeys (rozet + menü).
  // AC grupta ban yok; subscribeToGroup zaten sıfırlıyor.
  useEffect(() => {
    if (!activeGroupTenantId) return
    let cancelled = false
    listBansService(groupId, activeGroupTenantId)
      .then(bans => {
        if (cancelled) return
        const keys = new Set<string>()
        for (const b of bans) {
          const k = banKey(b.sessionId, b.visitorId)
          if (k) keys.add(k)
        }
        setBannedKeys(keys)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [groupId, activeGroupTenantId, setBannedKeys])

  // Mesajdan ban hedefi: GUEST → sessionId, VISITOR → visitorId. ADMIN → null.
  const banTarget = (
    msg: ChatMessage,
  ): { sessionId?: string; visitorId?: number } | null => {
    if (msg.senderType === 'GUEST' && msg.sessionId)
      return { sessionId: msg.sessionId }
    if (msg.senderType === 'VISITOR' && msg.visitorId != null)
      return { visitorId: msg.visitorId }
    return null
  }

  const handleBan = async (msg: ChatMessage) => {
    const target = banTarget(msg)
    if (!target) return
    setBanBusyId(msg.id)
    try {
      await banUserService(groupId, target, activeGroupTenantId)
      const k = banKey(msg.sessionId, msg.visitorId)
      // optimistic — WS BANNED olayı da gelip aynı key'i ekleyecek (idempotent)
      if (k) setBannedKeys(new Set(bannedKeys).add(k))
      toast.success('Kullanıcı banlandı')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Kullanıcı banlanamadı')
    } finally {
      setBanBusyId(null)
      setBanMenuId(null)
    }
  }

  const handleUnban = async (msg: ChatMessage) => {
    const target = banTarget(msg)
    if (!target) return
    setBanBusyId(msg.id)
    try {
      await unbanUserService(groupId, target, activeGroupTenantId)
      const k = banKey(msg.sessionId, msg.visitorId)
      if (k) {
        const next = new Set(bannedKeys)
        next.delete(k)
        setBannedKeys(next)
      }
      toast.success('Ban kaldırıldı')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ban kaldırılamadı')
    } finally {
      setBanBusyId(null)
      setBanMenuId(null)
    }
  }

  useEffect(() => {
    let cancelled = false

    getHistoryService(groupId, undefined, 50, activeGroupTenantId)
      .then(msgs => {
        if (cancelled) return
        prependHistory(groupId, msgs)
        if (msgs.length < 50) setHasMore(false)
        sendRead(groupId)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [groupId, prependHistory, sendRead, activeGroupTenantId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [groupMessages.length])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !oldestId) return
    setLoadingMore(true)
    try {
      const older = await getHistoryService(
        groupId,
        oldestId,
        50,
        activeGroupTenantId,
      )
      if (older.length < 50) setHasMore(false)
      prependHistory(groupId, older)
    } finally {
      setLoadingMore(false)
    }
  }, [
    groupId,
    oldestId,
    loadingMore,
    hasMore,
    prependHistory,
    activeGroupTenantId,
  ])

  const handleDelete = async (messageId: string) => {
    setDeletingId(messageId)
    try {
      await deleteMessageService(messageId, activeGroupTenantId)
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
          // Polymorphic: admin / kayıtlı ziyaretçi / anonim misafir
          const isAdmin = msg.senderType === 'ADMIN'
          const isVisitor = msg.senderType === 'VISITOR'
          const isGuest = msg.senderType === 'GUEST'
          // GUEST'te senderId/visitorId null → "benim mesajım" yalnızca admin için anlamlı
          const isOwn =
            isAdmin && myUserId !== null && msg.senderId === myUserId
          const prev = groupMessages[idx - 1]
          const isGrouped =
            prev !== undefined &&
            prev.senderId === msg.senderId &&
            prev.senderType === msg.senderType &&
            !prev.deleted &&
            new Date(msg.createdAt).getTime() -
              new Date(prev.createdAt).getTime() <
              5 * 60 * 1000
          const isActive = activeId === msg.id
          const canDelete = isOwn && !msg.deleted
          // TC ban: GUEST/VISITOR mesajları banlanabilir (kendi/ADMIN hariç)
          const msgKey = banKey(msg.sessionId, msg.visitorId)
          const isBanned = msgKey !== null && bannedKeys.has(msgKey)
          const canBanThis =
            isTc && !isOwn && (isGuest || isVisitor) && msgKey !== null

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
                {/* Gönderen adı + rozet — kendi mesajında ve gruplanmış ilk mesajda göster */}
                {!isOwn && !isGrouped && (
                  <div className="mb-0.5 flex items-center gap-1.5 px-1">
                    {/* senderUsername daima düz metin (JSX escape) — stored-XSS engeli */}
                    <span
                      className={`text-xs font-medium ${
                        isDarkMode ? 'text-violet-300' : 'text-violet-600'
                      }`}
                    >
                      {msg.senderUsername || 'Misafir'}
                    </span>
                    {/* Polymorphic sender rozeti */}
                    {isAdmin && (
                      <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                        Admin
                      </span>
                    )}
                    {isVisitor && (
                      <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                        Ziyaretçi
                      </span>
                    )}
                    {isGuest && (
                      <span className="rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-medium text-orange-400">
                        Misafir
                      </span>
                    )}
                    {isBanned && (
                      <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-medium text-rose-400">
                        banlı
                      </span>
                    )}
                  </div>
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
                        : isVisitor
                          ? isDarkMode
                            ? 'rounded-bl-md bg-amber-900/30 text-amber-100'
                            : 'rounded-bl-md bg-amber-50 text-amber-900'
                          : isGuest
                            ? isDarkMode
                              ? 'rounded-bl-md bg-orange-900/30 text-orange-100'
                              : 'rounded-bl-md bg-orange-50 text-orange-900'
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

                  {/* Hover delete */}
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

                  {/* Moderasyon (ban/unban) — TC, chat:manage, GUEST/VISITOR */}
                  {canBanThis && canManageBans && (
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setBanMenuId(prev =>
                            prev === msg.id ? null : msg.id,
                          )
                        }
                        className={`rounded-full p-1 transition-opacity ${
                          isActive || banMenuId === msg.id
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        } ${
                          isDarkMode
                            ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            : 'bg-white text-gray-400 shadow-sm hover:bg-gray-100 hover:text-gray-700'
                        }`}
                        aria-label="Moderasyon menüsü"
                        title="Moderasyon"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>

                      {banMenuId === msg.id && (
                        <>
                          <button
                            type="button"
                            aria-label="Kapat"
                            onClick={() => setBanMenuId(null)}
                            className="fixed inset-0 z-10 cursor-default"
                          />
                          <div
                            className={`absolute left-0 top-7 z-20 w-36 overflow-hidden rounded-xl border shadow-xl ${
                              isDarkMode
                                ? 'border-slate-700 bg-slate-900'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            {isBanned ? (
                              <button
                                type="button"
                                disabled={banBusyId === msg.id}
                                onClick={() => handleUnban(msg)}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors disabled:opacity-50 ${
                                  isDarkMode
                                    ? 'text-emerald-400 hover:bg-slate-800'
                                    : 'text-emerald-600 hover:bg-gray-50'
                                }`}
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Ban kaldır
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={banBusyId === msg.id}
                                onClick={() => handleBan(msg)}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors disabled:opacity-50 ${
                                  isDarkMode
                                    ? 'text-rose-400 hover:bg-slate-800'
                                    : 'text-rose-600 hover:bg-gray-50'
                                }`}
                              >
                                <Ban className="h-3.5 w-3.5" />
                                Banla
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Zaman damgası */}
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
