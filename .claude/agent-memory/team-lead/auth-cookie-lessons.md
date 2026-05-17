# Auth & Cookie Pipeline — Karar Notları (2026-05-17)

> Mayıs ortasında art arda gelen cookie temizleme / refresh loop bug'larından çıkardığımız kararlar. Yeni auth/cookie kodu yazmadan önce bu dosyayı oku. Detaylı uygulama kuralları için `.claude/skills/auth-cookies/SKILL.md`.

## Bağlam

Backend (Spring Boot) token politikası:

- accessToken: **4 saat** (JWE — AES-256-GCM encrypted JWT)
- refreshToken: **6 ay**
- Login/refresh response içeriği: `token, refreshToken, type, userId, username, email, userCode, expiredDate, roles, permissions`

## Tartışılan ve Reddedilen Yaklaşımlar

### ❌ JWT'yi `atob` ile decode etmek

İlk implementasyon `getMyRoleLevel()` JWT payload'undan rolleri okuyordu. JWE format JSON parse edilemez — fonksiyon her zaman 1 (VIEWER) döndürüyordu, SUPER_ADMIN bile delete butonunu göremiyordu. Bunun yerine permission-store kuruldu.

### ❌ `response.cookies.set` ile 9 silme varyantı

`NextResponse` cookies API'sinin Map dedup'ı var. Aynı `name|domain|path` için son set kazanıyor, diğer 8 varyant Set-Cookie header'ına dönüşmüyor. Sonuç: `Secure+HttpOnly+SameSite=Strict` flag'li tek varyant browser tarafından `localhost` üzerinde reddedildiği için cookie silinmiyordu → sonsuz redirect loop.

### ❌ JS'ten HttpOnly cookie silmek

`document.cookie = 'name=; max-age=0'` HttpOnly cookies için no-op. Login page mount effect'inde temizlik denenmişti — işe yaramıyordu.

## Kabul Edilen Mimari

### Üç katmanlı kimlik state

| Katman                       | Veri                                                         | Persist                              |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------------ |
| `permission-store` (zustand) | `roles[]`, `permissions[]`, `isLoaded`                       | localStorage `permission-storage`    |
| `user-store` (zustand)       | `id, username, email, userCode, isLoaded`                    | localStorage `user-storage`          |
| Cookies (browser)            | `accessToken, refreshToken, expiredDate, userCode, tenantId` | HTTP-only ve secure (httpOnly: true) |

### Cookie max-age

Tek kaynak `src/utils/constant/cookieConstant.ts`:

- `accessToken / expiredDate` → backend'in döndüğü `expiredDate`'ten türetilir (`deriveMaxAgeFromExpiredDate`)
- Diğerleri sabit (6 ay)

Tüm yazıcılar bu kaynaktan okur: `Providers.persistBrowserCookie`, login page, `csrRefreshToken`, `refreshTokenProxy`.

### Cookie silme

3 yol var, koşullara göre seç:

1. **Server endpoint** (`GET /api/auth/logout`) — plain `Response` + raw `Set-Cookie` header'ları, 9 varyant. Client'tan navigation ile (`window.location.replace`).
2. **Middleware** (`src/proxy/removeCookies.ts`) — `response.headers.append('set-cookie', ...)` ile aynı 9 varyant. `proxy.ts` içinde refresh fail veya `/login` self-heal'de çağrılır.
3. **Client best-effort** (`fetcher.removeAllAuthCookies`) — JS-erişimli cookie'ler için `document.cookie = '...; max-age=0'` + localStorage temizliği. HttpOnly'leri silemez, sadece tamamlayıcı.

### Reactive hook pattern

Component'lerde async fetch + useState pattern'i değil, zustand selector hook'lar:

```ts
const myLevel = useMyRoleLevel() // permission-store'dan
const myUserId = useMyUserId() // user-store'dan
```

Store dolar dolmaz component re-render olur. Async helper'lar (`getMyUserId`) yalnızca non-component context için — örn. `chat-ws-store.onConnect`.

### Middleware (`src/proxy.ts`)

- Next.js 16'da dosya adı `middleware.ts` değil `proxy.ts`
- `isAuthenticated = hasAccess || canRefresh` — accessToken yokken refresh token varsa hâlâ "yetkili"
- Korumalı rotaya gelince accessToken eksik/expired ise refreshToken varsa sessizce yenileme; başarısızsa `removeCookies` + `/login`
- `/login` self-heal: stale auth saptanırsa cookies temizlenir, redirect yerine login servis edilir → loop kırılır

## Kontrol Listesi (yeni auth/cookie kodu yazarken)

- [ ] Cookie max-age constant veya helper'dan alındı
- [ ] JWT decode girişimi yok
- [ ] Roller / kullanıcı bilgisi zustand store'larından
- [ ] Toplu silme `headers.append('set-cookie', ...)` ile (cookies.set değil)
- [ ] HttpOnly silme server endpoint'i veya middleware üzerinden
- [ ] `localStorage.removeItem('permission-storage')` + `'user-storage'`

## İlgili Commit'ler

- `d300563` fix(auth): server-side logout endpoint to actually delete HttpOnly cookies
- `0f61496` fix(proxy): bypass cookies-API dedup + self-heal stale /login
- `e66084f` fix(proxy): brute-force cookie deletion across all attribute variants
- `93c958b` fix(fetcher): reliably clear auth state and redirect on 401
- `da60d4a` fix(chat): resolve roles via API instead of decoding JWE token
- `4e77ed0` fix(auth): align cookie TTLs with backend (access 4h / refresh 6m) + smart refresh
- `b64432e` fix(auth): derive accessToken cookie TTL from backend expiredDate
- `38f8649` feat(auth): persist user identity in zustand store like permissions
- `d06d200` fix(chat): reactive role level so SUPER_ADMIN delete works reliably
