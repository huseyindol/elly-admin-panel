'use client'

import { useMailAccounts } from '@/app/_hooks/useMailAccounts'
import { useAdminTheme } from '@/app/_hooks'

interface MailAccountSelectProps {
  value?: number | null
  onChange: (id: number | null) => void
}

export function MailAccountSelect({ value, onChange }: MailAccountSelectProps) {
  const { isDarkMode } = useAdminTheme()
  const { data, isLoading } = useMailAccounts()

  const activeAccounts = data?.data?.filter(account => account.active) ?? []

  const selectClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 focus:border-violet-500'
  }`

  return (
    <select
      value={value ?? ''}
      onChange={e => {
        const val = e.target.value
        onChange(val === '' ? null : Number(val))
      }}
      disabled={isLoading}
      className={selectClass}
    >
      <option value="">Varsayılan (otomatik)</option>
      {activeAccounts.map(account => (
        <option key={account.id} value={account.id}>
          {account.name} — {account.fromAddress}
        </option>
      ))}
    </select>
  )
}
