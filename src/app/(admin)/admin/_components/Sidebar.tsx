'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { logout } from '../../../../actions/auth/logout'
import { useAdminTheme } from '../_hooks'
import { Icons } from './Icons'

interface MenuItem {
  icon: () => React.ReactNode
  label: string
  href: string
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems: MenuItem[] = [
  { icon: Icons.Home, label: 'Gösterge Paneli', href: '/admin/dashboard' },
  { icon: Icons.BarChart, label: 'Sayfalar', href: '/admin/pages' },
  { icon: Icons.Package, label: 'Componentler', href: '/admin/components' },
  { icon: Icons.Grid, label: 'Widgetlar', href: '/admin/widgets' },
  { icon: Icons.File, label: 'Postlar', href: '/admin/posts' },
  { icon: Icons.Eye, label: 'Bannerlar', href: '/admin/banners' },
  { icon: Icons.Layers, label: 'İçerikler', href: '/admin/contents' },
  { icon: Icons.Image, label: 'Assetler', href: '/admin/assets' },
  { icon: Icons.ClipboardList, label: 'Formlar', href: '/admin/forms' },
  { icon: Icons.Settings, label: 'Ayarlar', href: '/admin/settings' },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { isDarkMode } = useAdminTheme()

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const onLogout = () => {
    logout()
  }

  return (
    <>
      {/* Sidebar Overlay */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 h-full w-full cursor-default border-0 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label="Menüyü kapat"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 transform transition-all duration-300 ease-out lg:sticky ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isDarkMode
            ? 'border-r border-slate-800/50 bg-slate-900/80'
            : 'border-r border-gray-200/50 bg-white/80'
        } backdrop-blur-xl`}
      >
        <div className="flex h-full flex-col p-6">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
                <span className="text-lg font-bold text-white">E</span>
              </div>
              <div>
                <h1
                  className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Elly CMS
                </h1>
                <p
                  className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
                >
                  Admin Panel
                </p>
              </div>
            </Link>
            <button
              onClick={onClose}
              className={`rounded-lg p-2 transition-colors lg:hidden ${
                isDarkMode
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Icons.X />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {menuItems.map(item => {
              const active = isActive(item.href)
              let linkClass: string
              if (active) {
                linkClass = `bg-gradient-to-r from-violet-500/20 to-purple-500/20 ${
                  isDarkMode
                    ? 'border border-violet-500/30 text-white'
                    : 'border border-violet-500/30 text-gray-900'
                }`
              } else {
                linkClass = isDarkMode
                  ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${linkClass}`}
                >
                  <span className={active ? 'text-violet-400' : ''}>
                    <item.icon />
                  </span>
                  <span className="font-medium">{item.label}</span>
                  {active && (
                    <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div
            className={`mt-6 rounded-2xl p-4 ${
              isDarkMode
                ? 'border border-slate-700/50 bg-slate-800/50'
                : 'border border-gray-200 bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-semibold text-white">
                HD
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Hüseyin Dol
                </p>
                <p
                  className={`truncate text-xs ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`}
                >
                  Süper Admin
                </p>
              </div>
              <button
                onClick={onLogout}
                className={`rounded-lg p-2 transition-colors ${
                  isDarkMode
                    ? 'text-slate-400 hover:bg-slate-700'
                    : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Icons.LogOut />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
