import { Suspense } from 'react'
import { requirePermission } from '@/lib/auth/permissions.server'
import { Permissions } from '@/types/cms'
import { EmailLogsClient } from './_components/EmailLogsClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Email Logları',
}

export default async function EmailLogsPage() {
  await requirePermission(Permissions.EMAILS_READ)

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Email Logları
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Gönderilen ve kuyruktaki mailleri takip edin, başarısızları yeniden
          kuyruğa alın.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="h-96 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        }
      >
        <EmailLogsClient />
      </Suspense>
    </div>
  )
}
