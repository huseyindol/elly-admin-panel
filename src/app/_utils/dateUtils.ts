/**
 * Basit relative time formatter — external kütüphane eklemeden
 * ("3 dk önce", "2 saat önce", "5 gün önce").
 *
 * date-fns, dayjs gibi paket kurmadık çünkü tek bir helper yeterli.
 */
const UNITS: Array<{ limit: number; divisor: number; unit: string }> = [
  { limit: 60, divisor: 1, unit: 'saniye' },
  { limit: 3600, divisor: 60, unit: 'dk' },
  { limit: 86400, divisor: 3600, unit: 'saat' },
  { limit: 604800, divisor: 86400, unit: 'gün' },
  { limit: 2592000, divisor: 604800, unit: 'hafta' },
  { limit: 31536000, divisor: 2592000, unit: 'ay' },
]

export function formatRelativeTime(input: string | Date | null): string {
  if (!input) return '—'
  const date = input instanceof Date ? input : new Date(input)
  const ms = Date.now() - date.getTime()
  if (Number.isNaN(ms)) return '—'
  const absSeconds = Math.floor(Math.abs(ms) / 1000)
  if (absSeconds < 5) return 'az önce'

  const suffix = ms >= 0 ? ' önce' : ' sonra'

  for (const { limit, divisor, unit } of UNITS) {
    if (absSeconds < limit) {
      const value = Math.floor(absSeconds / divisor)
      return `${value} ${unit}${suffix}`
    }
  }
  const years = Math.floor(absSeconds / 31536000)
  return `${years} yıl${suffix}`
}

export function formatAbsoluteTime(input: string | Date | null): string {
  if (!input) return '—'
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
