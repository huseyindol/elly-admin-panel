'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePermission } from '@/hooks/usePermission'
import { MODULES } from '@/types/permissions'
import { useAdminTheme } from '../_hooks'
import { Icons } from './Icons'

interface CommandItem {
  label: string
  href: string
  /** Erişim için gereken permission (yoksa herkese açık) */
  permission?: string
  /** Aramada eşleşmeyi artıran ek anahtar kelimeler */
  keywords?: string
}

const COMMAND_ITEMS: CommandItem[] = [
  {
    label: 'Gösterge Paneli',
    href: '/dashboard',
    keywords: 'dashboard anasayfa home',
  },
  {
    label: 'Yazılar',
    href: '/posts',
    permission: `${MODULES.POSTS}:read`,
    keywords: 'post blog',
  },
  {
    label: 'Sayfalar',
    href: '/pages',
    permission: `${MODULES.PAGES}:read`,
    keywords: 'page',
  },
  {
    label: 'İçerikler',
    href: '/contents',
    permission: `${MODULES.CONTENTS}:read`,
    keywords: 'content',
  },
  {
    label: 'Componentler',
    href: '/components',
    permission: `${MODULES.COMPONENTS}:read`,
    keywords: 'component bileşen',
  },
  {
    label: 'Widgetlar',
    href: '/widgets',
    permission: `${MODULES.WIDGETS}:read`,
    keywords: 'widget',
  },
  {
    label: 'Bannerlar',
    href: '/banners',
    permission: `${MODULES.BANNERS}:read`,
    keywords: 'banner',
  },
  {
    label: 'Assetler',
    href: '/assets',
    permission: `${MODULES.ASSETS}:read`,
    keywords: 'asset medya media görsel',
  },
  {
    label: 'Formlar',
    href: '/forms',
    permission: `${MODULES.FORMS}:read`,
    keywords: 'form anket',
  },
  {
    label: 'Mail Hesapları',
    href: '/mail-accounts',
    permission: `${MODULES.MAIL}:read`,
    keywords: 'mail smtp email hesap',
  },
  {
    label: 'Email Templates',
    href: '/email-templates',
    permission: `${MODULES.EMAIL_TEMPLATES}:read`,
    keywords: 'template şablon mail',
  },
  {
    label: 'Email Logları',
    href: '/email-logs',
    permission: `${MODULES.EMAILS}:read`,
    keywords: 'log mail gönderim',
  },
  {
    label: 'Chat',
    href: '/chat',
    permission: `${MODULES.CHAT}:read`,
    keywords: 'mesaj sohbet chat',
  },
  {
    label: 'Kullanıcılar',
    href: '/users',
    permission: `${MODULES.USERS}:manage`,
    keywords: 'user kullanıcı',
  },
  {
    label: 'RabbitMQ',
    href: '/infrastructure/rabbitmq',
    permission: `${MODULES.RABBIT}:read`,
    keywords: 'rabbit queue kuyruk',
  },
  {
    label: 'Ayarlar',
    href: '/settings',
    keywords: 'settings 2fa güvenlik ayar',
  },
  { label: 'Profil', href: '/profile', keywords: 'profile hesap' },
]

const normalize = (s: string) => s.toLocaleLowerCase('tr')

export function CommandPalette() {
  const router = useRouter()
  const { isDarkMode } = useAdminTheme()
  const { hasPermission, isSuperAdmin } = usePermission()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // İzin filtreli komut listesi
  const allowedItems = useMemo(
    () =>
      COMMAND_ITEMS.filter(
        item =>
          !item.permission || isSuperAdmin() || hasPermission(item.permission),
      ),
    [hasPermission, isSuperAdmin],
  )

  // Sorguya göre filtrele
  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return allowedItems
    return allowedItems.filter(item =>
      normalize(`${item.label} ${item.keywords ?? ''} ${item.href}`).includes(
        q,
      ),
    )
  }, [query, allowedItems])

  // ⌘K / Ctrl+K ile aç-kapat (reset'ler event handler'da — effect değil)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setQuery('')
        setActiveIndex(0)
        setOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Açılınca girişi odakla — yalnızca DOM yan etkisi (setState yok)
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const openPalette = () => {
    setQuery('')
    setActiveIndex(0)
    setOpen(true)
  }
  const close = () => setOpen(false)

  const go = (href: string) => {
    close()
    router.push(href)
  }

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (results.length ? (i + 1) % results.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i =>
        results.length ? (i - 1 + results.length) % results.length : 0,
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = results[activeIndex]
      if (target) go(target.href)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  return (
    <>
      {/* Tetikleyici — eski statik arama kutusunun yerini alır */}
      <button
        type="button"
        onClick={openPalette}
        className={`hidden items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-colors md:flex ${
          isDarkMode
            ? 'border border-slate-700/50 bg-slate-800/50 text-slate-500 hover:bg-slate-800'
            : 'border border-gray-200 bg-white text-gray-400 hover:bg-gray-50'
        }`}
        aria-label="Ara (Cmd+K)"
      >
        <Icons.Search />
        <span className="w-32 text-left">Ara...</span>
        <kbd
          className={`rounded px-2 py-1 text-xs ${
            isDarkMode
              ? 'bg-slate-700 text-slate-300'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
          <button
            type="button"
            aria-label="Kapat"
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-sm"
          />
          <div
            className={`relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl ${
              isDarkMode
                ? 'border border-slate-700/50 bg-slate-900'
                : 'border border-gray-200 bg-white'
            }`}
          >
            {/* Arama girişi */}
            <div
              className={`flex items-center gap-2 border-b px-4 py-3 ${
                isDarkMode ? 'border-slate-800' : 'border-gray-100'
              }`}
            >
              <Icons.Search />
              <input
                ref={inputRef}
                value={query}
                onChange={e => {
                  setQuery(e.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Sayfa ara veya git..."
                className={`flex-1 bg-transparent text-sm outline-none ${
                  isDarkMode
                    ? 'text-white placeholder-slate-500'
                    : 'text-gray-900 placeholder-gray-400'
                }`}
              />
              <kbd
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  isDarkMode
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                Esc
              </kbd>
            </div>

            {/* Sonuçlar */}
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && (
                <li
                  className={`px-3 py-6 text-center text-sm ${
                    isDarkMode ? 'text-slate-500' : 'text-gray-400'
                  }`}
                >
                  Sonuç bulunamadı
                </li>
              )}
              {results.map((item, idx) => (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      idx === activeIndex
                        ? isDarkMode
                          ? 'bg-violet-500/15 text-white'
                          : 'bg-violet-50 text-gray-900'
                        : isDarkMode
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{item.label}</span>
                    <span
                      className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
                    >
                      {item.href}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
