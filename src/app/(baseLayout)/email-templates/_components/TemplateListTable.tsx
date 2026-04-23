'use client'

import { useAdminTheme } from '@/app/_hooks'
import { useEmailClasspathTemplates } from '@/app/_hooks/useEmailTemplates'
import { Icons } from '@/app/_components/Icons'

export function TemplateListTable() {
  const { isDarkMode } = useAdminTheme()
  const {
    data: templates,
    isLoading,
    isError,
    error,
  } = useEmailClasspathTemplates()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`h-12 animate-pulse rounded-xl ${
              isDarkMode ? 'bg-slate-800' : 'bg-gray-100'
            }`}
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div
        className={`rounded-xl p-4 text-sm ${
          isDarkMode
            ? 'border border-rose-500/40 bg-rose-500/10 text-rose-300'
            : 'border border-rose-200 bg-rose-50 text-rose-700'
        }`}
      >
        Template listesi alınamadı: {(error as Error)?.message}
      </div>
    )
  }

  if (!templates?.length) {
    return (
      <div
        className={`rounded-xl p-8 text-center text-sm ${
          isDarkMode ? 'text-slate-500' : 'text-gray-400'
        }`}
      >
        Template bulunamadı.
      </div>
    )
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${
        isDarkMode ? 'border-slate-700/50' : 'border-gray-200'
      }`}
    >
      <div
        className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider ${
          isDarkMode
            ? 'border-b border-slate-700/50 bg-slate-800/60 text-slate-400'
            : 'border-b border-gray-200 bg-gray-50 text-gray-500'
        }`}
      >
        Template Adı
      </div>
      <ul className="divide-y divide-slate-700/30 dark:divide-slate-700/30">
        {templates.map(name => (
          <li
            key={name}
            className={`flex items-center gap-3 px-4 py-3 ${
              isDarkMode
                ? 'text-slate-200 hover:bg-slate-800/40'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                isDarkMode
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Icons.Mail />
            </span>
            <span className="font-mono text-sm">{name}</span>
          </li>
        ))}
      </ul>
      <div
        className={`px-4 py-2 text-right text-xs ${
          isDarkMode ? 'text-slate-500' : 'text-gray-400'
        }`}
      >
        {templates.length} template
      </div>
    </div>
  )
}
