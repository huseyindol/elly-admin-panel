# Changelog

Bu dosya [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) formatını izler.
Versiyon numaraları [Semantic Versioning](https://semver.org/) ile uyumludur.

Kayıt formatı:

- **Added** — yeni özellikler
- **Changed** — mevcut işlevsellikte değişiklikler
- **Deprecated** — yakında kaldırılacak özellikler
- **Removed** — kaldırılan özellikler
- **Fixed** — hata düzeltmeleri
- **Security** — güvenlik açığı kapatmaları
- **Infra** — altyapı, bağımlılık, CI/CD değişiklikleri

---

## [Unreleased]

### Changed

- **URL-Tenant modeli** — Admin'in TC chat ve depolama kotası çağrıları artık
  hedef tenant'ı **URL path'inde** taşır (`/api/v1/chat/tenant/{tid}`,
  `/api/v1/storage/tenant/{tid}/quota`); kimlik admin'in kendi JWT'sinde.
  Detay: [`URL_TENANT_MODELI.md`](./URL_TENANT_MODELI.md).
  - `chat.services` / `storage.services` → `chatBase(tid)` / `quotaBase(tid)`.
  - `uploadChatFileService` artık `tenantId` alır.

### Removed

- **`X-Tenant-Id` header + tenant-switch token** — `tcAuth`/`tenantToken`
  parametreleri, `fetcher.overrideAuth`, `chat-ws-store.activeTenantToken`,
  `getTenantTokenService`, `utils/tenantHeader.ts`, `_services/tenant.services.ts`.

### Added

- **Chat Ban (TC)** — Tenant Chat sohbetinde GUEST/VISITOR banla/ban kaldır:
  - `chat.services.ts` — `banUserService` / `unbanUserService` / `listBansService` (URL-tenant: `/api/v1/chat/tenant/{tid}`)
  - `types/chat.ts` — `ChatMessage.sessionId`, `DtoChatBan`, `ChatBanEvent`; `utils/chat-role.ts` — `banKey`
  - `chat-ws-store` — `bannedKeys` + `/topic/tenant/{tid}/group/{gid}/bans` aboneliği (canlı BANNED/UNBANNED)
  - `ChatWindow` — banlı rozeti (chat:read) + "⋯" moderasyon menüsü Banla/Ban kaldır (yalnız chat:manage, AC'de yok)
- **Bildirim (Notification) UI** — header zil ikonu gerçek, kalıcı bildirimlerle:
  - `src/types/notification.ts`, `src/app/_services/notifications.services.ts` (list / unread-count / read / read-all / delete)
  - `src/app/_hooks/useNotifications.ts` (TanStack Query + WS→query köprüsü)
  - `src/app/_components/NotificationBell.tsx` — rozet + dropdown (okundu/sil/tümünü okundu, tıkla→`link`)
  - `chat-ws-store`'a `/user/queue/notifications` + `.../unread-count` abonelikleri (chat ile aynı WS)
  - WS bağlantısı `BaseAdminLayout`'a taşındı (global; zil her sayfada canlı)
- **⌘K Komut Paleti** — `src/app/_components/CommandPalette.tsx`: header arama kutusu yerine; sayfa/modül navigasyonu, permission filtreli, klavye ile gezinme (⌘K aç/kapa, ↑/↓, Enter, Esc)
- **Dashboard gerçek veri** — `src/app/(baseLayout)/dashboard/page.tsx` mock e-ticaret yerine gerçek CMS metrikleri (Yazı/Form/Kullanıcı/Aktif Mail/Chat/E-posta kartları + "Son E-postalar" ve "Son Yazılar" listeleri, TanStack Query)
- `docs/notifications/BACKEND_NOTIFICATIONS_PROMPT.md` — backend bildirim (notification) domaini için kopyala-yapıştır prompt
- **2FA / MFA (Prompt 10):** TOTP tabanlı iki adımlı doğrulama
  - `src/types/mfa.ts`, `src/app/_services/mfa.services.ts` — status / setup / setupVerify / disable / verifyLogin servisleri
  - `src/app/_components/security/` — `SecuritySettings`, `MfaSetupDialog` (QR + secret), `MfaDisableDialog` (şifreyle kapatma)
- `tmp_e2e_test/chat-test.ts` — Chat modülü için 4 eşzamanlı kullanıcıyla 8 test senaryosunu doğrulayan Playwright E2E test betiği
- `docs/tests/chat-e2e/` — Chat E2E testine ait test planı, görev listesi, detaylı Türkçe bulgular ve test ekran görüntüleri arşivi
- `.cursor/rules/playwright-test-reporting.mdc` — E2E test çıktılarının `docs/tests/{islem-adi}/` altında bağıl (relative) görsel yolları ile arşivlenmesini zorunlu kılan Cursor kuralı
- `src/app/(baseLayout)/settings/page.tsx` — placeholder Ayarlar sayfası (sidebar linki 404 veriyordu)
- `src/app/(baseLayout)/email-templates/_components/ClasspathTemplateSection.tsx` — `/api/v1/emails/templates` classpath listesi, email-templates sayfasının altında gösteriliyor
- `src/app/_components/Icons.tsx` → `AtSign` ikonu eklendi
- `src/types/cms.ts` → `MAIL_*` ve `FORMS_*` permission sabitleri eklendi
- `.cursor/rules/sidebar-sync.mdc` — yeni sayfa eklenince Sidebar güncellenmesini zorunlu kılan kural

### Changed

- **Sidebar collapse toggle tekilleştirildi** — iki kopya butondan biri kaldırıldı; `Header.tsx`'deki kaldı, `Sidebar.tsx`'deki + `onToggleCollapse` prop'u kaldırıldı (`BaseAdminLayout.tsx`)
- `src/app/_components/StatsCard.tsx` + `types.ts` — `StatData.change/trend` opsiyonel; değişim rozeti yalnızca veri varsa gösterilir
- **2FA (Prompt 10):**
  - `src/app/(baseLayout)/settings/page.tsx` — boş placeholder yerine "Hesap Güvenliği" 2FA bölümü
  - `src/app/(layoutLess)/login/page.tsx` — `mfaRequired` ise login 2. adımı (6 haneli kod ekranı); cookie yazımı `applyLoginSuccess` helper'ına ayrıldı
  - `src/utils/services/fetcher.ts` — `/auth/mfa/verify` Authorization strip-list'e eklendi (JWT'siz, sadece mfaToken)
  - `src/types/AuthResponse.ts` — `LoginResponse`'a `mfaRequired?` + `mfaToken?` alanları
- **Chat GUEST sender (Prompt 9):**
  - `src/types/chat.ts` — `ChatMessageSenderType`'a `'GUEST'` eklendi
  - `src/app/_components/chat/ChatWindow.tsx` — anonim ziyaretçi için "Misafir" rozeti + balon stili, `senderUsername` boşsa "Misafir" fallback (düz metin / XSS güvenli)
- `src/app/_components/Sidebar.tsx` — "CMS Yönetim" bölümüne "Mail Hesapları" (`/mail-accounts`) eklendi
- `.cursor/rules/new-page.mdc` — Sidebar adımı "zorunlu" olarak güncellendi
- `src/app/_services/email-templates.services.ts` — v4 hazır: tam CRUD (`/api/v1/email-templates`) + classpath yardımcı
- `src/app/_hooks/useEmailTemplates.ts` — list, detail, create, update, delete, preview mutation'ları geri getirildi
- `src/app/(baseLayout)/email-templates/` — tam CRUD (TemplateForm, MonacoBodyEditor, PreviewPanel) restore edildi
- `src/lib/auth/permissions.server.ts` — `requirePermission()` ve `hasPermissionServer()` bypass edildi (asıl koruma BE'de)
- `src/providers/Providers.tsx` → `QueryClient` global defaults: `retry: 1`, `refetchOnWindowFocus: false`
- `src/app/_hooks/useRabbitMQ.ts` → `refetchInterval` hata durumunda `false` döner; `retry: 1`
- `docs/elly-admin-panel-integration-prompts.md` — Prompt 2 tamamlandı, auth notları, izin sabitleri güncellendi

### Fixed

- `src/utils/services/fetcher.ts` — 3 adet `console.log` kaldırıldı
- `src/lib/security.ts` — Monaco CSP hataları giderildi: `cdn.jsdelivr.net` (script/style/font/connect), `worker-src blob:`, `font-src data:`
- TanStack Query retry flooding: başarısız RabbitMQ sorguları artık hata durumunda polling durduruyor
- `src/components/mail-accounts/MailAccountSelect.tsx` — `smtpUsername` gösterimi düzeltildi (`fromAddress` yerine)
- `react-hooks/set-state-in-effect` lint hataları düzeltildi (banners, components, mail-accounts, pages, posts, widgets edit sayfaları)

### Performance

- **GPU lag fix:** `backdrop-blur-xl` kaldırıldı (`Header.tsx`, `Sidebar.tsx`) — çoklu sekme açıkken GPU stutter önlendi
- **CSS animasyon optimizasyonu:** `will-change`, `transform: translateZ(0)` GPU hint'leri, `globals.css` sadeleştirildi
- **Re-render azaltma:** Birden fazla `watch()` çağrısı → `useWatch([...])` array formuna dönüştürüldü
- **Forms sayfası lag fix:** `useWatch` targeted, memoized modal props
- **Template filter memoization:** `useWatch` array + `useMemo` ile filtre hesaplamaları optimize
- **Sheet scroll fix:** Body scroll kilidi ve animasyonlar iyileştirildi
- **Dashboard card'ları:** `ActivityFeed`, `RecentOrders`, `RevenueChart`, `StatsCard`, `TopProducts` re-render azaltıldı
- **Email Logs:** `EmailLogsClient` gereksiz re-render önlendi
- **OverviewCard + QueueTable:** Manuel refetch butonu eklendi, auto-refresh hata durumunda durduruluyor
- **useDebounce hook:** Temiz reimplementation

### Infra

- `qrcode.react@4.2.0` eklendi — 2FA kurulum dialog'unda otpauth QR kodu render'ı için

---

## [0.4.0] — 2026-04-23

### Added

#### CMS Yönetim Sayfaları — RabbitMQ, Email Templates, Email Logs

**Ortak Altyapı**

- `src/types/cms.ts` — CMS API DTO tipleri: `EmailTemplate`, `EmailLog`,
  `RabbitOverview`, `RabbitQueue`, `RabbitMessage`, `Page<T>`, `Permissions` sabitleri
- `src/lib/api/api-error.ts` — `ApiError` sınıfı (status, errorCode, errorCode shortcuts);
  `unwrapOrThrow()` helper (servis katmanında `BaseResponse` açma)
- `src/lib/auth/permissions.ts` — `extractPermissionsFromToken()` (JWT decode,
  permissions / authorities / scope / roles claim'lerini kabul eder)
- `src/lib/auth/permissions.server.ts` — `requirePermission()` server-only helper
  (Server Component / Server Action / Route Handler kullanımı için); `hasPermissionServer()`
- `src/app/_hooks/usePermission.ts` — `usePermission(permission)` ve `usePermissions(map)`
  client-side hook'ları (JWT cookie'den, CookieContext üzerinden)
- `src/app/(baseLayout)/403/page.tsx` — izin yetersiz yönlendirme sayfası

**Shared UI Bileşenleri**

- `src/app/_components/Sheet.tsx` — yan kayan drawer (Modal.tsx ile aynı tasarım dili;
  shadcn olmadan projenin kendi tema desteği, ESC kapatma, body scroll kilidi)
- `src/app/_components/DestructiveConfirmDialog.tsx` — "adını yaz ve onayla" UX'i
  (purge, delete gibi geri dönüşsüz işlemler için)
- `Icons` genişletildi: `Mail`, `Inbox`, `Database`, `Activity`, `ChevronLeft` eklendi

**RabbitMQ Yönetim Sayfası** — `/infrastructure/rabbitmq`

- `src/app/_services/rabbit-admin.services.ts` — overview, queues, peek, purge, republish servisleri
- `src/app/_hooks/useRabbitMQ.ts` — `useRabbitOverview` (10s), `useRabbitQueues` (5s),
  `useQueueMessages` (enabled:false, manuel peek), `usePurgeQueue`, `useRepublishMessage`
- `OverviewCard` — toplam mesaj/consumer/queue/exchange stat grid, 10s auto-refresh
- `QueueTable` — DataTable tabanlı, canlı 5s refresh, state badge
- `QueueDetailSheet` — Sheet içinde detay + arguments JSON + MessageList
- `MessageList` — peek butonu, adet seçici, JSON pretty-print, properties expand
- `DestructiveConfirmDialog` — queue purge için "queue adını yaz" onay akışı
- `RepublishDialog` — DLQ → hedef queue için payload + contentType formu
- Server Component `requirePermission('rabbit:read')` guard, `force-dynamic`

**Email Templates Sayfaları** — `/email-templates`, `/email-templates/new`, `/email-templates/[key]`

- `src/app/_services/email-templates.services.ts` — list, get, create, update, delete, preview servisleri
- `src/app/_hooks/useEmailTemplates.ts` — `useEmailTemplates`, `useEmailTemplate`,
  `useCreateEmailTemplate`, `useUpdateEmailTemplate`, `useDeleteEmailTemplate`, `usePreviewEmailTemplate`
- `src/schemas/emailTemplateSchema.ts` — zod schema (templateKey regex `/^[a-z0-9-]+$/`, optimisticLockVersion)
- `TemplateForm` — react-hook-form + zod, hidden optimisticLockVersion, readOnly key (edit modda)
- `MonacoBodyEditor` — `@monaco-editor/react` dynamic import (SSR-safe), HTML mode, tema senkronizasyonu
- `PreviewPanel` — JSON dummy data textarea + `POST /preview` → iframe `sandbox=""` render
- `TemplateListTable` — active badge, updatedAt, edit link, delete button (permission-aware)
- 409 Conflict (OptimisticLockException) → toast mesajı: "Başka biri güncellemiş"
- Delete onayı için `DestructiveConfirmDialog` (key yazdır)

**Email Logs Sayfası** — `/email-logs`

- `src/app/_services/email-logs.services.ts` — paginated list (status filter), retry, classpath template listesi
- `src/app/_hooks/useEmailLogs.ts` — `useEmailLogs`, `useRetryEmail` (mutation)
- `src/app/_utils/dateUtils.ts` — `formatRelativeTime()`, `formatAbsoluteTime()` (date-fns olmadan)
- `StatusFilter` — Tümü / PENDING / SENT / FAILED toggle grubu
- `EmailLogStatusBadge` — renk paleti: PENDING=amber, SENT=emerald, FAILED=rose
- `EmailLogsClient` — URL-based sayfalama (`?status=FAILED&page=0`), DataTable, sheet entegrasyonu
- `EmailLogDetailSheet` — alıcı, konu, template, hata mesajı (kırmızı mono box), relative time
- `RetryButton` — SENT durumunda disabled, `emails:retry` yoksa disabled + tooltip

**Sidebar Güncellemeleri**

- "CMS Yönetim" bölümü eklendi: Email Templates, Email Logları, RabbitMQ linkleri
- `NavLink` yardımcı bileşeni çıkarıldı (kod tekrarı azaltıldı)

### Infra

- `@monaco-editor/react@4.7.0` bağımlılık eklendi (HTML template editörü için)
- Lint: 0 error (`react-hooks/set-state-in-effect` 2 hata düzeltildi)
- Format: Prettier pass (20 dosya auto-fix)
- Tests: 43/43 geçti, build başarılı

### Notes

- v4 backend (`/api/v1/email-templates`) için CMS'te `EmailTemplate` entity + service + controller
  hazır olmalı; henüz deploy edilmemişse liste 404 döner (RabbitMQ ve Email Logs v3 ile hazır)
- Permission seed SQL için: `docs/elly-admin-panel-integration-prompts.md` → "Prompt'ları Kullanırken İpuçları"

---

## [0.3.0] — 2026-03-xx

### Added

- Mail Accounts yönetim sayfası (`/mail-accounts`)
- SMTP test modal, varsayılan hesap akışı
- `src/app/_services/mail-accounts.services.ts`
- `src/app/_hooks/useMailAccounts.ts`

---

## [0.2.0] — 2026-02-xx

### Added

- Formlar modülü (`/forms`, `/forms/[id]`, `/forms/new`)
- Dynamic zod schema generation
- `src/app/_utils/zod-generator.ts`, `condition-evaluator.ts`

---

## [0.1.0] — 2025-xx-xx

### Added

- Proje kurulumu: Next.js 16, App Router, React 19, TypeScript strict
- Temel admin layout (`(baseLayout)`, `(layoutLess)`)
- Auth akışı: JWT cookie, refresh token, CookieContext
- Sayfalar, Componentler, Widgetlar, Postlar, Bannerlar, İçerikler, Assetler CRUD
- `DataTable`, `Modal`, `ConfirmDialog`, `Sidebar`, `Header` shared bileşenleri
- TanStack Query 5, react-hook-form + zod, sonner toast
- Vitest 4 + Testing Library test altyapısı
- GitHub Actions CI/CD pipeline (lint → type-check → format:check → test:ci → build)
- Rate limiting, security headers, CSP

[Unreleased]: https://github.com/huseyindol/elly-admin-panel/compare/main...HEAD
[0.4.0]: https://github.com/huseyindol/elly-admin-panel/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/huseyindol/elly-admin-panel/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/huseyindol/elly-admin-panel/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/huseyindol/elly-admin-panel/releases/tag/v0.1.0
