'use client'

import { useAdminTheme } from '../_hooks'
import { CommandPalette } from './CommandPalette'
import { Icons } from './Icons'

interface HeaderProps {
  onToggleSidebar: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function Header({
  onToggleSidebar,
  isCollapsed,
  onToggleCollapse,
}: HeaderProps) {
  const { isDarkMode, toggleTheme } = useAdminTheme()

  return (
    <header
      className={`sticky top-0 z-30 px-6 py-4 ${
        isDarkMode ? 'bg-slate-950' : 'bg-gray-50'
      } border-b ${isDarkMode ? 'border-slate-800/50' : 'border-gray-200/50'}`}
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
            aria-label="Menüyü aç"
          >
            <Icons.Menu />
          </button>
          <button
            onClick={onToggleCollapse}
            className={`hidden rounded-xl p-2 transition-colors lg:flex ${
              isDarkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            aria-label={isCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
          >
            {isCollapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
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
          {/* Search — ⌘K komut paleti */}
          <CommandPalette />

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
            <span className="notification-badge absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-medium text-white">
              5
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
