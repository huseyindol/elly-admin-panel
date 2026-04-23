'use client'

import { useState } from 'react'
import { useAdminTheme } from '@/app/_hooks'
import { usePreviewEmailTemplate } from '@/app/_hooks/useEmailTemplates'

interface PreviewPanelProps {
  templateKey: string
}

const DEFAULT_DATA = JSON.stringify(
  { userName: 'Ahmet', link: 'https://example.com' },
  null,
  2,
)

export function PreviewPanel({ templateKey }: PreviewPanelProps) {
  const { isDarkMode } = useAdminTheme()
  const [jsonInput, setJsonInput] = useState(DEFAULT_DATA)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewSubject, setPreviewSubject] = useState<string | null>(null)

  const preview = usePreviewEmailTemplate(templateKey)

  const handleRender = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonError(null)
      preview.mutate(
        { data: parsed },
        {
          onSuccess: result => {
            setPreviewHtml(result.html)
            setPreviewSubject(result.subject)
          },
        },
      )
    } catch {
      setJsonError('Geçersiz JSON formatı')
    }
  }

  return (
    <div className="space-y-4">
      <h3
        className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}
      >
        Önizleme
      </h3>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sol — JSON girişi */}
        <div className="space-y-2">
          <label
            className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            Test Verisi (JSON)
          </label>
          <textarea
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
            rows={8}
            spellCheck={false}
            className={`w-full rounded-xl border px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              isDarkMode
                ? 'border-slate-700 bg-slate-800 text-slate-200'
                : 'border-gray-300 bg-white text-gray-800'
            } ${jsonError ? 'border-rose-500' : ''}`}
          />
          {jsonError && <p className="text-xs text-rose-500">{jsonError}</p>}
          <button
            type="button"
            onClick={handleRender}
            disabled={preview.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {preview.isPending ? 'Render ediliyor…' : 'Render Et'}
          </button>
        </div>

        {/* Sağ — iframe önizleme */}
        <div className="space-y-2">
          {previewSubject && (
            <p
              className={`truncate text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
            >
              Konu: <span className="font-normal">{previewSubject}</span>
            </p>
          )}
          <div
            className={`overflow-hidden rounded-xl border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}
          >
            {previewHtml ? (
              <iframe
                sandbox=""
                srcDoc={previewHtml}
                className="h-96 w-full"
                title="Email önizlemesi"
              />
            ) : (
              <div
                className={`flex h-96 items-center justify-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
              >
                Render Et butonuna basarak önizle
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
