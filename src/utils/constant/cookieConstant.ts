export enum CookieEnum {
  USER_CODE = 'userCode',
  ACCESS_TOKEN = 'accessToken',
  REFRESH_TOKEN = 'refreshToken',
  EXPIRED_DATE = 'expiredDate',
  TENANT_ID = 'tenantId',
}

/**
 * Cookie max-age (saniye).
 *
 * Backend token TTL'leri:
 *   - accessToken: 4 saat
 *   - refreshToken: 6 ay (~180 gün)
 *
 * Cookie max-age değerleri ilgili token'ın gerçek ömrüyle hizalandı.
 * - accessToken / expiredDate: 4 saat (token süresi dolduğunda cookie de düşer)
 * - refreshToken: 6 ay
 * - userCode / tenantId: 6 ay (refreshToken yaşadığı sürece kullanışlı kalır)
 *
 * NOT: accessToken cookie'si 4h sonra düşünce middleware sadece refreshToken
 * varsa yenileme dener; bu yüzden 4h sınırı kullanıcı UX'ini bozmuyor.
 */
const HOUR = 60 * 60
const DAY = HOUR * 24
const MONTH = DAY * 30

export const COOKIE_MAX_AGE: Record<CookieEnum, number> = {
  [CookieEnum.ACCESS_TOKEN]: HOUR * 4, // 4 saat
  [CookieEnum.EXPIRED_DATE]: HOUR * 4, // 4 saat (accessToken ile aynı)
  [CookieEnum.REFRESH_TOKEN]: MONTH * 6, // 6 ay
  [CookieEnum.USER_CODE]: MONTH * 6, // 6 ay
  [CookieEnum.TENANT_ID]: MONTH * 6, // 6 ay
}

/** Cookie adına göre max-age döner; bilinmeyen cookie için varsayılan 30 gün. */
export function getCookieMaxAge(name: string): number {
  return COOKIE_MAX_AGE[name as CookieEnum] ?? DAY * 30
}
