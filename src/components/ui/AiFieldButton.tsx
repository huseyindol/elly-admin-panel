'use client'

import { useAdminTheme } from '@/app/_hooks'

interface AiFieldButtonProps {
  onClick: () => void
  isLoading: boolean
  disabled?: boolean
  label?: string
}

/**
 * Bir form alanı etiketinin yanına konan küçük AI üretim butonu.
 * Kaynak alan boşsa (disabled=true) devre dışı kalır.
 */
export default function AiFieldButton({
  onClick,
  isLoading,
  disabled = false,
  label = 'AI ile oluştur',
}: AiFieldButtonProps) {
  const { isDarkMode } = useAdminTheme()

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      title={label}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        isDarkMode
          ? 'bg-violet-900/40 text-violet-300 hover:bg-violet-800/60 hover:text-violet-200'
          : 'bg-violet-50 text-violet-600 hover:bg-violet-100 hover:text-violet-700'
      }`}
    >
      {isLoading ? (
        <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
      ) : (
        <span>✨</span>
      )}
      {label}
    </button>
  )
}
