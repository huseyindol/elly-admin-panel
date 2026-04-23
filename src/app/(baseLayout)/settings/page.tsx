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
          Panel ayarları yakında burada olacak.
        </p>
      </header>

      <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 py-24 dark:border-slate-700">
        <p className="text-sm text-gray-400 dark:text-slate-500">
          Henüz yapılandırılacak bir ayar yok.
        </p>
      </div>
    </div>
  )
}
