'use client'

import { useEffect, useState } from 'react'
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
import { getMyRoleLevel, getMyUserId } from '@/utils/chat-role'
import { useAdminTheme } from '@/app/_hooks'
import type { ChatGroup } from '@/types/chat'
import { AlertCircle, Users, Trash2 } from 'lucide-react'

export default function ChatPage() {
  useChatConnection()

  const { isDarkMode } = useAdminTheme()
  const activeGroupId = useChatWsStore(s => s.activeGroupId)
  const connected = useChatWsStore(s => s.connected)
  const unsubscribeFromGroup = useChatWsStore(s => s.unsubscribeFromGroup)
  const [showMembers, setShowMembers] = useState(false)
  const [showDeleteGroup, setShowDeleteGroup] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null)

  // Grup değiştiğinde detayları çek; silme yetkisini belirlemek için gerekli
  useEffect(() => {
    if (!activeGroupId) {
      setActiveGroup(null)
      return
    }
    getGroupService(activeGroupId)
      .then(setActiveGroup)
      .catch(() => {})
  }, [activeGroupId])

  const myId = getMyUserId()
  const myLevel = getMyRoleLevel()
  const canDeleteGroup =
    activeGroup !== null &&
    (myLevel >= 4 || (myId !== null && myId === activeGroup.createdBy))

  const handleDeleteGroup = async () => {
    if (!activeGroupId) return
    setDeletingGroup(true)
    try {
      await deleteGroupService(activeGroupId)
      unsubscribeFromGroup()
      setShowMembers(false)
      setShowDeleteGroup(false)
      // Sidebar'ı yenile
      setRefreshToken(t => t + 1)
    } catch {
      // backend 403 vb. — sessizce kapat
    } finally {
      setDeletingGroup(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sol sidebar — grup listesi */}
      <aside
        className={`flex w-64 shrink-0 flex-col border-r ${
          isDarkMode ? 'border-slate-800/50' : 'border-gray-200'
        }`}
      >
        <ChatSidebar refreshToken={refreshToken} />
      </aside>

      {/* Ana chat alanı */}
      <main className="flex min-w-0 flex-1 flex-col">
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
              className={`flex items-center justify-end gap-2 border-b px-4 py-2 ${
                isDarkMode ? 'border-slate-800/50' : 'border-gray-200'
              }`}
            >
              {/* Üye listesi toggle */}
              <button
                type="button"
                onClick={() => setShowMembers(v => !v)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  showMembers
                    ? isDarkMode
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'bg-violet-50 text-violet-600'
                    : isDarkMode
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Üyeler
              </button>

              {/* Grubu sil — sadece grup sahibi veya SUPER_ADMIN */}
              {canDeleteGroup && (
                <button
                  type="button"
                  onClick={() => setShowDeleteGroup(true)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isDarkMode
                      ? 'text-rose-400 hover:bg-rose-500/10'
                      : 'text-rose-500 hover:bg-rose-50'
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Grubu Sil
                </button>
              )}
            </div>

            <div className="flex min-h-0 flex-1">
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-hidden">
                  <ChatWindow groupId={activeGroupId} />
                </div>
                <div className="px-4 py-1">
                  <ChatTypingIndicator groupId={activeGroupId} />
                </div>
                <div
                  className={`border-t p-4 ${isDarkMode ? 'border-slate-800/50' : 'border-gray-200'}`}
                >
                  <ChatInput groupId={activeGroupId} />
                </div>
              </div>

              {showMembers && (
                <aside
                  className={`w-72 shrink-0 border-l ${
                    isDarkMode ? 'border-slate-800/50' : 'border-gray-200'
                  }`}
                >
                  <ChatMemberList groupId={activeGroupId} />
                </aside>
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
