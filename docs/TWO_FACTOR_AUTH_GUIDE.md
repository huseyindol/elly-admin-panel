# İki Adımlı Doğrulama (2FA / MFA) — Kullanım Rehberi

> TOTP tabanlı (Google Authenticator, Authy vb.) iki adımlı doğrulama. İki parça:
> (A) Ayarlar → Hesap Güvenliği'nde 2FA aç/kapat, (B) login akışında 2FA 2. adımı.

## Genel Bakış

```
Login (kullanıcı/şifre)
  └─ POST /api/v1/auth/login
       ├─ mfaRequired:false → cookie'ler yazılır → /dashboard
       └─ mfaRequired:true  → mfaToken döner (token:null)
              └─ 6 haneli kod ekranı
                   └─ POST /api/v1/auth/mfa/verify { mfaToken, code }
                        └─ tam LoginResponse → cookie'ler yazılır → /dashboard

Ayarlar → Hesap Güvenliği
  ├─ GET  /api/v1/auth/mfa/status        → { mfaEnabled }
  ├─ Etkinleştir:
  │    GET  /api/v1/auth/mfa/setup        → { secret, qrUri, issuer }
  │    POST /api/v1/auth/mfa/setup/verify { code }   → etkinleştirildi
  └─ Devre dışı:
       POST /api/v1/auth/mfa/disable     { password } → kapatıldı
```

## Dosya Yapısı

```
src/types/mfa.ts                                  # MfaSetupResponse, MfaStatus
src/types/AuthResponse.ts                         # LoginResponse + mfaRequired?, mfaToken?
src/app/_services/mfa.services.ts                 # 5 servis (status/setup/setupVerify/disable/verifyLogin)
src/utils/services/fetcher.ts                     # /auth/mfa/verify → Authorization strip
src/app/_components/security/
  ├── SecuritySettings.tsx                         # Durum kartı + enable/disable (client)
  ├── MfaSetupDialog.tsx                            # QR + secret + 6 hane doğrulama
  └── MfaDisableDialog.tsx                          # Şifreyle kapatma
src/app/(baseLayout)/settings/page.tsx            # SecuritySettings'i render eder (server + metadata)
src/app/(layoutLess)/login/page.tsx               # 2FA 2. adımı (applyLoginSuccess helper)
```

## API / Servis Referansı

`src/app/_services/mfa.services.ts` — tüm yanıtlar `RootEntityResponse<T>` (`{ result, message, data }`) sarmalı; servisler `data`'yı unwrap eder, `result:false` ise `Error(message)` fırlatır.

| Servis                  | Method/Path                          | Auth               | Body                 | Döner              |
| ----------------------- | ------------------------------------ | ------------------ | -------------------- | ------------------ |
| `getMfaStatusService`   | GET `/api/v1/auth/mfa/status`        | JWT                | —                    | `MfaStatus`        |
| `getMfaSetupService`    | GET `/api/v1/auth/mfa/setup`         | JWT                | —                    | `MfaSetupResponse` |
| `verifyMfaSetupService` | POST `/api/v1/auth/mfa/setup/verify` | JWT                | `{ code }`           | `string`           |
| `disableMfaService`     | POST `/api/v1/auth/mfa/disable`      | JWT                | `{ password }`       | `string`           |
| `verifyLoginMfaService` | POST `/api/v1/auth/mfa/verify`       | **yok** (mfaToken) | `{ mfaToken, code }` | `LoginResponse`    |

```typescript
export interface MfaSetupResponse {
  secret: string // Base32 — manuel giriş
  qrUri: string // otpauth://totp/... — QR olarak render
  issuer: string
}
export interface MfaStatus {
  mfaEnabled: boolean
}
```

## Kullanım Örnekleri

**Durum sorgusu (TanStack Query):**

```typescript
const { data } = useQuery({
  queryKey: ['mfa', 'status'],
  queryFn: getMfaStatusService,
})
const mfaEnabled = data?.mfaEnabled ?? false
```

**Login 2. adımı (login/page.tsx içinde):**

```typescript
if (response.data?.mfaRequired && response.data?.mfaToken) {
  setMfaToken(response.data.mfaToken) // sadece bellek — persist YOK
  setStep('mfa')
  return
}
// verify:
const data = await verifyLoginMfaService(mfaToken, mfaCode)
applyLoginSuccess(data, pendingTenantId) // login ile birebir aynı oturum
```

## Önemli Davranışlar / Edge Case'ler

- **`mfaToken` kısa ömürlü (~5 dk):** Yalnızca component state'inde tutulur; localStorage/cookie'ye **yazılmaz**. Süresi dolarsa kullanıcı baştan login olur.
- **`/auth/mfa/verify` JWT gerektirmez:** `fetcher.ts` bu URL için `Authorization` header'ını strip eder (`/auth/login`, `/auth/refresh` ile aynı liste).
- **Oturum eşitliği:** Backend `/mfa/verify` başarılıda login ile **aynı HttpOnly cookie'leri** (access/refresh/userCode/expiredDate) set eder; panel ayrıca `applyLoginSuccess` ile client-side cookie + zustand store'larını yazar.
- **QR güvenliği:** `secret` yalnızca ekranda gösterilir; loglanmaz/analytics'e gönderilmez. QR client-side (`qrcode.react`) render edilir — 3. parti servise gitmez.
- **Yanlış kod:** Backend `result:false` (HTTP 200) döndüğü varsayımıyla servis `Error(message)` fırlatır, ekranda hata gösterilir. Backend HTTP 401 dönerse fetcher refresh denemesi yapabilir — gerçek davranış login ekranında doğrulanmalı.
- **Kod alanı:** Yalnızca 6 rakam (`inputMode="numeric"`, `\D` otomatik trim).

## Kontrol Listesi (Bu modülü tekrar eklerken)

- [ ] `qrcode.react` kurulu (`bun add qrcode.react`)
- [ ] `LoginResponse`'a `mfaRequired?` + `mfaToken?` eklendi
- [ ] `fetcher.ts` strip-list'inde `/auth/mfa/verify` var
- [ ] `mfa.services.ts` 5 servis: status/setup/setupVerify/disable/verifyLogin
- [ ] Ayarlar sayfası `SecuritySettings`'i render ediyor
- [ ] Login `mfaRequired` dalı + 6 hane ekranı + `applyLoginSuccess`
- [ ] Backend SUPER_ADMIN'e `mfa/*` endpoint izinleri tanımlı

```

```
