'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'admin-sidebar-collapsed'

export function useSidebarCollapsed() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe localStorage read
      setIsCollapsed(true)
    }
    setMounted(true)
  }, [])

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  return {
    isCollapsed: mounted ? isCollapsed : false,
    toggleCollapse,
  }
}
