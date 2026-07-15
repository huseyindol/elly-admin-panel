# URL-Tenant Modeli (Multi-Tenant Yönlendirme)

> **Tek kural:** Kimlik (kim olduğun) **her zaman** JWT'de taşınır; hedef tenant
> (hangi DB'ye gidileceği) **her zaman** URL path'inde taşınır.
> `X-Tenant-Id` header'ı ve "tenant-switch token" **KULLANILMAZ**.

Bu doküman, admin'in **başka bir tenant adına** yaptığı işlemlerin (tenant chat —
TC, depolama kotası) hangi tenant DB'sine gideceğinin nasıl belirlendiğini ve bu
modele neden geçtiğimizi anlatır. Panel (`elly-admin-panel`) commit `d708cb2`,
backend (`elly`) commit `5e94674`.

---

## 1. Neden bu model? (kararın hikâyesi)

Üç aşamadan geçtik:

1. **`X-Tenant-Id` header (eski).** Çalışıyordu ama tenant bilgisini güvensiz raw
   header'dan okumak "tenant bilgisi JWT claim'inden gelmeli" ilkesine aykırıydı.
   Ayrıca **yalnız bu birkaç servis için** ekstra bir header kuralı olması, ileri
   dönük review'u zorlaştırıyordu. Bu yüzden header desteği kaldırıldı.

2. **Tenant-switch token (kırık ara çözüm).** Header kalkınca TC/kota için tenant
   taşıyacak bir mekanizma gerekti; `POST /api/v1/tenants/token` ile **kimliksiz**
   bir JWT (`tenantId` + `type=tenant`, kullanıcı yok) üretildi. Bu token
   `isAuthenticated()` isteyen endpoint'lerde reddediliyordu → **TC sekmesi kırıldı**.
   Admin aslında kendi kimliğiyle yazabilmeliydi; sorun kimlik değil, **DB seçimiydi**.

3. **URL-tenant (final).** Hedef tenant'ı URL path'ine koyduk. Bu kalıp zaten
   sistemde vardı:
   - WebSocket: `/app/tenant-chat/{tid}/{groupId}/send`
   - Public (anonim) REST: `/api/v1/public/{tid}/...`
   - Admin tenant-users: `/api/v1/admin/tenants/{tid}/users`

   Artık chat/kota da aynı kalıbı kullanıyor → **chat'e özel istisna kalmadı**,
   kural tek ve uniform: *kimlik JWT'de, hedef tenant URL'de.*

---

## 2. Endpoint kalıbı

> Not (AC=TC): basedb kaldırıldı. Soldaki "varsayılan" yollar artık admin'in **kendi tenant DB'sinde**
> çalışır (JWT `tenantId` claim'i); sağdaki `{tid}` yolları başka bir tenant hedeflemek içindir.

| Bağlam | Varsayılan (kendi tenant'ı) | TC / hedef tenant |
|--------|-----------------------------|-------------------|
| Chat REST | `/api/v1/chat/...` | `/api/v1/chat/tenant/{tid}/...` |
| Storage kota | `/api/v1/storage/quota` | `/api/v1/storage/tenant/{tid}/quota` |
| WebSocket (send/typing/read) | `/app/chat/{groupId}/...` | `/app/tenant-chat/{tid}/{groupId}/...` |
| Public visitor chat (anonim) | — | `/api/v1/public/{tid}/tenant-chat/...` |

Kimlik tüm bu çağrılarda admin'in **kendi** `Authorization: Bearer <JWT>`'sidir
(`fetcher` cookie'den otomatik ekler). URL'deki `{tid}` yalnızca **hangi DB**
sorusunu yanıtlar.

---

## 3. Güvenlik garantileri

- URL-tenant kalıbı backend'de **yalnız `loginSource = admin`** kimliğiyle çalışır.
  Tenant kullanıcısı URL'ye başka bir tenant yazarak oraya **sıçrayamaz**.
- Bilinmeyen tenant → `400 Bad Request`.
- Admin kimliği **kendi tenant DB'sinden** yüklenir (JWT `tenantId` claim'i; basedb yok);
  veri işlemleri URL'deki tenant DB'sinde olur → kimlik ve veri ayrışması net.

---

## 4. Panel'de (`elly-admin-panel`) ne değişti

- `app/_services/chat.services.ts` → `chatBase(tid)` = `/api/v1/chat/tenant/{tid}`.
- `app/_services/storage.services.ts` → `quotaBase(tid)` =
  `/api/v1/storage/tenant/{tid}/quota`.
- `tcAuth` / `tenantToken` parametreleri, `X-Tenant-Id` (`tenantHeader`) ve
  `utils/services/fetcher.ts`'deki `overrideAuth` **tamamen kaldırıldı**.
- `stores/chat-ws-store.ts`'den `activeTenantToken` state'i + `getTenantTokenService`
  çağrısı silindi (WS destination/topic tenant-aware kalmaya devam ediyor).
- `uploadChatFileService` artık `tenantId` alır → TC dosyaları doğru tenant
  klasörüne/kotasına yazılır.
- **Silinen dosyalar:** `app/_services/tenant.services.ts`, `utils/tenantHeader.ts`.
- Etkilenen bileşenler: `chat/page.tsx`, `ChatWindow`, `ChatInput`, `ChatMemberList`,
  `ChatSidebar`, `CreateGroupDialog`, `useChatGroupAccess`.

---

## 5. Backend'de (`elly`) ne değişti

- `JwtTenantFilter`: `^/api/v1/(chat|storage)/tenant/{tid}/...` kalıbını yakalar;
  yalnız admin kimliğiyle `TenantContext`'i o tenant'a set eder, bilinmeyen
  tenant'ta 400 döner.
- Controller'lar çift `@RequestMapping` aldı (`{"/...", "/tenant/{tid}/..."}`) →
  eski AC yolları korundu, migration gerekmedi.
- Silinen ölü switch-token zinciri: `auth/public-token`, `tenants/token`,
  `JwtUtil.generateTenantToken`, `getPublicToken`, `DtoTenantTokenResponse`.

---

## 6. Yeni TC/kota çağrısı eklerken

1. Panel servisinde base'i **mutlaka** `chatBase(tid)` / `quotaBase(tid)` üzerinden
   kur — elle string birleştirme yapma.
2. **Asla** `X-Tenant-Id` header'ı veya ayrı bir tenant token'ı ekleme;
   admin'in normal JWT'si (fetcher otomatik) + URL'deki `{tid}` yeterli.
3. Backend'de karşılık gelen endpoint'i çift map'le:
   `@GetMapping({"/x", "/tenant/{tenantId}/x"})`.

> Not: ESLint/Prettier/husky pre-commit bu repoda **Node ≥ 16.9** ister; varsayılan
> shell node v14 ise `export PATH="$HOME/.nvm/versions/node/v22.14.0/bin:$PATH"`.
