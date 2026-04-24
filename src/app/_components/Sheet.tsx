'use client'

import { useEffect } from 'react'
import { useAdminTheme } from '../_hooks'
import { Icons } from './Icons'

interface SheetProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  side?: 'right' | 'left'
  width?: string
}

/**
 * Yandan kayan drawer — RabbitMQ queue detayları, email log detayı gibi
 * "sayfa değiştirmeden detay göster" akışları için.
 *
 * Tasarım Modal.tsx ile tutarlıdır: aynı blur backdrop, aynı koyu/açık tema.
 * Shadcn `sheet` paketi yerine projenin mevcut stiline uyum öncelikli.
 */
export function Sheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  side = 'right',
  width = 'w-full sm:w-[640px]',
}: SheetProps) {
  const { isDarkMode } = useAdminTheme()

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  const sideClasses =
    side === 'right'
      ? `right-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
      : `left-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Paneli kapat"
        className={`absolute inset-0 cursor-default border-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        className={`absolute top-0 flex h-full ${width} max-w-full transform flex-col shadow-2xl transition-transform duration-300 ease-out ${sideClasses} ${
          isDarkMode
            ? 'border-l border-slate-800/60 bg-slate-900'
            : 'border-l border-gray-200 bg-white'
        }`}
      >
        {(title || description) && (
          <header
            className={`flex items-start justify-between gap-3 border-b px-6 py-4 ${
              isDarkMode ? 'border-slate-800' : 'border-gray-100'
            }`}
          >
            <div className="min-w-0 flex-1">
              {title && (
                <h2
                  className={`truncate text-lg font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  className={`mt-1 text-sm ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}
                >
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className={`shrink-0 rounded-lg p-2 transition-colors ${
                isDarkMode
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Icons.X />
            </button>
          </header>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </aside>
    </div>
  )
}
