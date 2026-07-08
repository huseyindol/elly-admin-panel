'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react'
import { useCallStore } from '@/stores/call-store'
import { useWebRTCCall } from '@/app/_hooks/useWebRTCCall'

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/**
 * Görüşme penceresi (sağ altta yüzen). outgoing → "Aranıyor..."; active → çift yönlü video.
 * useWebRTCCall burada mount edilir (peer connection yaşam döngüsü phase='active'te başlar).
 */
export function CallWindow() {
  const phase = useCallStore(s => s.phase)
  const peerName = useCallStore(s => s.peerName)
  const micOn = useCallStore(s => s.micOn)
  const camOn = useCallStore(s => s.camOn)
  const toggleMic = useCallStore(s => s.toggleMic)
  const toggleCam = useCallStore(s => s.toggleCam)
  const hangup = useCallStore(s => s.hangup)
  const cancel = useCallStore(s => s.cancel)

  const { localStream, remoteStream } = useWebRTCCall()
  const localVideo = useRef<HTMLVideoElement>(null)
  const remoteVideo = useRef<HTMLVideoElement>(null)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (localVideo.current) localVideo.current.srcObject = localStream
  }, [localStream])
  useEffect(() => {
    if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream
  }, [remoteStream])
  useEffect(() => {
    if (phase !== 'active') return
    setSeconds(0)
    const t = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  const active = phase === 'active'

  return (
    <div className="fixed bottom-4 right-4 z-[90] w-80 overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10">
      {/* Video alanı */}
      <div className="relative aspect-video bg-slate-950">
        {active ? (
          <video
            ref={remoteVideo}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-slate-300">
            <div className="mb-2 h-12 w-12 animate-pulse rounded-full bg-violet-500/30" />
            <p className="text-sm">Aranıyor…</p>
          </div>
        )}
        <p className="absolute left-2 top-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
          {peerName ?? ''} {active ? `· ${fmt(seconds)}` : ''}
        </p>
        {/* Local PiP */}
        <video
          ref={localVideo}
          autoPlay
          playsInline
          muted
          className="absolute bottom-2 right-2 h-20 w-28 rounded-lg object-cover ring-1 ring-white/20"
        />
      </div>

      {/* Kontroller */}
      <div className="flex items-center justify-center gap-4 py-3">
        {active && (
          <>
            <button
              type="button"
              onClick={toggleMic}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                micOn
                  ? 'bg-slate-700 text-white hover:bg-slate-600'
                  : 'bg-rose-600 text-white'
              }`}
              aria-label={micOn ? 'Mikrofonu kapat' : 'Mikrofonu aç'}
            >
              {micOn ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={toggleCam}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                camOn
                  ? 'bg-slate-700 text-white hover:bg-slate-600'
                  : 'bg-rose-600 text-white'
              }`}
              aria-label={camOn ? 'Kamerayı kapat' : 'Kamerayı aç'}
            >
              {camOn ? (
                <Video className="h-4 w-4" />
              ) : (
                <VideoOff className="h-4 w-4" />
              )}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={active ? hangup : cancel}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white transition hover:bg-rose-700"
          aria-label={active ? 'Kapat' : 'İptal'}
        >
          <PhoneOff className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
