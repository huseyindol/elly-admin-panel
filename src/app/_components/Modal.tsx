'use client'

import { useAdminTheme } from '../_hooks'
import { Icons } from './Icons'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  const { isDarkMode } = useAdminTheme()

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Moda kapat"
      />

      {/* Dialog */}
      <div
        className={`relative w-full ${sizeClasses[size]} rounded-2xl shadow-2xl transition-all ${
          isDarkMode
            ? 'border border-slate-700/50 bg-slate-900'
            : 'border border-gray-200 bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b px-6 py-4 ${
            isDarkMode ? 'border-slate-800' : 'border-gray-100'
          }`}
        >
          <h3
            className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className={`rounded-lg p-2 transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Icons.X />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
