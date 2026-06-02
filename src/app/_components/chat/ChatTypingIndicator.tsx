'use client'

import { useChatWsStore } from '@/stores/chat-ws-store'
import { useMyUserId } from '@/stores/user-store'

interface Props {
  groupId: string
}

export function ChatTypingIndicator({ groupId }: Props) {
  const typingMap = useChatWsStore(s => s.typingUsers[groupId])
  const myUserId = useMyUserId()
  // userId → username map'inden, kendini (userId ile) çıkararak isimleri al
  const typingUsers = [...(typingMap?.entries() ?? [])]
    .filter(([userId]) => userId !== myUserId)
    .map(([, username]) => username)

  if (typingUsers.length === 0) return null

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} yazıyor...`
      : `${typingUsers.length} kişi yazıyor...`

  return <p className="animate-pulse text-xs italic text-slate-400">{label}</p>
}
