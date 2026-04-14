'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect, useMemo, useState } from 'react'
import CookieContext, { initGlobalCookieStore } from '../context/CookieContext'
import { ThemeProvider } from './ThemeProvider'

/**
 * Browser cookie'ye yaz — server action'lar (next/headers cookies())
 * sadece HTTP cookie'lerini okuyabilir, React state yetmez.
 */
function persistBrowserCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  if (value) {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
  } else {
    document.cookie = `${name}=; path=/; max-age=0`
  }
}

export default function Providers({
  children,
  cookiesData,
}: Readonly<{
  children: React.ReactNode
  cookiesData: Record<string, string>
}>) {
  const [cookies, setCookies] = useState<Record<string, string>>(cookiesData)
  const [queryClient] = useState(() => new QueryClient())

  const updateCookie = (name: string, value: string) => {
    setCookies(prev => ({
      ...prev,
      [name]: value,
    }))
    persistBrowserCookie(name, value)
  }

  // Senkron init: child effect'ler çalışmadan önce globalCookieStore hazır olsun
  // (React'te useEffect child→parent sırası ile çalışır; TanStack Query fetch'leri
  // Providers'ın useEffect'inden önce tetiklenebilir)
  initGlobalCookieStore({ cookies, updateCookie })

  // cookies state değiştiğinde singleton'ı güncelle
  useEffect(() => {
    initGlobalCookieStore({ cookies, updateCookie })
  }, [cookies])

  const contextValue = useMemo(() => ({ cookies, updateCookie }), [cookies])

  return (
    <CookieContext.Provider value={contextValue}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </ThemeProvider>
      </QueryClientProvider>
    </CookieContext.Provider>
  )
}
