'use client'
import { Header, Sidebar } from '@/app/(admin)/admin/_components'
import { useAdminTheme } from '@/app/(admin)/admin/_hooks'
import { useState } from 'react'
import { Toaster } from 'sonner'

export default function BaseAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isDarkMode } = useAdminTheme()

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'dark bg-slate-950' : 'bg-gray-50'
      }`}
    >
      {/* Ambient Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className={`absolute -right-40 -top-40 h-80 w-80 rounded-full opacity-20 blur-3xl ${
            isDarkMode ? 'bg-violet-600' : 'bg-violet-400'
          }`}
        />
        <div
          className={`absolute -left-40 top-1/2 h-96 w-96 rounded-full opacity-20 blur-3xl ${
            isDarkMode ? 'bg-cyan-600' : 'bg-cyan-400'
          }`}
        />
      </div>

      <div className="relative flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="min-h-screen flex-1 lg:ml-0">
          <Header onToggleSidebar={() => setSidebarOpen(true)} />
          {children}
        </main>
      </div>
      <Toaster
        richColors
        position="top-right"
        theme={isDarkMode ? 'dark' : 'light'}
      />
    </div>
  )
}
