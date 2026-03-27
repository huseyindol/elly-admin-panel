'use client'

import { useAdminTheme } from '../_hooks'
import { Icons } from './Icons'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Ara...',
}: SearchInputProps) {
  const { isDarkMode } = useAdminTheme()

  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 ${
        isDarkMode
          ? 'border border-slate-700/50 bg-slate-800/50'
          : 'border border-gray-200 bg-white'
      }`}
    >
      <Icons.Search />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 bg-transparent text-sm outline-none ${
          isDarkMode
            ? 'text-white placeholder-slate-500'
            : 'text-gray-900 placeholder-gray-400'
        }`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={`rounded p-1 transition-colors ${
            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
          }`}
        >
          <Icons.X />
        </button>
      )}
    </div>
  )
}
