'use client'

import { useAdminTheme } from '../_hooks'
import { Icons } from './Icons'

interface HeaderProps {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { isDarkMode, toggleTheme } = useAdminTheme()

  return (
    <header
      className={`sticky top-0 z-30 px-6 py-4 ${
        isDarkMode ? 'bg-slate-950/80' : 'bg-gray-50/80'
      } border-b backdrop-blur-xl ${
        isDarkMode ? 'border-slate-800/50' : 'border-gray-200/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className={`rounded-xl p-2 transition-colors lg:hidden ${
              isDarkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Icons.Menu />
          </button>
          <div>
            <h2
              className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Gösterge Paneli
            </h2>
            <p
              className={`text-sm ${
                isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}
            >
              Hoş geldiniz! İşte bugünün özeti.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div
            className={`hidden items-center gap-2 rounded-xl px-4 py-2.5 md:flex ${
              isDarkMode
                ? 'border border-slate-700/50 bg-slate-800/50'
                : 'border border-gray-200 bg-white'
            }`}
          >
            <Icons.Search />
            <input
              id="search"
              type="text"
              placeholder="Ara..."
              className={`w-48 bg-transparent text-sm outline-none ${
                isDarkMode
                  ? 'text-white placeholder-slate-500'
                  : 'text-gray-900 placeholder-gray-400'
              }`}
            />
            <kbd
              className={`rounded px-2 py-1 text-xs ${
                isDarkMode
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              ⌘K
            </kbd>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`rounded-xl p-2.5 transition-all duration-300 ${
              isDarkMode
                ? 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                : 'border border-gray-200 bg-white text-slate-600 hover:bg-gray-100'
            }`}
          >
            {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
          </button>

          {/* Notifications */}
          <button
            className={`relative rounded-xl p-2.5 transition-colors ${
              isDarkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icons.Bell />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-rose-500 text-xs font-medium text-white">
              5
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
