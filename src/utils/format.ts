/** Byte → insan-okunur (KB/MB/GB/TB), tr-TR ondalık. */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const k = 1024
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    units.length - 1,
  )
  const value = bytes / Math.pow(k, i)
  const formatted = new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: i === 0 ? 0 : decimals,
  }).format(value)
  return `${formatted} ${units[i]}`
}

const GiB = 1024 ** 3

/** GB → byte (limit input'u için). */
export const gbToBytes = (gb: number): number => Math.round(gb * GiB)
/** byte → GB (ondalık; limit input'unu doldurmak için). */
export const bytesToGb = (bytes: number): number => bytes / GiB
