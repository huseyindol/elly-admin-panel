'use client'

import { useAdminTheme } from '@/app/_hooks'
import { useEmailClasspathTemplates } from '@/app/_hooks/useEmailTemplates'
import { Icons } from '@/app/_components/Icons'

export function ClasspathTemplateSection() {
  const { isDarkMode } = useAdminTheme()
  const { data: templates, isLoading } = useEmailClasspathTemplates()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`h-8 animate-pulse rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}
          />
        ))}
      </div>
    )
  }

  if (!templates?.length) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2
          className={`text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
        >
          Classpath Template&apos;leri
        </h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            isDarkMode
              ? 'bg-slate-700 text-slate-400'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {templates.length}
        </span>
        <span
          className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
        >
          — JAR içindeki statik Thymeleaf dosyaları (salt okunur)
        </span>
      </div>

      <div
        className={`overflow-hidden rounded-xl border ${
          isDarkMode ? 'border-slate-700/50' : 'border-gray-200'
        }`}
      >
        <ul
          className={`divide-y ${isDarkMode ? 'divide-slate-700/40' : 'divide-gray-100'}`}
        >
          {templates.map(name => (
            <li
              key={name}
              className={`flex items-center gap-3 px-4 py-2.5 ${
                isDarkMode ? 'text-slate-300' : 'text-gray-700'
              }`}
            >
              <span
                className={`${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
              >
                <Icons.Mail />
              </span>
              <span className="font-mono text-sm">{name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
