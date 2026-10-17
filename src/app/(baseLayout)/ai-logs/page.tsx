import { Suspense } from 'react'
import { AiLogsClient } from './_components/AiLogsClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'AI Kullanım Logları',
}

export default function AiLogsPage() {
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          AI Kullanım Logları &amp; Raporlama
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Gemini AI endpoint çağrılarını, gönderilen prompt ve girdileri, dönen
          yanıtları ve token tüketimini inceleyin.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="h-96 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        }
      >
        <AiLogsClient />
      </Suspense>
    </div>
  )
}
