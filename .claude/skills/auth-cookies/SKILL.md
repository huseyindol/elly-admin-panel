---
name: auth-cookies
description: Reference for auth tokens, cookies, JWE decoding, max-age strategy, and the cookie-deletion pitfalls specific to this project. Apply whenever editing src/proxy.ts, src/proxy/*, src/utils/services/fetcher.ts, src/stores/{permission,user}-store.ts, login or logout flows.
license: MIT
---

# Auth & Cookie Pipeline — Project Rules

Bu dosya, projede tekrar tekrar yapılan auth/cookie hatalarını engelleyen yazılı kurallardır. **Düzenlemeye geçmeden önce ilgili madde varsa oku.**

## 1. JWT'yi `atob` ile decode etme

Backend JWT'leri **JWE** (encrypted, AES-256-GCM, 5 parça) — frontend'den içine bakılamaz. Roller / userId hiçbir zaman JWT claim'inden çıkartılmaz.

❌ Yanlış:

```ts
const payload = JSON.parse(atob(token.split('.')[1])) // JWE'de çalışmaz
```

✅ Doğru:

- Roller → `permission-store` (login response'undan dolar, persist edilir). Backend tazeleme: `/api/v1/users/me/permissions` → `usePermissionStore.refreshPermissions()`
- userId/username/email/userCode → `user-store` (login/refresh response'undan dolar)
- Reactive okuma → `useMyRoleLevel()`, `useMyUserId()` hook'ları
- Async (non-component): `getMyUserId()` önce store, yoksa `/api/v1/users/me`

## 2. Cookie max-age stratejisi

Tek kaynak: `src/utils/constant/cookieConstant.ts`.

| Cookie         | Max-age                                           | Kaynak                                     |
| -------------- | ------------------------------------------------- | ------------------------------------------ |
| `accessToken`  | Backend'in döndüğü `expiredDate` ile hizalı (~4h) | `deriveMaxAgeFromExpiredDate(expiredDate)` |
| `expiredDate`  | accessToken ile aynı                              | aynı                                       |
| `refreshToken` | 6 ay (sabit)                                      | `COOKIE_MAX_AGE[REFRESH_TOKEN]`            |
| `userCode`     | 6 ay (sabit)                                      | `COOKIE_MAX_AGE[USER_CODE]`                |
| `tenantId`     | 6 ay (sabit)                                      | `COOKIE_MAX_AGE[TENANT_ID]`                |

❌ **Yapma:** Cookie max-age'i hardcoded sayıyla ayarlamak. Her yeni cookie writer ya constant ya da `deriveMaxAgeFromExpiredDate` kullanmalı.

Yazıcı yerler (hep aynı stratejiyi izle):

- `src/app/(layoutLess)/login/page.tsx` — login response
- `src/utils/services/fetcher.ts` `csrRefreshToken` — CSR refresh
- `src/proxy/refreshTokenProxy.ts` — server-side middleware refresh
- `src/providers/Providers.tsx` `persistBrowserCookie` — generic CSR writer (max-age opsiyonel; verilmezse `getCookieMaxAge(name)`)

## 3. Cookie SİLME — Next.js dedup tuzağı

⚠ `response.cookies.set` (NextResponse) içinde **Map dedup** vardır: anahtar `name|domain|path`. Aynı tuple için birden fazla `set` çağrısı yapılırsa **yalnızca son set kalır**, diğerleri yutulur.

### Sonuç: deletion variants array'i set ile gönderirken çoğu kaybolur

❌ Yanlış (variants 1-8 yutulur, sadece 9. set Set-Cookie'ye dönüşür):

```ts
for (const variant of variants) {
  response.cookies.set(name, '', variant) // dedup nedeniyle son kazanır
}
```

✅ Doğru — `response.headers.append('set-cookie', ...)` raw header:

```ts
for (const v of variants) {
  response.headers.append(
    'set-cookie',
    `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${v}`,
  )
}
```

`src/proxy/removeCookies.ts` ve `src/app/api/auth/logout/route.ts` referans implementasyonu.

### Browser eşleştirme kuralı

Browser bir `Set-Cookie: name=` ile silme yaparken **yalnızca `name + Path + Domain`** eşleşmesine bakar (Secure/HttpOnly/SameSite eşleşmesi gerekmez). Ama:

- `localhost` üzerinde HTTP'de `Secure` flag'i tek başına Set-Cookie'yi reddetmez ama tarayıcı versiyonuna göre değişebilir — silme için Secure'suz varyant da gönderilir
- Eski deploy'lar `.huseyindol.com` domain'inde set etmiş olabilir → domain varyantı da gönderilir
- HttpOnly cookies **JS'ten silinemez** (`document.cookie = ...; max-age=0`) → server endpoint'i şart

## 4. Logout/Auth failure akışı

CSR'de bir API 401 alır ve refresh başarısız olursa:

1. `fetcher.handleAuthFailure` çağrılır
2. JS-erişimli cookie'ler + localStorage (`permission-storage`, `user-storage`) best-effort silinir
3. `window.location.replace('/api/auth/logout')` — server route handler raw `Set-Cookie` header'larıyla 9 varyant gönderir + `Location: /login`
4. Browser cookie'leri siler ve `/login`'e gider
5. `/login` middleware'i de stale auth varsa self-heal eder (`expiredDate < now` ise temizler)

## 5. `src/proxy.ts` middleware semantiği

- Next.js 16'da middleware dosyası `proxy.ts` adıyla yazılır (eski `middleware.ts` yerine)
- `isAuthenticated = hasAccess || canRefresh` — accessToken cookie'si düşmüş olsa bile refreshToken varsa "yetkili" sayılır
- Korumalı route'a girerken accessToken yok veya expired ise: refreshToken varsa `refreshTokenProxy` çağırılır; başarısızsa `removeCookies` + `/login`

## Checklist — yeni bir auth/cookie kodu yazarken

- [ ] Cookie max-age'i `cookieConstant`'tan veya `deriveMaxAgeFromExpiredDate`'ten alındı
- [ ] JWT decode girişimi YOK
- [ ] Roller / kullanıcı bilgisi zustand store'larından okunuyor
- [ ] Toplu cookie silme `response.headers.append('set-cookie', ...)` kullanıyor (dedup yok)
- [ ] HttpOnly cookie silme client'tan denenmiyor; server endpoint'i veya middleware
- [ ] `localStorage.removeItem('permission-storage')` ve `'user-storage'` da temizleniyor

## İlgili Dosyalar

- `src/utils/constant/cookieConstant.ts` — sabitler + helper
- `src/utils/services/fetcher.ts` — CSR refresh + handleAuthFailure
- `src/proxy.ts` + `src/proxy/refreshTokenProxy.ts` + `src/proxy/removeCookies.ts` — middleware
- `src/app/api/auth/logout/route.ts` — server logout endpoint
- `src/stores/permission-store.ts` + `src/stores/user-store.ts` — kimlik & yetki
- `src/app/(layoutLess)/login/page.tsx` — login flow + stale auth self-heal mount effect
