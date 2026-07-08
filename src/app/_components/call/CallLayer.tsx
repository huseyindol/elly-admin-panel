'use client'

import { useEffect } from 'react'
import { useChatWsStore } from '@/stores/chat-ws-store'
import { useCallStore } from '@/stores/call-store'
import { IncomingCallModal } from './IncomingCallModal'
import { CallWindow } from './CallWindow'

/**
 * WebRTC çağrı katmanı — BaseAdminLayout'ta mount edilir (WS her sayfada açık → çağrı yakalanır).
 * chat-ws-store'daki rtcSignal'i call-store'a köprüler (notification bridge pattern'i) ve
 * faz'a göre gelen çağrı modalını / görüşme penceresini render eder.
 */
export function CallLayer() {
  const rtcSeq = useChatWsStore(s => s.rtcSeq)
  const phase = useCallStore(s => s.phase)

  useEffect(() => {
    if (rtcSeq === 0) return
    const sig = useChatWsStore.getState().rtcSignal
    if (sig) useCallStore.getState().handleSignal(sig)
  }, [rtcSeq])

  return (
    <>
      {phase === 'incoming' && <IncomingCallModal />}
      {(phase === 'outgoing' || phase === 'active') && <CallWindow />}
    </>
  )
}
