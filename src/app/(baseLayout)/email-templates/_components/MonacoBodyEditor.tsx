'use client'

import dynamic from 'next/dynamic'
import { useAdminTheme } from '@/app/_hooks'

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(m => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] animate-pulse items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800">
        <span className="text-sm text-slate-500">Editor yükleniyor…</span>
      </div>
    ),
  },
)

interface MonacoBodyEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  height?: string
}

export function MonacoBodyEditor({
  value,
  onChange,
  readOnly = false,
  height = '500px',
}: MonacoBodyEditorProps) {
  const { isDarkMode } = useAdminTheme()

  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        isDarkMode ? 'border-slate-700' : 'border-gray-300'
      }`}
    >
      <MonacoEditor
        height={height}
        defaultLanguage="html"
        value={value}
        onChange={v => onChange(v ?? '')}
        theme={isDarkMode ? 'vs-dark' : 'light'}
        options={{
          readOnly,
          fontSize: 13,
          minimap: { enabled: false },
          lineNumbers: 'on',
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          tabSize: 2,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  )
}
