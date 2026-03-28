'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

/**
 * Admin panel için tema hook'u
 * next-themes'den gelen tema bilgisini kullanır
 * Hydration sorunlarını önlemek için mounted state kontrolü yapar
 */
export function useAdminTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Hydration mismatch önlemek için - component mount olduktan sonra true olur
  // Bu pattern next-themes kütüphanesinin önerdiği standart yaklaşımdır
  // https://github.com/pacocoursey/next-themes#avoid-hydration-mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // SSR'da theme undefined olabilir, mounted olana kadar dark varsayalım
  const isDarkMode = mounted ? resolvedTheme === 'dark' : true

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return {
    theme,
    resolvedTheme,
    isDarkMode,
    mounted,
    setTheme,
    toggleTheme,
  }
}
