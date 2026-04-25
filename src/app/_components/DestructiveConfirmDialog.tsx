'use client'

import { useState } from 'react'
import { useAdminTheme } from '../_hooks'

interface DestructiveConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: React.ReactNode
  expectedText: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}

/**
 * "Onaylamak için X yaz" UX'i — purge, delete gibi geri dönüşsüz işlemler.
 * Input değeri `expectedText` ile birebir eşleşmeden "Onayla" butonu aktif olmaz.
 */
export function DestructiveConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  expectedText,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  isLoading = false,
}: DestructiveConfirmDialogProps) {
  const { isDarkMode } = useAdminTheme()
  const [value, setValue] = useState('')

  const handleClose = () => {
    setValue('')
    onClose()
  }

  if (!isOpen) return null

  const matches = value.trim() === expectedText

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Diyaloğu kapat"
        onClick={handleClose}
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-black/60"
      />
      <div
        className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl ${
          isDarkMode
            ? 'border border-slate-700/50 bg-slate-900'
            : 'border border-gray-200 bg-white'
        }`}
      >
        <h3 className={`mb-2 text-lg font-semibold text-rose-500`}>
          ⚠️ {title}
        </h3>
        {description && (
          <p
            className={`mb-4 text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-gray-600'
            }`}
          >
            {description}
          </p>
        )}
        <p
          className={`mb-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
        >
          Onaylamak için yaz:{' '}
          <code
            className={`rounded px-1.5 py-0.5 font-mono text-xs font-semibold ${
              isDarkMode
                ? 'bg-slate-800 text-violet-300'
                : 'bg-gray-100 text-violet-700'
            }`}
          >
            {expectedText}
          </code>
        </p>
        <input
          type="text"
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={expectedText}
          disabled={isLoading}
          className={`mb-4 w-full rounded-xl border px-3 py-2 font-mono text-sm outline-none transition-colors focus:ring-2 ${
            isDarkMode
              ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-600 focus:border-violet-500 focus:ring-violet-500/20'
              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-violet-500/20'
          }`}
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!matches || isLoading}
            className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-500/30 transition-all hover:shadow-xl hover:shadow-rose-500/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>İşleniyor...</span>
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
