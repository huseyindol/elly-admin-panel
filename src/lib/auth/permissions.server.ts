import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CookieEnum } from '@/utils/constant/cookieConstant'
import type { Permission } from '@/types/cms'

/**
 * Server Component / Server Action / Route Handler içinde permission kontrolü.
 *
 * Access token JWE (şifreli: alg=dir, enc=A256GCM) olduğu için claim'ler client/SSR'da
 * decode EDİLEMEZ. Bu yüzden izinler backend'den (`/api/v1/users/me/permissions`)
 * cookie'deki token ile çekilir. (Eski sürüm token'ı decode etmeye çalışıyordu → JWE'de
 * hep boş dönüyordu; guard'lar da bypass'tı.)
 *
 * `process.env.NEXT_PUBLIC_API` = backend origin (fetcher ile aynı kaynak).
 */
async function fetchPermissions(): Promise<string[] | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(CookieEnum.ACCESS_TOKEN)?.value
  if (!token) return null
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API}/api/v1/users/me/permissions`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    )
    if (!res.ok) return null
    const body = (await res.json()) as { data?: { permissions?: string[] } }
    return body.data?.permissions ?? []
  } catch {
    return null // ağ/servis hatası → çağıran fail-open yorumlar
  }
}

/** Mevcut kullanıcının izin listesi (hata/eksikte boş liste). */
export async function getCurrentPermissions(): Promise<string[]> {
  return (await fetchPermissions()) ?? []
}

/** Tek bir izin var mı? (hata/eksikte false) */
export async function hasPermissionServer(
  permission: Permission | string,
): Promise<boolean> {
  return (await getCurrentPermissions()).includes(permission as string)
}

/**
 * Route guard: izin yoksa yönlendirir. `redirect()` Next.js'in `NEXT_REDIRECT`
 * throw'una dönüşür — page içinde yakalama.
 *
 * - Token yoksa → `redirectTo` (varsayılan `/login`).
 * - İzin servisi HATA verirse → **fail-open** (engelleme; backend `@PreAuthorize` zaten korur).
 * - İzin başarıyla çekildi ama gerekli izin yoksa → `forbiddenTo` (varsayılan `/dashboard`).
 */
export async function requirePermission(
  permission: Permission | string,
  options: { redirectTo?: string; forbiddenTo?: string } = {},
): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(CookieEnum.ACCESS_TOKEN)?.value
  if (!token) {
    redirect(options.redirectTo ?? '/login')
  }

  const perms = await fetchPermissions()
  // perms === null → token vardı ama izin servisi hata verdi → FAIL-OPEN (geçme).
  if (perms !== null && !perms.includes(permission as string)) {
    redirect(options.forbiddenTo ?? '/dashboard')
  }
}
