'use client'

import { useAdminTheme } from '../_hooks'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Sil',
  cancelText = 'İptal',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const { isDarkMode } = useAdminTheme()

  if (!isOpen) return null

  const variantColors = {
    danger: {
      bg: 'bg-rose-500',
      hover: 'hover:bg-rose-600',
      icon: 'text-rose-500',
    },
    warning: {
      bg: 'bg-amber-500',
      hover: 'hover:bg-amber-600',
      icon: 'text-amber-500',
    },
    info: {
      bg: 'bg-blue-500',
      hover: 'hover:bg-blue-600',
      icon: 'text-blue-500',
    },
  }

  const colors = variantColors[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Diyaloğu kapat"
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
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
            isDarkMode ? 'bg-slate-800' : 'bg-gray-100'
          }`}
        >
          <span className={colors.icon}>
            {variant === 'danger' && '⚠️'}
            {variant === 'warning' && '⚡'}
            {variant === 'info' && 'ℹ️'}
          </span>
        </div>

        {/* Content */}
        <h3
          className={`mb-2 text-center text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          {title}
        </h3>
        <p
          className={`mb-6 text-center text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
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
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors ${colors.bg} ${colors.hover} disabled:opacity-50`}
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
