'use client'

import { useChatWsStore } from '@/stores/chat-ws-store'

interface Props {
  groupId: string
}

export function ChatTypingIndicator({ groupId }: Props) {
  const typingSet = useChatWsStore(s => s.typingUsers[groupId])
  const typingUsers = [...(typingSet ?? [])]

  if (typingUsers.length === 0) return null

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} yazıyor...`
      : `${typingUsers.length} kişi yazıyor...`

  return <p className="animate-pulse text-xs italic text-slate-400">{label}</p>
}
