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

_Sonraki release'e taşınacak tamamlanmamış değişiklikler buraya girilir._

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
