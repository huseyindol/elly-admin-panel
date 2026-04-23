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
