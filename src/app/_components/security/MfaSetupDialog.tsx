'use client'

import { Modal } from '@/app/_components'
import { useAdminTheme } from '@/app/_hooks'
import {
  getMfaSetupService,
  verifyMfaSetupService,
} from '@/app/_services/mfa.services'
import type { MfaSetupResponse } from '@/types/mfa'
import { Check, Copy, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Props {
  isOpen: boolean
  onClose: () => void
  /** 2FA başarıyla etkinleştirildiğinde çağrılır (status invalidate için) */
  onEnabled: () => void
}

export function MfaSetupDialog({ isOpen, onClose, onEnabled }: Props) {
  const { isDarkMode } = useAdminTheme()
  const [data, setData] = useState<MfaSetupResponse | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loadingSetup, setLoadingSetup] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [copied, setCopied] = useState(false)

  // Dialog açılınca QR + secret üret
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    const run = async () => {
      setLoadingSetup(true)
      setError(null)
      try {
        const res = await getMfaSetupService()
        if (!cancelled) setData(res)
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Kurulum başlatılamadı')
        }
      } finally {
        if (!cancelled) setLoadingSetup(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [isOpen])

  const handleClose = () => {
    setData(null)
    setCode('')
    setError(null)
    setCopied(false)
    onClose()
  }

  const handleCopy = async () => {
    if (!data?.secret) return
    try {
      await navigator.clipboard.writeText(data.secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Kopyalanamadı')
    }
  }

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError('6 haneli kod girin')
      return
    }
    setVerifying(true)
    setError(null)
    try {
      await verifyMfaSetupService(code)
      toast.success('2FA başarıyla etkinleştirildi')
      onEnabled()
      handleClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Kod doğrulanamadı')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="2FA'yı Etkinleştir">
      <div className="space-y-4">
        {loadingSetup && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        )}

        {!loadingSetup && data && (
          <>
            <p
              className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}
            >
              Authenticator uygulamanızla (Google Authenticator, Authy vb.)
              aşağıdaki QR kodunu tarayın veya anahtarı manuel girin.
            </p>

            {/* QR */}
            <div className="flex justify-center">
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG value={data.qrUri} size={180} />
              </div>
            </div>

            {/* Manuel secret */}
            <div>
              <span
                className={`mb-1.5 block text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
              >
                Manuel anahtar
              </span>
              <div
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-800'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <code
                  className={`min-w-0 flex-1 truncate font-mono text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}
                >
                  {data.secret}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`shrink-0 rounded-lg p-1.5 transition-colors ${
                    isDarkMode
                      ? 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  }`}
                  aria-label="Anahtarı kopyala"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Kod doğrulama */}
            <div>
              <label
                htmlFor="mfa-setup-code"
                className={`mb-1.5 block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
              >
                Doğrulama Kodu
              </label>
              <input
                id="mfa-setup-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={e => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  if (error) setError(null)
                }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                placeholder="6 haneli kod"
                className={`w-full rounded-xl border px-3 py-2 text-center font-mono text-lg tracking-[0.4em] outline-none transition-colors focus:ring-2 focus:ring-violet-500/30 ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500/50'
                    : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-violet-300'
                }`}
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || loadingSetup || code.length !== 6}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Doğrulanıyor...
              </>
            ) : (
              'Doğrula ve Etkinleştir'
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
