'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useChatConnection } from '@/hooks/use-chat-connection'
import { ChatSidebar } from '@/app/_components/chat/ChatSidebar'
import { ChatWindow } from '@/app/_components/chat/ChatWindow'
import { ChatInput } from '@/app/_components/chat/ChatInput'
import { ChatTypingIndicator } from '@/app/_components/chat/ChatTypingIndicator'
import { ChatMemberList } from '@/app/_components/chat/ChatMemberList'
import { ConfirmDialog } from '@/app/_components'
import { useChatWsStore } from '@/stores/chat-ws-store'
import {
  deleteGroupService,
  getGroupService,
} from '@/app/_services/chat.services'
import { useChatGroupAccess, chatKeys } from '@/app/_hooks/useChatGroupAccess'
import { useMyRoleLevel } from '@/utils/chat-role'
import { useMyUserId } from '@/stores/user-store'
import { useAdminTheme } from '@/app/_hooks'
import type { ChatGroup } from '@/types/chat'
import { AlertCircle, Users, Trash2, ChevronLeft, X } from 'lucide-react'
import { toast } from 'sonner'

export default function ChatPage() {
  useChatConnection()

  const { isDarkMode } = useAdminTheme()
  const activeGroupId = useChatWsStore(s => s.activeGroupId)
  const activeGroupTenantId = useChatWsStore(s => s.activeGroupTenantId)
  const connected = useChatWsStore(s => s.connected)
  const unsubscribeFromGroup = useChatWsStore(s => s.unsubscribeFromGroup)
  const membershipJoinedSignal = useChatWsStore(s => s.membershipJoinedSignal)
  const membershipJoinedSeq = useChatWsStore(s => s.membershipJoinedSeq)
  const membershipRemovedSignal = useChatWsStore(s => s.membershipRemovedSignal)
  const membershipRemovedSeq = useChatWsStore(s => s.membershipRemovedSeq)
  const chatErrorSignal = useChatWsStore(s => s.chatErrorSignal)
  const chatErrorSeq = useChatWsStore(s => s.chatErrorSeq)
  const queryClient = useQueryClient()
  const [showMembers, setShowMembers] = useState(false)
  const [showDeleteGroup, setShowDeleteGroup] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null)
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar')
  const [membershipBannerByGroup, setMembershipBannerByGroup] = useState<{
    groupId: string
    message: string
  } | null>(null)
  const myLevel = useMyRoleLevel()
  const myUserId = useMyUserId()

  const { data: access, refetch: refetchAccess } = useChatGroupAccess(
    activeGroupId,
    activeGroupTenantId,
  )
  const canWrite = access?.canWrite ?? false
  const accessBanner = access?.denialMessage ?? null
  const membershipBanner =
    membershipBannerByGroup?.groupId === activeGroupId
      ? membershipBannerByGroup.message
      : null
  const composerBanner = membershipBanner ?? accessBanner

  useEffect(() => {
    if (!activeGroupId) return
    getGroupService(activeGroupId, activeGroupTenantId)
      .then(setActiveGroup)
      .catch(() => {})
  }, [activeGroupId, activeGroupTenantId])

  useEffect(() => {
    if (membershipJoinedSeq === 0 || !membershipJoinedSignal) return
    const event = membershipJoinedSignal
    if (event.groupId === activeGroupId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- WS membership signal
      setMembershipBannerByGroup({
        groupId: event.groupId,
        message: event.message,
      })
    }
    void queryClient.invalidateQueries({
      queryKey: chatKeys.access(event.groupId),
    })
  }, [membershipJoinedSeq, membershipJoinedSignal, activeGroupId, queryClient])

  useEffect(() => {
    if (membershipRemovedSeq === 0 || !membershipRemovedSignal) return
    const event = membershipRemovedSignal
    if (event.groupId !== activeGroupId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- WS membership signal
    setMembershipBannerByGroup({
      groupId: event.groupId,
      message: event.message,
    })
    void queryClient.invalidateQueries({
      queryKey: chatKeys.access(event.groupId),
    })
  }, [
    membershipRemovedSeq,
    membershipRemovedSignal,
    activeGroupId,
    queryClient,
  ])

  useEffect(() => {
    if (chatErrorSeq === 0 || !chatErrorSignal) return
    const err = chatErrorSignal
    if (err.groupId && err.groupId !== activeGroupId) return
    toast.error(err.message)
    const bannerGroupId = err.groupId ?? activeGroupId
    if (bannerGroupId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- WS error signal
      setMembershipBannerByGroup({
        groupId: bannerGroupId,
        message: err.message,
      })
    }
    if (err.groupId) {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.access(err.groupId),
      })
    }
  }, [chatErrorSeq, chatErrorSignal, activeGroupId, queryClient])

  const isOwner =
    activeGroup !== null &&
    activeGroup.id === activeGroupId &&
    myUserId !== null &&
    activeGroup.createdBy === myUserId
  const canDeleteGroup = activeGroupId !== null && (myLevel >= 4 || isOwner)

  const handleDeleteGroup = async () => {
    if (!activeGroupId) return
    setDeletingGroup(true)
    try {
      await deleteGroupService(activeGroupId, activeGroupTenantId)
      unsubscribeFromGroup()
      setShowMembers(false)
      setShowDeleteGroup(false)
      setRefreshToken(t => t + 1)
      setMobileView('sidebar')
    } catch {
      // backend 403 vb. — sessizce kapat
    } finally {
      setDeletingGroup(false)
    }
  }

  const groupName = activeGroup?.name ?? 'DM'

  return (
    <div className="flex h-[calc(100dvh-64px)] overflow-hidden">
      {/* Sol sidebar — mobil: tam ekran, desktop: sabit genişlik */}
      <aside
        className={`flex-col border-r ${isDarkMode ? 'border-slate-800/50' : 'border-gray-200'} ${mobileView === 'sidebar' ? 'flex' : 'hidden'} w-full md:flex md:w-64 md:shrink-0`}
      >
        <ChatSidebar
          refreshToken={refreshToken}
          onGroupSelect={() => setMobileView('chat')}
        />
      </aside>

      {/* Ana chat alanı — mobil: tam ekran, desktop: kalan alan */}
      <main
        className={`min-w-0 flex-1 flex-col ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'} `}
      >
        {/* Bağlantı kesildi uyarısı */}
        {!connected && (
          <div className="flex items-center gap-2 border-b border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Bağlantı kesildi. Yeniden bağlanılıyor...</span>
          </div>
        )}

        {activeGroupId ? (
          <>
            {/* Araç çubuğu */}
            <div
              className={`flex items-center gap-1 border-b px-2 py-2 sm:gap-2 sm:px-3 ${
                isDarkMode ? 'border-slate-800/50' : 'border-gray-200'
              }`}
            >
              {/* Mobil geri butonu */}
              <button
                type="button"
                onClick={() => setMobileView('sidebar')}
                className={`shrink-0 rounded-lg p-1.5 transition-colors md:hidden ${
                  isDarkMode
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
                aria-label="Geri"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Grup adı — sadece mobil */}
              <span
                className={`flex-1 truncate text-sm font-semibold md:hidden ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {groupName}
              </span>

              {/* Desktop spacer */}
              <div className="hidden flex-1 md:block" />

              {/* Üye listesi toggle */}
              <button
                type="button"
                onClick={() => setShowMembers(v => !v)}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 ${
                  showMembers
                    ? isDarkMode
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'bg-violet-50 text-violet-600'
                    : isDarkMode
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Üyeler</span>
              </button>

              {/* Grubu sil — sadece yetkili */}
              {canDeleteGroup && (
                <button
                  type="button"
                  onClick={() => setShowDeleteGroup(true)}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 ${
                    isDarkMode
                      ? 'text-rose-400 hover:bg-rose-500/10'
                      : 'text-rose-500 hover:bg-rose-50'
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Grubu Sil</span>
                </button>
              )}
            </div>

            {/* Mesaj alanı + üye paneli */}
            <div className="relative flex min-h-0 flex-1">
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-hidden">
                  <ChatWindow groupId={activeGroupId} />
                </div>
                <div className="px-4 py-1">
                  <ChatTypingIndicator groupId={activeGroupId} />
                </div>
                <div
                  className={`border-t p-3 sm:p-4 ${isDarkMode ? 'border-slate-800/50' : 'border-gray-200'}`}
                >
                  <ChatInput
                    groupId={activeGroupId}
                    tenantId={activeGroupTenantId}
                    canWrite={canWrite}
                    banner={composerBanner}
                    onWriteForbidden={message => {
                      if (activeGroupId) {
                        setMembershipBannerByGroup({
                          groupId: activeGroupId,
                          message,
                        })
                      }
                      void refetchAccess()
                    }}
                  />
                </div>
              </div>

              {/* Üye paneli — mobil: overlay, desktop: sabit kenar */}
              {showMembers && (
                <>
                  {/* Mobil backdrop */}
                  <div
                    className="absolute inset-0 z-10 bg-black/50 md:hidden"
                    onClick={() => setShowMembers(false)}
                  />
                  <aside
                    className={`absolute inset-y-0 right-0 z-20 w-4/5 max-w-xs shrink-0 border-l md:relative md:inset-auto md:z-auto md:w-72 ${isDarkMode ? 'border-slate-800/50 bg-slate-950' : 'border-gray-200 bg-white'} `}
                  >
                    {/* Mobil kapat butonu */}
                    <button
                      type="button"
                      onClick={() => setShowMembers(false)}
                      className={`absolute right-3 top-3 z-10 rounded-lg p-1 transition-colors md:hidden ${
                        isDarkMode
                          ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                      aria-label="Kapat"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <ChatMemberList groupId={activeGroupId} />
                  </aside>
                </>
              )}
            </div>
          </>
        ) : (
          <div
            className={`flex flex-1 items-center justify-center text-sm ${
              isDarkMode ? 'text-slate-500' : 'text-gray-400'
            }`}
          >
            Soldaki listeden bir konuşma seçin
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={showDeleteGroup}
        onClose={() => setShowDeleteGroup(false)}
        onConfirm={handleDeleteGroup}
        title="Grubu Sil"
        message="Bu grup kalıcı olarak silinecek ve tüm mesajlar kaybolacak. Devam etmek istiyor musunuz?"
        confirmText="Evet, Sil"
        variant="danger"
        isLoading={deletingGroup}
      />
    </div>
  )
}
