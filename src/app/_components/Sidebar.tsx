'use client'

import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { logout } from '@/actions/auth/logout'
import { useAdminTheme } from '../_hooks'
import { Icons } from './Icons'

interface MenuItem {
  icon: () => React.ReactNode
  label: string
  href: string
}

function NavLink({
  item,
  active,
  isDarkMode,
  onClick,
}: {
  item: MenuItem
  active: boolean
  isDarkMode: boolean
  onClick: () => void
}) {
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
      href={item.href}
      onClick={onClick}
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
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems: MenuItem[] = [
  { icon: Icons.Home, label: 'Gösterge Paneli', href: '/dashboard' },
  { icon: Icons.BarChart, label: 'Sayfalar', href: '/pages' },
  { icon: Icons.Package, label: 'Componentler', href: '/components' },
  { icon: Icons.Grid, label: 'Widgetlar', href: '/widgets' },
  { icon: Icons.File, label: 'Postlar', href: '/posts' },
  { icon: Icons.Eye, label: 'Bannerlar', href: '/banners' },
  { icon: Icons.Layers, label: 'İçerikler', href: '/contents' },
  { icon: Icons.Image, label: 'Assetler', href: '/assets' },
  { icon: Icons.ClipboardList, label: 'Formlar', href: '/forms' },
  { icon: Icons.Settings, label: 'Ayarlar', href: '/settings' },
]

// CMS yönetim menüsü — ayrı bölüm
const cmsManagementItems: MenuItem[] = [
  { icon: Icons.Mail, label: 'Email Templates', href: '/email-templates' },
  { icon: Icons.Inbox, label: 'Email Logları', href: '/email-logs' },
  {
    icon: Icons.Activity,
    label: 'RabbitMQ',
    href: '/infrastructure/rabbitmq',
  },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { isDarkMode } = useAdminTheme()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const queryClient = useQueryClient()

  const onLogout = () => {
    queryClient.clear()
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
        <div
          className="flex h-full flex-col p-6"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* Logo */}
          <div className="mb-8 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
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
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {menuItems.map(item => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                isDarkMode={isDarkMode}
                onClick={onClose}
              />
            ))}

            {/* CMS Yönetim — Separator */}
            <div
              className={`my-2 border-t ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200'}`}
            />
            <p
              className={`px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest ${
                isDarkMode ? 'text-slate-600' : 'text-gray-400'
              }`}
            >
              CMS Yönetim
            </p>
            {cmsManagementItems.map(item => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                isDarkMode={isDarkMode}
                onClick={onClose}
              />
            ))}

            {/* Separator */}
            <div
              className={`my-2 border-t ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200'}`}
            />

            {/* Logout Button — nav içinde, kolay erişilebilir */}
            <button
              onClick={onLogout}
              className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                isDarkMode
                  ? 'text-slate-400 hover:bg-rose-500/10 hover:text-rose-400'
                  : 'text-gray-600 hover:bg-rose-50 hover:text-rose-600'
              }`}
            >
              <Icons.LogOut />
              <span className="font-medium">Çıkış Yap</span>
            </button>
          </nav>

          {/* User Profile — sadece bilgi, logout buradan kaldırıldı */}
          <div
            className={`mt-4 rounded-2xl p-4 ${
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
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
