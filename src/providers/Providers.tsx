'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Hata alınan sorgular varsayılan 3 yerine 1 kez yeniden denensin
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  const updateCookie = useCallback((name: string, value: string) => {
    setCookies(prev => ({
      ...prev,
      [name]: value,
    }))
    persistBrowserCookie(name, value)
  }, [])

  // cookies state değiştiğinde singleton'ı güncelle
  useEffect(() => {
    initGlobalCookieStore({ cookies, updateCookie })
  }, [cookies, updateCookie])

  const contextValue = useMemo(
    () => ({ cookies, updateCookie }),
    [cookies, updateCookie],
  )

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
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </ThemeProvider>
      </QueryClientProvider>
    </CookieContext.Provider>
  )
}
