'use client'

import { useEffect, useState } from 'react'
import {
  getMembersService,
  removeMemberService,
} from '@/app/_services/chat.services'
import { useAdminTheme } from '@/app/_hooks'
import { PermissionGate } from '@/components/PermissionGate'
import type { ChatMember } from '@/types/chat'

interface Props {
  groupId: string
}

export function ChatMemberList({ groupId }: Props) {
  const { isDarkMode } = useAdminTheme()
  const [members, setMembers] = useState<ChatMember[]>([])

  useEffect(() => {
    getMembersService(groupId)
      .then(setMembers)
      .catch(() => {})
  }, [groupId])

  const handleRemove = async (userId: number) => {
    await removeMemberService(groupId, userId)
    setMembers(prev => prev.filter(m => m.userId !== userId))
  }

  return (
    <div className="space-y-2 p-4">
      {members.map(member => (
        <div
          key={member.userId}
          className="flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}
            >
              {member.username}
            </span>
            {member.role === 'OWNER' && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  isDarkMode
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'bg-violet-50 text-violet-600'
                }`}
              >
                Sahip
              </span>
            )}
          </div>
          <PermissionGate permission="chat:manage">
            {member.role !== 'OWNER' && (
              <button
                type="button"
                onClick={() => handleRemove(member.userId)}
                className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                  isDarkMode
                    ? 'text-rose-400 hover:bg-rose-500/10'
                    : 'text-rose-600 hover:bg-rose-50'
                }`}
              >
                Çıkar
              </button>
            )}
          </PermissionGate>
        </div>
      ))}
      {members.length === 0 && (
        <p
          className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
        >
          Üye bulunamadı.
        </p>
      )}
    </div>
  )
}
