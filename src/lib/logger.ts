/**
 * Server-side logger utility
 *
 * - Development: tüm seviyeleri terminale yazar
 * - Production:  sadece warn ve error seviyeleri yazılır (console.log yasak kuralına uygun)
 * - DEBUG=true env set edilirse development'ta debug seviyesi de aktif olur
 */

const isDev = process.env.NODE_ENV !== 'production'
const isDebug = isDev && process.env.DEBUG === 'true'

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 23)
}

function prefix(level: string): string {
  return `[${timestamp()}] [${level}]`
}

export const logger = {
  /** Bilgilendirici log — sadece development */
  info(message: string, ...args: unknown[]): void {
    if (isDev) {
      process.stdout.write(
        `${prefix('INFO')} ${message}${args.length ? ' ' + JSON.stringify(args) : ''}\n`,
      )
    }
  },

  /** Uyarı log — her ortamda */
  warn(message: string, ...args: unknown[]): void {
    process.stderr.write(
      `${prefix('WARN')} ${message}${args.length ? ' ' + JSON.stringify(args) : ''}\n`,
    )
  },

  /** Hata log — her ortamda */
  error(message: string, error?: unknown): void {
    const errStr =
      error instanceof Error
        ? ` — ${error.message}`
        : error !== undefined
          ? ` — ${String(error)}`
          : ''
    process.stderr.write(`${prefix('ERROR')} ${message}${errStr}\n`)
    if (isDev && error instanceof Error && error.stack) {
      process.stderr.write(error.stack + '\n')
    }
  },

  /** Debug log — sadece DEBUG=true ile development */
  debug(message: string, ...args: unknown[]): void {
    if (isDebug) {
      process.stdout.write(
        `${prefix('DEBUG')} ${message}${args.length ? ' ' + JSON.stringify(args) : ''}\n`,
      )
    }
  },
}
