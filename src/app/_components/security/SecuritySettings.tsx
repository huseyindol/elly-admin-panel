'use client'

import { useAdminTheme } from '@/app/_hooks'
import { getMfaStatusService } from '@/app/_services/mfa.services'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, ShieldOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { MfaSetupDialog } from './MfaSetupDialog'
import { MfaDisableDialog } from './MfaDisableDialog'

export function SecuritySettings() {
  const { isDarkMode } = useAdminTheme()
  const queryClient = useQueryClient()
  const [showSetup, setShowSetup] = useState(false)
  const [showDisable, setShowDisable] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['mfa', 'status'],
    queryFn: getMfaStatusService,
  })

  const mfaEnabled = data?.mfaEnabled ?? false

  const invalidateStatus = () =>
    queryClient.invalidateQueries({ queryKey: ['mfa', 'status'] })

  const cardClass = `rounded-2xl p-6 ${
    isDarkMode
      ? 'border border-slate-800/50 bg-slate-900/60'
      : 'border border-gray-200 bg-white'
  }`

  return (
    <>
      <section className={cardClass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                mfaEnabled
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : isDarkMode
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-gray-100 text-gray-500'
              }`}
            >
              {mfaEnabled ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <ShieldOff className="h-6 w-6" />
              )}
            </div>
            <div>
              <h2
                className={`flex items-center gap-2 text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                İki Adımlı Doğrulama (2FA)
                {!isLoading && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      mfaEnabled
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : isDarkMode
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {mfaEnabled ? 'Aktif' : 'Kapalı'}
                  </span>
                )}
              </h2>
              <p
                className={`mt-1 max-w-md text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
              >
                Authenticator uygulamasıyla üretilen tek kullanımlık kod ile
                hesabınıza ekstra güvenlik katmanı ekleyin.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            ) : mfaEnabled ? (
              <button
                type="button"
                onClick={() => setShowDisable(true)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                }`}
              >
                Devre Dışı Bırak
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSetup(true)}
                className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40"
              >
                Etkinleştir
              </button>
            )}
          </div>
        </div>

        {isError && (
          <p className="mt-4 text-sm text-rose-500">
            2FA durumu yüklenemedi. Lütfen sayfayı yenileyin.
          </p>
        )}
      </section>

      <MfaSetupDialog
        isOpen={showSetup}
        onClose={() => setShowSetup(false)}
        onEnabled={invalidateStatus}
      />
      <MfaDisableDialog
        isOpen={showDisable}
        onClose={() => setShowDisable(false)}
        onDisabled={invalidateStatus}
      />
    </>
  )
}
