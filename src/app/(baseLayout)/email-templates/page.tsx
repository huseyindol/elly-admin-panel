import Link from 'next/link'
import { requirePermission } from '@/lib/auth/permissions.server'
import { Permissions } from '@/types/cms'
import { TemplateListTable } from './_components/TemplateListTable'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Email Templates',
}

export default async function EmailTemplatesPage() {
  await requirePermission(Permissions.EMAIL_TEMPLATES_READ)

  return (
    <div className="space-y-6 p-6">
      {/* v4 backend henüz deploy edilmedi — bu banner kaldırılacak */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-950/30">
        <span className="mt-0.5 text-amber-500">⚠️</span>
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Backend henüz hazır değil
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <code className="rounded bg-amber-100 px-1 py-0.5 text-xs dark:bg-amber-900/50">
              /api/v1/email-templates
            </code>{' '}
            endpoint&apos;leri v4 kapsamında yazılacak — şu an 404 döner. v4
            deploy edildiğinde bu uyarı kaldırılacak.
          </p>
        </div>
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Email Templates
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Veritabanında saklanan Thymeleaf email template&apos;lerini yönetin.
          </p>
        </div>
        <Link
          href="/email-templates/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40"
        >
          <span className="text-lg leading-none">+</span>
          <span>Yeni Template</span>
        </Link>
      </header>

      <TemplateListTable />
    </div>
  )
}
