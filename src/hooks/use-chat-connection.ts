'use client'

import { useEffect } from 'react'
import { useChatWsStore } from '@/stores/chat-ws-store'

export function useChatConnection() {
  const connect = useChatWsStore(s => s.connect)
  const disconnect = useChatWsStore(s => s.disconnect)

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])
}
