import { create } from 'zustand'
import { toast } from 'sonner'
import { useChatWsStore } from '@/stores/chat-ws-store'
import type { CallPhase, CallSignal } from '@/types/call'

/**
 * WebRTC çağrı durum makinesi (zustand). Sinyalleşme PAYLAŞILAN STOMP client'ı
 * (chat-ws-store) üzerinden yapılır — ayrı WS bağlantısı YOK (presence'ı bozar).
 * Inbound SDP/ICE, useWebRTCCall'un tükettiği sdpSignal/iceSignal seq alanlarına yazılır.
 */
interface CallState {
  phase: CallPhase
  callId: string | null
  isCaller: boolean
  answering: boolean
  ringAll: boolean
  peerUserId: number | null
  peerName: string | null
  micOn: boolean
  camOn: boolean

  // useWebRTCCall köprüsü — seq artınca hook remote description / candidate uygular
  sdpSignal: { sdpType: string; sdp: string } | null
  sdpSeq: number
  iceSignal: {
    candidate: string
    sdpMid: string | null
    sdpMLineIndex: number | null
  } | null
  iceSeq: number

  startCall: (calleeUserId: number, peerName: string, groupId?: string) => void
  answer: () => void
  reject: () => void
  cancel: () => void
  hangup: () => void
  toggleMic: () => void
  toggleCam: () => void
  sendSdp: (sdpType: string, sdp: string) => void
  sendIce: (
    candidate: string,
    sdpMid: string | null,
    sdpMLineIndex: number | null,
  ) => void
  handleSignal: (signal: CallSignal) => void
  reset: () => void
}

function publish(destination: string, body?: unknown) {
  const client = useChatWsStore.getState().client
  if (!client?.connected) return
  client.publish({
    destination,
    body: body !== undefined ? JSON.stringify(body) : '',
  })
}

const IDLE = {
  phase: 'idle' as CallPhase,
  callId: null,
  isCaller: false,
  answering: false,
  ringAll: false,
  peerUserId: null,
  peerName: null,
  micOn: true,
  camOn: true,
  sdpSignal: null,
  sdpSeq: 0,
  iceSignal: null,
  iceSeq: 0,
}

export const useCallStore = create<CallState>((set, get) => ({
  ...IDLE,

  startCall: (calleeUserId, peerName, groupId) => {
    if (get().phase !== 'idle') {
      toast.info('Zaten bir görüşmedesiniz')
      return
    }
    // Paylaşılan chat WS bağlı değilse sinyal gönderilemez (sessiz "Aranıyor…"
    // takılması yerine net uyarı). Dev'de eski sekme /user/queue/rtc'ye abone
    // olmamış olabilir → sayfa yenileme çözer.
    if (!useChatWsStore.getState().client?.connected) {
      toast.error(
        'Sohbet bağlantısı kurulamadı — sayfayı yenileyip tekrar deneyin',
      )
      return
    }
    set({
      ...IDLE,
      phase: 'outgoing',
      isCaller: true,
      peerUserId: calleeUserId,
      peerName,
    })
    publish('/app/rtc/call', { calleeUserId, groupId })
  },

  answer: () => {
    const { callId, phase, answering } = get()
    if (!callId || phase !== 'incoming' || answering) return
    set({ answering: true })
    publish(`/app/rtc/${callId}/answer`)
    // phase='active' ANSWERED sinyaliyle set edilir
  },

  reject: () => {
    const { callId } = get()
    if (callId) publish(`/app/rtc/${callId}/reject`)
    get().reset()
  },

  cancel: () => {
    const { callId } = get()
    if (callId) publish(`/app/rtc/${callId}/cancel`)
    get().reset()
  },

  hangup: () => {
    const { callId } = get()
    if (callId) publish(`/app/rtc/${callId}/hangup`)
    get().reset()
  },

  toggleMic: () => set(s => ({ micOn: !s.micOn })),
  toggleCam: () => set(s => ({ camOn: !s.camOn })),

  sendSdp: (sdpType, sdp) => {
    const { callId } = get()
    if (callId) publish(`/app/rtc/${callId}/sdp`, { sdpType, sdp })
  },

  sendIce: (candidate, sdpMid, sdpMLineIndex) => {
    const { callId } = get()
    if (callId)
      publish(`/app/rtc/${callId}/ice`, { candidate, sdpMid, sdpMLineIndex })
  },

  handleSignal: signal => {
    if (
      signal.callId &&
      get().callId &&
      signal.callId !== get().callId &&
      signal.type !== 'INCOMING_CALL'
    ) {
      return
    }
    switch (signal.type) {
      case 'INCOMING_CALL': {
        if (!signal.callId || signal.callId === get().callId) return
        // Zaten bir görüşmedeyse yeni çağrıyı otomatik reddet (meşgul)
        if (get().phase !== 'idle') {
          publish(`/app/rtc/${signal.callId}/reject`)
          return
        }
        set({
          ...IDLE,
          phase: 'incoming',
          callId: signal.callId,
          isCaller: false,
          ringAll: !!signal.ringAll,
          peerUserId: signal.peerUserId ?? null,
          peerName: signal.peerDisplayName ?? null,
        })
        break
      }
      case 'RINGING':
        if (get().phase === 'outgoing' && !get().callId) {
          set({
            callId: signal.callId,
            peerUserId: signal.peerUserId ?? get().peerUserId,
            peerName: signal.peerDisplayName ?? get().peerName,
          })
        }
        break
      case 'ANSWERED': {
        const { phase, answering } = get()
        if (!signal.callId || phase === 'active') return
        if (phase === 'outgoing' || (phase === 'incoming' && answering)) {
          set({
            phase: 'active',
            callId: signal.callId,
            peerUserId: signal.peerUserId ?? get().peerUserId,
            peerName: signal.peerDisplayName ?? get().peerName,
          })
        } else if (phase === 'incoming') {
          // Aynı hesap başka bir cihazda (örn. mobil uygulamada) çağrıyı cevapladı.
          toast.info('Çağrı başka bir cihazınızda cevaplandı')
          get().reset()
        }
        break
      }
      case 'SDP':
        if (
          signal.sdpType &&
          signal.sdp &&
          (get().sdpSignal?.sdpType !== signal.sdpType ||
            get().sdpSignal?.sdp !== signal.sdp)
        ) {
          set(s => ({
            sdpSignal: { sdpType: signal.sdpType!, sdp: signal.sdp! },
            sdpSeq: s.sdpSeq + 1,
          }))
        }
        break
      case 'ICE':
        if (
          signal.candidate &&
          get().iceSignal?.candidate !== signal.candidate
        ) {
          set(s => ({
            iceSignal: {
              candidate: signal.candidate!,
              sdpMid: signal.sdpMid ?? null,
              sdpMLineIndex: signal.sdpMLineIndex ?? null,
            },
            iceSeq: s.iceSeq + 1,
          }))
        }
        break
      case 'CALL_TAKEN':
        if (get().phase === 'idle') return
        get().reset()
        break
      case 'REJECTED':
        if (get().phase === 'idle') return
        toast.info('Çağrı reddedildi')
        get().reset()
        break
      case 'CANCELLED':
        if (get().phase === 'idle') return
        get().reset()
        break
      case 'HANGUP':
        if (get().phase === 'idle') return
        get().reset()
        break
      case 'TIMEOUT':
        if (get().phase === 'idle') return
        toast.info('Cevap yok')
        get().reset()
        break
      case 'UNAVAILABLE':
        if (get().phase === 'idle') return
        toast.warning(signal.reason ?? 'Kullanıcı müsait değil')
        get().reset()
        break
      case 'BUSY':
        if (get().phase === 'idle') return
        toast.warning(signal.reason ?? 'Kullanıcı meşgul')
        get().reset()
        break
      case 'ERROR':
        if (get().phase === 'idle') return
        toast.error(signal.reason ?? 'Çağrı hatası')
        get().reset()
        break
    }
  },

  reset: () => set({ ...IDLE }),
}))
