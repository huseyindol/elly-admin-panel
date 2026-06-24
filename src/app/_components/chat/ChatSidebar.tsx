'use client'

import { useCallback, useEffect, useState } from 'react'
import { getMyGroupsService } from '@/app/_services/chat.services'
import { useChatWsStore } from '@/stores/chat-ws-store'
import { visibilityLabel, useMyRoleLevel } from '@/utils/chat-role'
import { useAdminTheme } from '@/app/_hooks'
import { getGlobalCookies } from '@/context/CookieContext'
import { CookieEnum } from '@/utils/constant/cookieConstant'
import type { ChatGroup } from '@/types/chat'
import {
  MessageSquare,
  Users,
  Plus,
  Lock,
  MessageCircle,
  Globe,
} from 'lucide-react'
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
  const myLevel = useMyRoleLevel()

  // Oturum tenant'ı — login'de set edilen `tenantId` cookie'si (HttpOnly değil).
  // AC=TC tek modelinde her grup bu tenant'ta yaşar; tek API çağrısı yeterli.
  const [sessionTenantId] = useState<string | null>(
    () => getGlobalCookies()[CookieEnum.TENANT_ID] || null,
  )

  const activeGroupId = useChatWsStore(s => s.activeGroupId)
  const connected = useChatWsStore(s => s.connected)
  const connectedSeq = useChatWsStore(s => s.connectedSeq)
  const subscribeToGroup = useChatWsStore(s => s.subscribeToGroup)
  const subscribeToAllGroups = useChatWsStore(s => s.subscribeToAllGroups)
  const clearUnread = useChatWsStore(s => s.clearUnread)
  const newGroupSignal = useChatWsStore(s => s.newGroupSignal)
  const newGroupSeq = useChatWsStore(s => s.newGroupSeq)
  const deletedGroupSignal = useChatWsStore(s => s.deletedGroupSignal)
  const membershipJoinedSignal = useChatWsStore(s => s.membershipJoinedSignal)
  const membershipJoinedSeq = useChatWsStore(s => s.membershipJoinedSeq)
  const membershipRemovedSignal = useChatWsStore(s => s.membershipRemovedSignal)
  const membershipRemovedSeq = useChatWsStore(s => s.membershipRemovedSeq)
  const unreadCounts = useChatWsStore(s => s.unreadCounts)

  const upsertGroupInList = useCallback((group: ChatGroup) => {
    setGroups(prev =>
      prev.some(g => g.id === group.id) ? prev : [group, ...prev],
    )
  }, [])

  // Tek grup yükleyici — AC=TC, daima tenant URL'inden (/api/v1/chat/tenant/{tid}/groups).
  // sessionTenantId yoksa (cookie eksik / login bozuk) sessizce çıkarız.
  const refetchGroups = useCallback(() => {
    if (!sessionTenantId) return
    getMyGroupsService(sessionTenantId)
      .then(setGroups)
      .catch(() => {})
  }, [sessionTenantId])

  useEffect(() => {
    refetchGroups()
  }, [refetchGroups, refreshToken])

  // Tek abonelik kaynağı — bağlantı kurulu ve grup listesi doluyken tüm
  // gruplara mesaj sub'ı at. Fetch'ten ayrı olduğu için fetch'i tetiklemez.
  // connectedSeq: WS her (yeniden) bağlandığında artar → `connected` zaten
  // true kalmış olsa bile abonelikler yeniden kurulur (mesajlar canlı gelir).
  useEffect(() => {
    if (connected && groups.length > 0) {
      subscribeToAllGroups(groups, myLevel)
    }
  }, [connected, connectedSeq, groups, myLevel, subscribeToAllGroups])

  // Yeni grup sinyali (/topic/groups/new — herkese yayın)
  useEffect(() => {
    if (newGroupSeq === 0 || !newGroupSignal) return
    const signal = newGroupSignal

    // visibilityLevel yüksek gruplar davetli üyelere yine de görünmeli — API kaynağı doğru
    if (signal.visibilityLevel > myLevel) {
      refetchGroups()
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- WS new group signal
    upsertGroupInList(signal)
  }, [newGroupSeq, newGroupSignal, myLevel, refetchGroups, upsertGroupInList])

  // Davet / tekrar dahil olma sinyali — üye olduğu için visibility filtresi YOK
  useEffect(() => {
    if (membershipJoinedSeq === 0 || !membershipJoinedSignal) return
    const event = membershipJoinedSignal
    const group = event.group
    if (group) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- WS invite signal
      upsertGroupInList(group)
      return
    }
    refetchGroups()
  }, [
    membershipJoinedSeq,
    membershipJoinedSignal,
    refetchGroups,
    upsertGroupInList,
  ])

  // Gruptan çıkarılma — aktif grup değilse sidebar'dan kaldır
  useEffect(() => {
    if (membershipRemovedSeq === 0 || !membershipRemovedSignal) return
    const event = membershipRemovedSignal
    if (event.groupId === activeGroupId) return
    if (!groups.some(g => g.id === event.groupId)) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGroups(groups.filter(g => g.id !== event.groupId))
  }, [membershipRemovedSeq, membershipRemovedSignal, activeGroupId, groups])

  // Silinen grup sinyali
  useEffect(() => {
    if (!deletedGroupSignal) return
    const deletedId = deletedGroupSignal
    useChatWsStore.setState({ deletedGroupSignal: null })
    if (!groups.some(g => g.id === deletedId)) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGroups(groups.filter(g => g.id !== deletedId))
    if (activeGroupId === deletedId) {
      useChatWsStore.getState().unsubscribeFromGroup()
    }
  }, [deletedGroupSignal, activeGroupId, groups])

  const handleGroupClick = (group: ChatGroup) => {
    subscribeToGroup(group.id, group.tenantId)
    clearUnread(group.id)
    onGroupSelect?.()
  }

  // AC=TC tek model: tüm gruplar aynı tenant'ta — filtre/tab yok, doğrudan göster.
  const visibleGroups = groups

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
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

      {/* Group List */}
      <div className="flex-1 overflow-y-auto">
        {visibleGroups.length === 0 && (
          <p
            className={`px-4 py-6 text-center text-sm ${
              isDarkMode ? 'text-slate-500' : 'text-gray-400'
            }`}
          >
            Henüz konuşma yok
          </p>
        )}

        {visibleGroups.map(group => {
          const unread = unreadCounts[group.id] ?? 0
          const isActive = activeGroupId === group.id
          const isTc = group.tenantId !== null

          return (
            <button
              key={group.id}
              type="button"
              onClick={() => handleGroupClick(group)}
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

              {/* Unread badge */}
              {unread > 0 && !isActive && (
                <span
                  className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-violet-500 px-1.5 text-[10px] font-semibold text-white"
                  aria-label={`${unread} okunmamış mesaj`}
                >
                  {unread > 99 ? '99+' : unread}
                </span>
              )}

              {/* Rozet — unread varsa gösterme */}
              {unread === 0 && (
                <span className="shrink-0">
                  {isTc ? (
                    // TC: tenant adı + ziyaretçi işareti
                    <span className="flex items-center gap-1">
                      <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                        {group.tenantId}
                      </span>
                      {group.visitorAccess && (
                        <span title="Ziyaretçilere açık">
                          <Globe className="h-3 w-3 text-amber-400" />
                        </span>
                      )}
                    </span>
                  ) : group.type !== 'DM' ? (
                    // AC: görünürlük rozeti veya kilit
                    group.visibilityLevel >= 4 ? (
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
                    )
                  ) : null}
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
        onCreated={g => upsertGroupInList(g)}
      />

      <DmDialog
        isOpen={showDm}
        onClose={() => setShowDm(false)}
        onCreated={g => upsertGroupInList(g)}
      />
    </div>
  )
}
