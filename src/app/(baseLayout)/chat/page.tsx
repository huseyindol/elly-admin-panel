'use client'

import { useChatConnection } from '@/hooks/use-chat-connection'
import { ChatSidebar } from '@/app/_components/chat/ChatSidebar'
import { ChatWindow } from '@/app/_components/chat/ChatWindow'
import { ChatInput } from '@/app/_components/chat/ChatInput'
import { ChatTypingIndicator } from '@/app/_components/chat/ChatTypingIndicator'
import { useChatWsStore } from '@/stores/chat-ws-store'
import { useAdminTheme } from '@/app/_hooks'
import { AlertCircle } from 'lucide-react'

export default function ChatPage() {
  useChatConnection()

  const { isDarkMode } = useAdminTheme()
  const activeGroupId = useChatWsStore(s => s.activeGroupId)
  const connected = useChatWsStore(s => s.connected)

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sol sidebar — grup listesi */}
      <aside
        className={`flex w-72 shrink-0 flex-col border-r ${
          isDarkMode ? 'border-slate-800/50' : 'border-gray-200'
        }`}
      >
        <ChatSidebar />
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
    </div>
  )
}
