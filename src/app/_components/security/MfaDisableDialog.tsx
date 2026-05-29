'use client'

import { Modal } from '@/app/_components'
import { useAdminTheme } from '@/app/_hooks'
import { disableMfaService } from '@/app/_services/mfa.services'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  isOpen: boolean
  onClose: () => void
  /** 2FA devre dışı bırakılınca çağrılır (status invalidate için) */
  onDisabled: () => void
}

export function MfaDisableDialog({ isOpen, onClose, onDisabled }: Props) {
  const { isDarkMode } = useAdminTheme()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleClose = () => {
    setPassword('')
    setError(null)
    onClose()
  }

  const handleDisable = async () => {
    if (!password) {
      setError('Şifrenizi girin')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await disableMfaService(password)
      toast.success('2FA devre dışı bırakıldı')
      onDisabled()
      handleClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '2FA devre dışı bırakılamadı')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="2FA'yı Devre Dışı Bırak"
    >
      <div className="space-y-4">
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            isDarkMode
              ? 'border border-amber-500/20 bg-amber-500/10 text-amber-300'
              : 'border border-amber-200 bg-amber-50 text-amber-700'
          }`}
        >
          2FA&apos;yı kapattığınızda hesabınız yalnızca şifreyle korunur. Devam
          etmek için şifrenizi girin.
        </p>

        <div>
          <label
            htmlFor="mfa-disable-password"
            className={`mb-1.5 block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
          >
            Şifre
          </label>
          <input
            id="mfa-disable-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => {
              setPassword(e.target.value)
              if (error) setError(null)
            }}
            onKeyDown={e => e.key === 'Enter' && handleDisable()}
            placeholder="Şifrenizi girin"
            className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500/30 ${
              isDarkMode
                ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500/50'
                : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-violet-300'
            }`}
          />
          {error && <p className="mt-1 text-sm text-rose-500">{error}</p>}
        </div>

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
            onClick={handleDisable}
            disabled={busy || !password}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-500/30 transition-all hover:shadow-xl hover:shadow-rose-500/40 disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                İşleniyor...
              </>
            ) : (
              'Devre Dışı Bırak'
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
