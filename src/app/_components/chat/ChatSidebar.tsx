'use client'

import { useEffect, useState } from 'react'
import { getMyGroupsService } from '@/app/_services/chat.services'
import { useChatWsStore } from '@/stores/chat-ws-store'
import { visibilityLabel } from '@/utils/chat-role'
import { useAdminTheme } from '@/app/_hooks'
import type { ChatGroup } from '@/types/chat'
import { MessageSquare, Users, Plus, Lock } from 'lucide-react'
import { CreateGroupDialog } from './CreateGroupDialog'

export function ChatSidebar() {
  const { isDarkMode } = useAdminTheme()
  const [groups, setGroups] = useState<ChatGroup[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const { activeGroupId, subscribeToGroup } = useChatWsStore()

  useEffect(() => {
    getMyGroupsService()
      .then(setGroups)
      .catch(() => {})
  }, [])

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
        <button
          type="button"
          onClick={() => setShowCreate(true)}
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
        {groups.map(group => (
          <button
            key={group.id}
            type="button"
            onClick={() => subscribeToGroup(group.id)}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
              activeGroupId === group.id
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
            <span className="flex-1 truncate text-sm">
              {group.name ?? 'DM'}
            </span>
            {group.type !== 'DM' && (
              <span
                title={visibilityLabel(group.visibilityLevel)}
                className="shrink-0"
              >
                {group.visibilityLevel >= 4 ? (
                  <Lock className="h-3 w-3 text-muted-foreground opacity-60" />
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
            {activeGroupId === group.id && (
              <span className="ml-1 h-2 w-2 shrink-0 rounded-full bg-violet-400" />
            )}
          </button>
        ))}
      </div>

      <CreateGroupDialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={g => setGroups(prev => [g, ...prev])}
      />
    </div>
  )
}
