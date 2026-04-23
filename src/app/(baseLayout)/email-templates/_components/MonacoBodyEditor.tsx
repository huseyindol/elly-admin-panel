'use client'

import dynamic from 'next/dynamic'
import { useAdminTheme } from '@/app/_hooks'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center rounded-xl bg-[#1e1e1e] text-sm text-slate-400">
      Editör yükleniyor…
    </div>
  ),
})

interface MonacoBodyEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export function MonacoBodyEditor({
  value,
  onChange,
  readOnly = false,
}: MonacoBodyEditorProps) {
  const { isDarkMode } = useAdminTheme()

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/50">
      <MonacoEditor
        height="500px"
        language="html"
        theme={isDarkMode ? 'vs-dark' : 'light'}
        value={value}
        onChange={v => onChange(v ?? '')}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
        }}
      />
    </div>
  )
}
