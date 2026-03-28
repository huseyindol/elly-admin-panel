'use client'

import { generateArticleAction } from '@/actions/generate-article'
import { useAdminTheme } from '@/app/_hooks'
import { useState } from 'react'
import { toast } from 'sonner'

interface AiArticlePanelProps {
  onGenerated: (html: string) => void
}

export default function AiArticlePanel({ onGenerated }: AiArticlePanelProps) {
  const { isDarkMode } = useAdminTheme()
  const [topic, setTopic] = useState('')
  const [keywords, setKeywords] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500'
  }`

  const labelClass = `block text-xs font-medium mb-1.5 ${
    isDarkMode ? 'text-slate-400' : 'text-gray-500'
  }`

  async function handleGenerate() {
    if (!topic.trim()) {
      toast.error('Makale konusu giriniz')
      return
    }

    setIsGenerating(true)
    toast.info('Makale oluşturuluyor... (Article Agent → Frontend Agent)')

    try {
      const result = await generateArticleAction({ topic, keywords })

      if (!result.success || !result.html) {
        toast.error(result.error || 'Makale oluşturulamadı')
        return
      }

      onGenerated(result.html)
      toast.success('Makale başarıyla oluşturuldu ve içerik alanına eklendi')
    } catch {
      toast.error('Makale oluşturulurken bir hata oluştu')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        isDarkMode
          ? 'border-violet-500/30 bg-violet-950/20'
          : 'border-violet-200 bg-violet-50'
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base">✨</span>
        <span
          className={`text-sm font-semibold ${
            isDarkMode ? 'text-violet-300' : 'text-violet-700'
          }`}
        >
          AI Makale Oluşturucu
        </span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
            isDarkMode
              ? 'bg-violet-800/50 text-violet-300'
              : 'bg-violet-100 text-violet-600'
          }`}
        >
          Gemini
        </span>
      </div>

      <div className="space-y-3">
        {/* Topic */}
        <div>
          <label className={labelClass}>Makale Konusu *</label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            className={inputClass}
            placeholder="Örn: React Server Components nasıl çalışır?"
            disabled={isGenerating}
          />
        </div>

        {/* Keywords */}
        <div>
          <label className={labelClass}>Yardımcı Anahtar Kelimeler</label>
          <input
            type="text"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            className={inputClass}
            placeholder="Örn: performans, SSR, hydration, Next.js"
            disabled={isGenerating}
          />
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 ${
            isDarkMode
              ? 'bg-violet-600 text-white hover:bg-violet-500 disabled:hover:bg-violet-600'
              : 'bg-violet-600 text-white hover:bg-violet-700 disabled:hover:bg-violet-600'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Makale Oluşturuluyor...</span>
            </span>
          ) : (
            '✨ Makale Oluştur'
          )}
        </button>

        {isGenerating && (
          <p
            className={`text-center text-xs ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`}
          >
            Article Agent konu planlıyor → Frontend Agent HTML formatını
            düzenliyor
          </p>
        )}
      </div>
    </div>
  )
}
