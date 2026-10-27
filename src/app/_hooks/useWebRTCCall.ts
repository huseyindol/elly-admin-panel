'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useCallStore } from '@/stores/call-store'

/** getUserMedia hatasını kullanıcıya anlaşılır Türkçe mesaja çevirir. */
function mediaErrorMessage(err: unknown): string {
  const name = (err as { name?: string })?.name
  switch (name) {
    case 'NotAllowedError':
      return 'Kamera/mikrofon izni reddedildi — adres çubuğundaki kamera simgesinden izin verin.'
    case 'NotFoundError':
      return 'Kamera veya mikrofon bulunamadı.'
    case 'NotReadableError':
      return 'Kamera/mikrofon başka bir uygulama tarafından kullanılıyor.'
    case 'OverconstrainedError':
      return 'Kamera/mikrofon istenen ayarı desteklemiyor.'
    default:
      return 'Kamera/mikrofon açılamadı.'
  }
}

/** ICE sunucuları — env'den (NEXT_PUBLIC_ICE_SERVERS JSON veya NEXT_PUBLIC_TURN_*); yoksa public STUN. */
function iceServers(): RTCIceServer[] {
  const raw = process.env.NEXT_PUBLIC_ICE_SERVERS
  if (raw) {
    try {
      return JSON.parse(raw) as RTCIceServer[]
    } catch {
      // düşer → default
    }
  }
  const servers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL
  if (turnUrl) {
    servers.push({
      urls: turnUrl
        .split(',')
        .map(u => u.trim())
        .filter(Boolean),
      username: process.env.NEXT_PUBLIC_TURN_USERNAME || undefined,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || undefined,
    })
  }
  return servers
}

/**
 * RTCPeerConnection yaşam döngüsü. phase='active' olunca getUserMedia + pc kurulur;
 * ARAYAN (isCaller) offer üretir, karşı taraf answer. SDP/ICE call-store seq alanlarından
 * uygulanır (remote description gelmeden gelen ICE'lar tamponlanır). Görüntülü çağrı
 * bileşeni (CallWindow) bu hook'u tüketir.
 */
export function useWebRTCCall() {
  const phase = useCallStore(s => s.phase)
  const isCaller = useCallStore(s => s.isCaller)
  const sdpSeq = useCallStore(s => s.sdpSeq)
  const iceSeq = useCallStore(s => s.iceSeq)
  const micOn = useCallStore(s => s.micOn)
  const camOn = useCallStore(s => s.camOn)
  const sendSdp = useCallStore(s => s.sendSdp)
  const sendIce = useCallStore(s => s.sendIce)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localRef = useRef<MediaStream | null>(null)
  const pendingIce = useRef<RTCIceCandidateInit[]>([])
  const remoteReady = useRef(false)
  // Yerel medya (getUserMedia + addTrack) tamamlanınca resolve olur. Answer üretmeden ÖNCE
  // beklenir → aranan'ın kendi track'leri answer'a dahil olur (tek yönlü video bug'ı önlenir).
  const localReadyRef = useRef<Promise<void> | null>(null)

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  // Kurulum / yıkım — phase='active'
  useEffect(() => {
    if (phase !== 'active') return
    let cancelled = false
    remoteReady.current = false
    pendingIce.current = []

    const pc = new RTCPeerConnection({ iceServers: iceServers() })
    pcRef.current = pc

    pc.onicecandidate = e => {
      if (e.candidate) {
        sendIce(
          e.candidate.candidate,
          e.candidate.sdpMid,
          e.candidate.sdpMLineIndex,
        )
      }
    }
    pc.ontrack = e => {
      if (e.streams[0]) {
        setRemoteStream(e.streams[0])
      } else if (e.track) {
        setRemoteStream(prev => {
          const next = prev
            ? new MediaStream(prev.getTracks())
            : new MediaStream()
          next.addTrack(e.track)
          return next
        })
      }
    }

    localReadyRef.current = (async () => {
      let stream: MediaStream | null = null
      if (
        typeof navigator !== 'undefined' &&
        navigator.mediaDevices?.getUserMedia
      ) {
        // Önce kamera+mikrofon; olmazsa sese, o da olmazsa yalnız görüntüye veya recvonly moduna düş.
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
        } catch (videoErr) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            toast.warning('Kamera açılamadı — sesli devam ediliyor.')
          } catch {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
              })
              toast.warning(
                'Mikrofon açılamadı — yalnız görüntü ile devam ediliyor.',
              )
            } catch {
              toast.warning(
                `${mediaErrorMessage(videoErr)} Karşı tarafın ses/görüntüsü alınacak.`,
              )
            }
          }
        }
      } else {
        toast.warning(
          'Kamera/mikrofon erişimi yok — görüşmeye yalnız alıcı olarak devam ediliyor.',
        )
      }
      if (cancelled) {
        stream?.getTracks().forEach(t => t.stop())
        return
      }
      if (stream) {
        localRef.current = stream
        setLocalStream(stream)
        stream.getTracks().forEach(t => pc.addTrack(t, stream))
        if (
          isCaller &&
          stream.getAudioTracks().length === 0 &&
          typeof pc.addTransceiver === 'function'
        ) {
          pc.addTransceiver('audio', { direction: 'recvonly' })
        }
        if (
          isCaller &&
          stream.getVideoTracks().length === 0 &&
          typeof pc.addTransceiver === 'function'
        ) {
          pc.addTransceiver('video', { direction: 'recvonly' })
        }
      } else if (isCaller && typeof pc.addTransceiver === 'function') {
        pc.addTransceiver('audio', { direction: 'recvonly' })
        pc.addTransceiver('video', { direction: 'recvonly' })
      }
      if (isCaller) {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        if (offer.sdp) sendSdp('offer', offer.sdp)
      }
    })()

    return () => {
      cancelled = true
      pc.onicecandidate = null
      pc.ontrack = null
      pc.close()
      pcRef.current = null
      localRef.current?.getTracks().forEach(t => t.stop())
      localRef.current = null
      setLocalStream(null)
      setRemoteStream(null)
    }
  }, [phase, isCaller, sendSdp, sendIce])

  // Gelen SDP (offer/answer)
  useEffect(() => {
    if (sdpSeq === 0) return
    const pc = pcRef.current
    const sig = useCallStore.getState().sdpSignal
    if (!pc || !sig) return
    ;(async () => {
      // Yerel track'ler eklenene kadar bekle → createAnswer onları içersin (tek yönlü video fix).
      await localReadyRef.current
      await pc.setRemoteDescription({
        type: sig.sdpType as RTCSdpType,
        sdp: sig.sdp,
      })
      remoteReady.current = true
      // Tamponlanan ICE'ları uygula
      for (const c of pendingIce.current) {
        await pc.addIceCandidate(c).catch(() => {})
      }
      pendingIce.current = []
      if (sig.sdpType === 'offer') {
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        if (answer.sdp) sendSdp('answer', answer.sdp)
      }
    })().catch(e => console.error('SDP uygulanamadı', e))
  }, [sdpSeq, sendSdp])

  // Gelen ICE candidate
  useEffect(() => {
    if (iceSeq === 0) return
    const pc = pcRef.current
    const sig = useCallStore.getState().iceSignal
    if (!pc || !sig) return
    const cand: RTCIceCandidateInit = {
      candidate: sig.candidate,
      sdpMid: sig.sdpMid ?? undefined,
      sdpMLineIndex: sig.sdpMLineIndex ?? undefined,
    }
    if (remoteReady.current) {
      pc.addIceCandidate(cand).catch(e => console.error('addIceCandidate', e))
    } else {
      pendingIce.current.push(cand)
    }
  }, [iceSeq])

  // Mute / kamera toggle → track.enabled
  useEffect(() => {
    localRef.current?.getAudioTracks().forEach(t => {
      t.enabled = micOn
    })
  }, [micOn])
  useEffect(() => {
    localRef.current?.getVideoTracks().forEach(t => {
      t.enabled = camOn
    })
  }, [camOn])

  return { localStream, remoteStream }
}
