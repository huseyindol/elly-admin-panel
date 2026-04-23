'use client'

import { useState } from 'react'
import { useAdminTheme } from '@/app/_hooks'
import { usePreviewEmailTemplate } from '@/app/_hooks/useEmailTemplates'

interface PreviewPanelProps {
  templateKey: string | null
}

const DEFAULT_DATA = JSON.stringify(
  { userName: 'Ahmet', link: 'https://example.com' },
  null,
  2,
)

export function PreviewPanel({ templateKey }: PreviewPanelProps) {
  const { isDarkMode } = useAdminTheme()
  const [dummyJson, setDummyJson] = useState(DEFAULT_DATA)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const preview = usePreviewEmailTemplate(templateKey)

  const handleRender = () => {
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(dummyJson)
      setJsonError(null)
    } catch {
      setJsonError('Geçersiz JSON')
      return
    }
    preview.mutate({ data: parsed })
  }

  const inputClass = `w-full rounded-xl border px-3 py-2 text-xs font-mono outline-none transition-colors focus:ring-2 ${
    isDarkMode
      ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-600 focus:border-violet-500 focus:ring-violet-500/20'
      : 'border-gray-300 bg-white text-gray-900 focus:border-violet-500 focus:ring-violet-500/20'
  }`

  return (
    <div
      className={`mt-4 rounded-2xl border ${
        isDarkMode
          ? 'border-slate-800 bg-slate-900/40'
          : 'border-gray-200 bg-gray-50'
      } overflow-hidden`}
    >
      <div
        className={`flex items-center justify-between border-b px-4 py-3 ${
          isDarkMode ? 'border-slate-800' : 'border-gray-200'
        }`}
      >
        <h3
          className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Template Önizleme
        </h3>
        {!templateKey && (
          <span
            className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            Kaydetmeden önce önizleme kullanılamaz
          </span>
        )}
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-2">
        {/* Sol: dummy data JSON */}
        <div>
          <label
            className={`mb-1 block text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
          >
            Test Verisi (JSON)
          </label>
          <textarea
            value={dummyJson}
            onChange={e => {
              setDummyJson(e.target.value)
              setJsonError(null)
            }}
            rows={8}
            className={inputClass}
          />
          {jsonError && (
            <p className="mt-1 text-xs text-rose-500">{jsonError}</p>
          )}
          <button
            type="button"
            onClick={handleRender}
            disabled={!templateKey || preview.isPending}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
          >
            {preview.isPending ? 'Render ediliyor…' : 'Render Et'}
          </button>
        </div>

        {/* Sağ: iframe önizleme */}
        <div className="flex flex-col">
          {preview.data ? (
            <>
              <div
                className={`mb-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                  isDarkMode
                    ? 'border-slate-800 bg-slate-950/40 text-slate-200'
                    : 'border-gray-200 bg-white text-gray-800'
                }`}
              >
                <span className="text-xs opacity-60">Konu: </span>
                {preview.data.subject}
              </div>
              <iframe
                sandbox=""
                srcDoc={preview.data.html}
                className="flex-1 rounded-xl border"
                style={{ minHeight: '300px' }}
                title="Email önizlemesi"
              />
            </>
          ) : (
            <div
              className={`flex flex-1 items-center justify-center rounded-xl border ${
                isDarkMode
                  ? 'border-slate-800 bg-slate-950/40 text-slate-500'
                  : 'border-gray-200 bg-gray-100 text-gray-400'
              }`}
              style={{ minHeight: '200px' }}
            >
              <p className="text-sm">
                Önizleme için &quot;Render Et&quot;e bas
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
