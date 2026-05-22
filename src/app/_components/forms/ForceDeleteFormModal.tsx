'use client'

import { useAdminTheme } from '@/app/_hooks'

interface ForceDeleteFormModalProps {
  open: boolean
  formTitle: string
  onClose: () => void
  /** Force-delete mutation'ını tetikler; loading/error yönetimi parent'ta. */
  onConfirm: () => void
  isLoading?: boolean
}

/**
 * 409 Conflict sonrası gösterilen force-delete onay modalı.
 *
 * Akış: deleteFormService → 409 ApiError → forceDeleteTarget set →
 * bu modal → "Evet, Tümünü Sil" → forceDeleteFormService
 */
export function ForceDeleteFormModal({
  open,
  formTitle,
  onClose,
  onConfirm,
  isLoading = false,
}: ForceDeleteFormModalProps) {
  const { isDarkMode } = useAdminTheme()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Diyaloğu kapat"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-black/60"
      />

      {/* Dialog */}
      <div
        className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl ${
          isDarkMode
            ? 'border border-slate-700/50 bg-slate-900'
            : 'border border-gray-200 bg-white'
        }`}
      >
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
          <span className="text-xl">⚠️</span>
        </div>

        {/* Title */}
        <h3 className="mb-1 text-center text-lg font-semibold text-rose-500">
          İlişkili kayıtlar mevcut
        </h3>

        {/* Form name */}
        <p
          className={`mb-4 text-center text-sm font-medium ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          &quot;{formTitle}&quot;
        </p>

        {/* Description */}
        <div
          className={`mb-5 space-y-3 text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          <p>Bu form ile ilişkili gönderimler (submission) bulunuyor.</p>
          <p>
            <strong className={isDarkMode ? 'text-slate-200' : 'text-gray-800'}>
              Tümünü sil
            </strong>{' '}
            seçeneği kalıcı olarak siler:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Formun kendisi</li>
            <li>Bu forma ait tüm gönderimler</li>
          </ul>

          <p
            className={`rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 font-medium text-rose-500`}
          >
            Bu işlem geri alınamaz.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            İptal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Siliniyor...</span>
              </span>
            ) : (
              'Evet, Tümünü Sil'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
