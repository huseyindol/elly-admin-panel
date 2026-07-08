'use client'

import { useEffect } from 'react'
import { Phone, PhoneOff } from 'lucide-react'
import { useCallStore } from '@/stores/call-store'

/**
 * Gelen çağrı zili. Ring-all (tenant destek) ve normal aynı bileşen — yalnız metin farklı.
 * CALL_TAKEN/CANCELLED/TIMEOUT sinyalinde call-store phase'i idle'a çeker → bileşen unmount olur.
 */
export function IncomingCallModal() {
  const peerName = useCallStore(s => s.peerName)
  const ringAll = useCallStore(s => s.ringAll)
  const answer = useCallStore(s => s.answer)
  const reject = useCallStore(s => s.reject)

  // Sekme odakta değilse native bildirim (izin varsa)
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (document.visibilityState === 'visible' && document.hasFocus()) return
    if (Notification.permission !== 'granted') return
    try {
      const n = new Notification(
        ringAll ? 'Gelen destek çağrısı' : 'Gelen görüntülü çağrı',
        { body: peerName ?? '', tag: 'elly-incoming-call' },
      )
      n.onclick = () => window.focus()
    } catch {
      // yoksay
    }
  }, [ringAll, peerName])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-80 rounded-2xl bg-slate-900 p-6 text-center shadow-2xl ring-1 ring-white/10">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20">
          <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-violet-500/30">
            <Phone className="h-7 w-7 text-violet-300" />
          </span>
        </div>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          {ringAll ? 'Gelen destek çağrısı' : 'Gelen görüntülü çağrı'}
        </p>
        <p className="mt-1 text-lg font-semibold text-white">
          {peerName ?? 'Bilinmeyen'}
        </p>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={reject}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white transition hover:bg-rose-700"
            aria-label="Reddet"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={answer}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700"
            aria-label="Cevapla"
          >
            <Phone className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
