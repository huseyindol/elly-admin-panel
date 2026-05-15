'use client'

import { useChatWsStore } from '@/stores/chat-ws-store'

interface Props {
  userId: number
}

export function PresenceIndicator({ userId }: Props) {
  const status = useChatWsStore(s => s.presence[userId])

  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        status === 'ONLINE' ? 'bg-emerald-500' : 'bg-gray-400'
      }`}
    />
  )
}
