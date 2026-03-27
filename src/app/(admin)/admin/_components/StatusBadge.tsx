'use client'

interface StatusBadgeProps {
  status: boolean
  activeText?: string
  inactiveText?: string
}

export function StatusBadge({
  status,
  activeText = 'Aktif',
  inactiveText = 'Pasif',
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        status
          ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
          : 'border-rose-500/30 bg-rose-500/20 text-rose-400'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status ? 'bg-emerald-400' : 'bg-rose-400'
        }`}
      />
      {status ? activeText : inactiveText}
    </span>
  )
}
