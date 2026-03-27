'use client'

import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- This is a valid SSR hydration pattern
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="transition-all hover:bg-primary hover:text-white"
        aria-label="Theme Toggle"
      >
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative transition-all hover:bg-primary hover:text-white"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Theme Toggle"
    >
      <Sun
        className={`h-5 w-5 transition-all duration-300 ease-in-out ${
          isDark
            ? 'rotate-90 scale-0 opacity-0'
            : 'rotate-0 scale-100 opacity-100'
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 transition-all duration-300 ease-in-out ${
          isDark
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        }`}
      />
    </Button>
  )
}
