import { requirePermission } from '@/lib/auth/permissions.server'
import { Permissions } from '@/types/cms'
import { OverviewCard } from './_components/OverviewCard'
import { QueueTable } from './_components/QueueTable'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'RabbitMQ Yönetimi',
}

export default async function RabbitMqPage() {
  await requirePermission(Permissions.RABBIT_READ)

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            RabbitMQ Yönetimi
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Broker durumunu izleyin, queue&apos;ları yönetin, mesajları peek
            edin veya yeniden publish edin.
          </p>
        </div>
      </header>

      <OverviewCard />
      <QueueTable />
    </div>
  )
}
