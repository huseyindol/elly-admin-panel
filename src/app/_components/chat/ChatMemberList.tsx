'use client'

import { useEffect, useState } from 'react'
import {
  getMembersService,
  removeMemberService,
  addMemberService,
} from '@/app/_services/chat.services'
import { getMyRoleLevel, canInvite } from '@/utils/chat-role'
import { useAdminTheme } from '@/app/_hooks'
import { PermissionGate } from '@/components/PermissionGate'
import type { ChatMember, RoleLevel } from '@/types/chat'

const ROLE_LEVELS: Record<string, RoleLevel> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
}

interface Props {
  groupId: string
}

export function ChatMemberList({ groupId }: Props) {
  const { isDarkMode } = useAdminTheme()
  const [members, setMembers] = useState<ChatMember[]>([])
  const [inviteUserId, setInviteUserId] = useState('')
  const [inviting, setInviting] = useState(false)
  const [myLevel, setMyLevel] = useState<RoleLevel>(1)

  useEffect(() => {
    getMembersService(groupId)
      .then(setMembers)
      .catch(() => {})
  }, [groupId])

  useEffect(() => {
    getMyRoleLevel().then(setMyLevel)
  }, [])

  const handleRemove = async (userId: number) => {
    await removeMemberService(groupId, userId)
    setMembers(prev => prev.filter(m => m.userId !== userId))
  }

  const handleInvite = async () => {
    const userId = Number(inviteUserId)
    if (!userId) return
    setInviting(true)
    try {
      const member = await addMemberService(groupId, userId)
      setMembers(prev => [...prev, member])
      setInviteUserId('')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Davet başarısız')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Başlık */}
      <div
        className={`border-b px-4 py-3 ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200'}`}
      >
        <span
          className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          Üyeler ({members.length})
        </span>
      </div>

      {/* Üye listesi */}
      <div className="flex-1 overflow-y-auto p-3">
        {members.length === 0 && (
          <p
            className={`py-4 text-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
          >
            Üye bulunamadı.
          </p>
        )}
        <div className="space-y-1">
          {members.map(member => {
            const memberLevel = ROLE_LEVELS[member.role] ?? 1
            return (
              <div
                key={member.userId}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    className={`truncate text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}
                  >
                    {member.username}
                  </span>
                  {member.role === 'OWNER' && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
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
                  {member.role !== 'OWNER' &&
                    canInvite(myLevel, memberLevel as RoleLevel) && (
                      <button
                        type="button"
                        onClick={() => handleRemove(member.userId)}
                        className={`ml-2 shrink-0 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
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
            )
          })}
        </div>
      </div>

      {/* Davet formu — sadece chat:manage yetkisi olanlar görür */}
      <PermissionGate permission="chat:manage">
        <div
          className={`border-t p-3 ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200'}`}
        >
          <p
            className={`mb-2 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
          >
            {myLevel < 4
              ? 'Kendi rol seviyenizden düşük kullanıcıları davet edebilirsiniz.'
              : 'SUPER_ADMIN olarak herkesi davet edebilirsiniz.'}
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Kullanıcı ID"
              value={inviteUserId}
              onChange={e => setInviteUserId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              className={`min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/30 ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500'
                  : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400'
              }`}
            />
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviting || !inviteUserId}
              className="shrink-0 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-600 disabled:opacity-50"
            >
              {inviting ? '...' : 'Davet'}
            </button>
          </div>
        </div>
      </PermissionGate>
    </div>
  )
}
