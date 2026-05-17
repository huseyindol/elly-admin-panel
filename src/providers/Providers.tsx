'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useCallback, useMemo, useState } from 'react'
import CookieContext, { initGlobalCookieStore } from '../context/CookieContext'
import { getCookieMaxAge } from '../utils/constant/cookieConstant'
import { ThemeProvider } from './ThemeProvider'

/**
 * Browser cookie'ye yaz — server action'lar (next/headers cookies())
 * sadece HTTP cookie'lerini okuyabilir, React state yetmez.
 *
 * `maxAge` verilmezse cookie adına özel sabit kullanılır (bkz.
 * cookieConstant.COOKIE_MAX_AGE). accessToken / expiredDate gibi
 * backend'in döndüğü `expiredDate`'e dayalı süre kullanmak isteyen
 * çağrıcılar override edebilir.
 */
function persistBrowserCookie(name: string, value: string, maxAge?: number) {
  if (typeof document === 'undefined') return
  if (value) {
    const ttl = typeof maxAge === 'number' ? maxAge : getCookieMaxAge(name)
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ttl}; SameSite=Lax`
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

  const updateCookie = useCallback(
    (name: string, value: string, maxAge?: number) => {
      setCookies(prev => ({
        ...prev,
        [name]: value,
      }))
      persistBrowserCookie(name, value, maxAge)
    },
    [],
  )

  const contextValue = useMemo(
    () => ({ cookies, updateCookie }),
    [cookies, updateCookie],
  )

  // Synchronous initialization so globalCookieStore is available before
  // any child useEffect hooks fire (React runs effects bottom-up: children first)
  initGlobalCookieStore(contextValue)

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
