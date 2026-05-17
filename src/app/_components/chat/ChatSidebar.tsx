'use client'

import { useEffect, useState } from 'react'
import { getMyGroupsService } from '@/app/_services/chat.services'
import { useChatWsStore } from '@/stores/chat-ws-store'
import { visibilityLabel, getMyRoleLevel } from '@/utils/chat-role'
import { useAdminTheme } from '@/app/_hooks'
import type { ChatGroup, RoleLevel } from '@/types/chat'
import { MessageSquare, Users, Plus, Lock, MessageCircle } from 'lucide-react'
import { CreateGroupDialog } from './CreateGroupDialog'
import { DmDialog } from './DmDialog'

interface Props {
  refreshToken?: number
  onGroupSelect?: () => void
}

export function ChatSidebar({ refreshToken, onGroupSelect }: Props) {
  const { isDarkMode } = useAdminTheme()
  const [groups, setGroups] = useState<ChatGroup[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showDm, setShowDm] = useState(false)
  const [myLevel, setMyLevel] = useState<RoleLevel>(1)

  const activeGroupId = useChatWsStore(s => s.activeGroupId)
  const connected = useChatWsStore(s => s.connected)
  const subscribeToGroup = useChatWsStore(s => s.subscribeToGroup)
  const subscribeToAllGroups = useChatWsStore(s => s.subscribeToAllGroups)
  const clearUnread = useChatWsStore(s => s.clearUnread)
  const newGroupSignal = useChatWsStore(s => s.newGroupSignal)
  const deletedGroupSignal = useChatWsStore(s => s.deletedGroupSignal)
  const invitedGroupSignal = useChatWsStore(s => s.invitedGroupSignal)
  const unreadCounts = useChatWsStore(s => s.unreadCounts)

  // Rol seviyesini çek
  useEffect(() => {
    getMyRoleLevel().then(setMyLevel)
  }, [])

  // Grupları yükle ve tüm gruplara mesaj sub'ı at
  useEffect(() => {
    getMyGroupsService()
      .then(g => {
        setGroups(g)
        if (connected) subscribeToAllGroups(g, myLevel)
      })
      .catch(() => {})
  }, [connected, refreshToken, myLevel, subscribeToAllGroups])

  // Yeni grup sinyalini dinle — yetki kontrolünden geçenleri sidebar'a ekle
  useEffect(() => {
    if (!newGroupSignal) return

    const signal = newGroupSignal
    // İşlendi olarak işaretle — bir sonraki bildirimi yakalayabilelim
    useChatWsStore.setState({ newGroupSignal: null })

    if (signal.visibilityLevel > myLevel) return
    if (groups.some(g => g.id === signal.id)) return

    const next = [signal, ...groups]
    // eslint-disable-next-line react-hooks/set-state-in-effect -- consuming a one-shot WS signal
    setGroups(next)
    if (connected) subscribeToAllGroups(next, myLevel)
  }, [newGroupSignal, myLevel, connected, groups, subscribeToAllGroups])

  // Davet sinyali — bir gruba dahil edildiğimde sidebar'a ekle
  // (newGroupSignal'den farkı: kişisel topic'ten gelir, visibilityLevel
  // kontrolüne gerek yok — davet zaten yetki demektir)
  useEffect(() => {
    if (!invitedGroupSignal) return

    const signal = invitedGroupSignal
    useChatWsStore.setState({ invitedGroupSignal: null })

    if (groups.some(g => g.id === signal.id)) return

    const next = [signal, ...groups]
    // eslint-disable-next-line react-hooks/set-state-in-effect -- consuming a one-shot WS signal
    setGroups(next)
    if (connected) subscribeToAllGroups(next, myLevel)
  }, [invitedGroupSignal, myLevel, connected, groups, subscribeToAllGroups])

  // Silinen grup sinyali — listeden çıkar + aktif gruba bakıyorsak paneli kapat
  useEffect(() => {
    if (!deletedGroupSignal) return

    const deletedId = deletedGroupSignal
    // İşlendi olarak işaretle
    useChatWsStore.setState({ deletedGroupSignal: null })

    if (!groups.some(g => g.id === deletedId)) return

    const next = groups.filter(g => g.id !== deletedId)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- consuming a one-shot WS signal
    setGroups(next)
    if (connected) subscribeToAllGroups(next, myLevel)
    if (activeGroupId === deletedId) {
      useChatWsStore.getState().unsubscribeFromGroup()
    }
  }, [
    deletedGroupSignal,
    activeGroupId,
    groups,
    connected,
    myLevel,
    subscribeToAllGroups,
  ])

  const handleGroupClick = (groupId: string) => {
    subscribeToGroup(groupId)
    clearUnread(groupId)
    onGroupSelect?.()
  }

  return (
    <div className="flex h-full flex-col">
      <div
        className={`flex items-center justify-between border-b px-4 py-3 ${
          isDarkMode ? 'border-slate-700/50' : 'border-gray-200'
        }`}
      >
        <span
          className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Konuşmalar
        </span>
        <div className="flex items-center gap-1">
          {/* DM başlat */}
          <button
            type="button"
            onClick={() => setShowDm(true)}
            title="Direkt mesaj başlat"
            className={`rounded-lg p-1.5 transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
            aria-label="DM başlat"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          {/* Yeni grup oluştur */}
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            title="Yeni grup oluştur"
            className={`rounded-lg p-1.5 transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
            aria-label="Yeni grup oluştur"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 && (
          <p
            className={`px-4 py-6 text-center text-sm ${
              isDarkMode ? 'text-slate-500' : 'text-gray-400'
            }`}
          >
            Henüz konuşma yok
          </p>
        )}
        {groups.map(group => {
          const unread = unreadCounts[group.id] ?? 0
          const isActive = activeGroupId === group.id
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => handleGroupClick(group.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive
                  ? isDarkMode
                    ? 'bg-violet-500/10 text-white'
                    : 'bg-violet-50 text-gray-900'
                  : isDarkMode
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {group.type === 'DM' ? (
                <Users className="h-4 w-4 shrink-0" />
              ) : (
                <MessageSquare className="h-4 w-4 shrink-0" />
              )}
              <span
                className={`min-w-0 flex-1 truncate text-sm ${
                  unread > 0 && !isActive ? 'font-semibold' : ''
                }`}
              >
                {group.name ?? 'DM'}
              </span>

              {/* Unread badge — aktif grup için göstermez */}
              {unread > 0 && !isActive && (
                <span
                  className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-violet-500 px-1.5 text-[10px] font-semibold text-white"
                  aria-label={`${unread} okunmamış mesaj`}
                >
                  {unread > 99 ? '99+' : unread}
                </span>
              )}

              {/* Görünürlük rozeti / kilit — sadece grup */}
              {group.type !== 'DM' && unread === 0 && (
                <span
                  title={visibilityLabel(group.visibilityLevel)}
                  className="shrink-0"
                >
                  {group.visibilityLevel >= 4 ? (
                    <Lock className="h-3 w-3 opacity-50" />
                  ) : (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        isDarkMode
                          ? 'bg-slate-700 text-slate-400'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {visibilityLabel(group.visibilityLevel)}
                    </span>
                  )}
                </span>
              )}

              {isActive && (
                <span className="ml-1 h-2 w-2 shrink-0 rounded-full bg-violet-400" />
              )}
            </button>
          )
        })}
      </div>

      <CreateGroupDialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={g => setGroups(prev => [g, ...prev])}
      />

      <DmDialog
        isOpen={showDm}
        onClose={() => setShowDm(false)}
        onCreated={g => {
          setGroups(prev => {
            // DM zaten listede varsa tekrar ekleme
            if (prev.some(existing => existing.id === g.id)) return prev
            return [g, ...prev]
          })
        }}
      />
    </div>
  )
}
