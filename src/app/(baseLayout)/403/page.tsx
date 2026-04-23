import Link from 'next/link'

export const metadata = {
  title: 'Yetki Yok — 403',
}

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-6xl font-bold text-violet-500">403</div>
      <h1 className="text-2xl font-semibold">Yetkin yok</h1>
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
        Bu sayfaya erişmek için gerekli yetkilere sahip değilsin. Bir admin ile
        iletişime geçip ilgili izinleri iste.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40"
      >
        Dashboard&apos;a Dön
      </Link>
    </div>
  )
}
