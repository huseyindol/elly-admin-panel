import { SecuritySettings } from '@/app/_components/security/SecuritySettings'
import { StorageQuotaCard } from '@/app/_components/storage/StorageQuotaCard'

export const metadata = {
  title: 'Ayarlar',
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Ayarlar
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Hesap, güvenlik ve depolama ayarlarınızı yönetin.
        </p>
      </header>

      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-600">
          Hesap Güvenliği
        </h2>
        <SecuritySettings />
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-600">
          Depolama
        </h2>
        <StorageQuotaCard />
      </div>
    </div>
  )
}
