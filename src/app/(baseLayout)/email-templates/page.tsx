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
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Email Templates
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Sistemde tanımlı Thymeleaf email template&apos;lerinin listesi.
          Template yönetimi (oluşturma/düzenleme) v4 backend ile gelecek.
        </p>
      </header>

      <TemplateListTable />
    </div>
  )
}
