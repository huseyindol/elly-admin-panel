# Elly Admin Panel — Geliştirme İlerleyiş Dosyası

> Claude bu dosyayı her oturumda okur ve günceller.  
> Kaldığı yerden devam etmek için buraya bakar.

---

## TAMAMLANAN MODÜLLER ✅

### SKILL-01: AI Alan Üretimi

- **Dosyalar:** `src/actions/generate-field.ts`, `src/components/ui/AiFieldButton.tsx`
- Slug, SEO başlık/açıklama/keywords, banner alt text, içerik açıklaması
- Tüm actionlar Server Action — Gemini key client'a gitmez

### SKILL-02: AI Makale Üretimi (3-Stage Pipeline)

- **Dosyalar:** `src/actions/generate-article.ts`, `src/components/posts/AiArticlePanel.tsx`
- Stage 1: `articleAgent()` → Topic + keywords → Outline
- Stage 2: `generateFullArticle()` → Outline → HTML makale
- Stage 3: `frontendAgent()` → HTML temizle + heading hiyerarşisi düzelt
- İzin verilen tag'ler: h1-h3, p, ul, ol, li, strong, em, blockquote
- Model: `gemini-2.0-flash` | Config: `src/lib/gemini.ts`

### SKILL-03: Mail Account Yönetimi

- **Konum:** `src/app/(baseLayout)/mail-accounts/`
- CRUD + SMTP test modal + form entegrasyon dropdown
- Servis: `src/app/_services/mail-accounts.services.ts`

### SKILL-04: Multi-tenant Template Sistemi

- Hook: `useTemplates(type)` — `src/app/_hooks/useTemplates.ts`
- API: `GET /api/v1/templates?type=posts|pages|...`

### SKILL-05: Agent Teams + Cross-Platform Skills (Claude Code + Cursor)

- `.claude/agents/` → Claude Code subagent'ları (5 rol)
- `.claude/skills/` → Claude Code skill'leri (9+ adet)
- `.cursor/rules/` → Cursor .mdc rules (agent + skill eşleşmesi)
- `AGENTS.md` → platform eşleme tablosu

### SKILL-06: RichText Editor

- `src/components/ui/RichTextEditor.tsx` — Tiptap 3.x

### SKILL-07: ISR Revalidation

- `src/app/api/revalidate/` — Bearer token auth ile cache temizleme

### SKILL-08: RabbitMQ Yönetim Sayfası ✅ (v0.4.0)

- **Route:** `/infrastructure/rabbitmq`
- **Servis:** `src/app/_services/rabbit-admin.services.ts` — overview, queues, peek, purge, republish
- **Hook:** `src/app/_hooks/useRabbitMQ.ts` — `useRabbitOverview` (10s), `useRabbitQueues` (5s), `useQueueMessages`, `usePurgeQueue`, `useRepublishMessage`
- **Bileşenler:**
  - `OverviewCard` — 4-stat grid (mesaj/consumer/queue/exchange), 10s auto-refresh
  - `QueueTable` — DataTable, canlı 5s refresh, state badge
  - `QueueDetailSheet` — Sheet drawer, detay + arguments JSON + MessageList
  - `MessageList` — peek butonu, adet seçici, JSON pretty-print
  - `RepublishDialog` — DLQ → hedef queue modalı
- **Permission:** `rabbit:read` (guard), `rabbit:manage` (purge/republish buton disable)
- **Reuse:** `DestructiveConfirmDialog` shared bileşeni

### SKILL-09: Email Templates Yönetim Sayfası ✅ (v0.4.0)

- **Route:** `/email-templates`, `/email-templates/new`, `/email-templates/[key]`
- **Servis:** `src/app/_services/email-templates.services.ts` — CRUD + preview
- **Hook:** `src/app/_hooks/useEmailTemplates.ts` — list, detail, create, update, delete, preview mutation'ları
- **Schema:** `src/schemas/emailTemplateSchema.ts` — templateKey regex, optimisticLockVersion
- **Bileşenler:**
  - `TemplateForm` — react-hook-form + zod, readOnly key (edit modda)
  - `MonacoBodyEditor` — `@monaco-editor/react` dynamic import, HTML mode, tema sync
  - `PreviewPanel` — JSON dummy data → `POST /preview` → iframe `sandbox=""` render
  - `TemplateListTable` — active badge, updatedAt, permission-aware delete
- **Permission:** `email_templates:read` / `email_templates:manage`
- **Edge case:** 409 Conflict → "Başka biri güncellemiş" toast

### SKILL-10: Email Logs Yönetim Sayfası ✅ (v0.4.0)

- **Route:** `/email-logs`
- **Servis:** `src/app/_services/email-logs.services.ts` — paginated list (status filter), retry
- **Hook:** `src/app/_hooks/useEmailLogs.ts` — `useEmailLogs`, `useRetryEmail`
- **Bileşenler:**
  - `StatusFilter` — Tümü / PENDING / SENT / FAILED toggle
  - `EmailLogStatusBadge` — PENDING=amber, SENT=emerald, FAILED=rose
  - `EmailLogsClient` — URL-based sayfalama (`?status=FAILED&page=0`), DataTable
  - `EmailLogDetailSheet` — detay + hata mesajı (kırmızı mono box) + relative time
  - `RetryButton` — SENT disabled, permission-aware
- **Permission:** `emails:read` / `emails:retry`
- **Yardımcı:** `src/app/_utils/dateUtils.ts` — `formatRelativeTime()`, `formatAbsoluteTime()`

### SKILL-11: Ortak CMS Altyapısı ✅ (v0.4.0)

- `src/types/cms.ts` — CMS API DTO tipleri (EmailTemplate, EmailLog, RabbitOverview, RabbitQueue, RabbitMessage, Page, Permissions sabitleri)
- `src/lib/api/api-error.ts` — `ApiError` sınıfı + `unwrapOrThrow()` helper
- `src/lib/auth/permissions.ts` — `extractPermissionsFromToken()` (JWT decode, çoklu claim desteği)
- `src/lib/auth/permissions.server.ts` — `requirePermission()` server-only guard
- `src/app/_hooks/usePermission.ts` — `usePermission()` + `usePermissions()` client hook'ları
- `src/app/(baseLayout)/403/page.tsx` — 403 Forbidden sayfası
- `src/app/_components/Sheet.tsx` — yan kayan drawer
- `src/app/_components/DestructiveConfirmDialog.tsx` — "adını yaz ve onayla" UX
- Sidebar: "CMS Yönetim" bölümü + NavLink helper

---

## DEVAM EDEN / PLANLANAN ⚠️

### TODO-01: Production Log Temizliği

- `src/utils/services/fetcher.ts` → `console.log` kaldırılacak

### TODO-02: Error Monitoring

- `src/app/error.tsx` + `global-error.tsx` → Sentry/monitoring entegrasyonu

### TODO-03: Pages Error Toast

- `src/app/(baseLayout)/pages/page.tsx` → hata durumunda toast eklenecek

### TODO-04: Cookie Timezone Fix

- `src/proxy.ts` → süresi dolan cookie timezone dönüşümü

### TODO-05: v4 Backend Deploy

- Email Templates endpoint'leri CMS'te hazır olmalı (`/api/v1/email-templates`)
- RabbitMQ ve Email Logs v3 ile hazır, çalışıyor

### TODO-06: Template Versiyonlama (v5 planlı)

- `email_template_revisions` tablosu + "geri al" UI

---

## YENİ MODÜL EKLERKEN CHECKLIST

```
1. src/app/_services/[entity].services.ts     — API katmanı
2. src/app/_hooks/use[Entity].ts              — TanStack Query hook
3. src/schemas/[entity].ts                    — Zod şema
4. src/types/[entity].ts veya src/types/cms.ts — TypeScript tipler
5. src/app/(baseLayout)/[entity]/page.tsx     — Liste sayfası
6. src/app/(baseLayout)/[entity]/new/page.tsx — Yeni kayıt
7. src/app/(baseLayout)/[entity]/[id]/edit/   — Düzenleme
8. src/app/_components/                       — Paylaşılan bileşenler (Sheet, DestructiveConfirmDialog vs.)
9. Sidebar.tsx'e link ekle
```

---

## KRİTİK KURALLAR

- Package manager: sadece `bun` (`bun run`, `bun install`, `bunx`)
- TypeScript strict — `any` yasak
- `console.log` production koduna girmesin — `logger` kullan
- Cookie'ye number yazarken `String()` ile dönüştür
- Pre-commit: `tsc --noEmit` — type error varsa commit engellenir
- Yeni API rotaları: rate limiting + input sanitization zorunlu
- Zod şemaları: `src/schemas/` altında
- Permission guard: server → `requirePermission()`, client → `usePermission()`
- Destructive işlemler: `DestructiveConfirmDialog` kullan
- Yan panel detay: `Sheet` bileşeni kullan
- API response unwrap: `unwrapOrThrow()` helper kullan

---

## DÖKÜMANLAR

| Dosya                                          | İçerik                                                     |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `docs/CHANGELOG.md`                            | Versiyon bazlı değişiklik kaydı (Keep a Changelog formatı) |
| `docs/CMS_MANAGEMENT_PAGES.md`                 | 3 CMS yönetim modülü entegrasyon rehberi                   |
| `docs/elly-admin-panel-integration-prompts.md` | Kopyala-yapıştır prompt'ları (Prompt 0-4)                  |
| `docs/rabbitmq-admin-api-design.md`            | RabbitMQ admin API mimari tasarımı                         |
| `docs/v4-mail-architecture-proposal.md`        | v4 mail template mimarisi kararı (Opsiyon C seçildi)       |
| `docs/API_TEMPLATES_USAGE.md`                  | Template API endpoint kullanım rehberi                     |

---

## OTURUM LOGU

| Tarih      | Yapılan                                                                                                                                                                                                                                                                                | Sonraki Adım                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 2026-04-12 | Memory sistemi kuruldu, proje tam snapshot alındı                                                                                                                                                                                                                                      | Skill sistemi genişletme                 |
| 2026-04-13 | 5 yeni skill eklendi. Bug fix'ler, settings.json genişletildi                                                                                                                                                                                                                          | Cross-platform eşleşme                   |
| 2026-04-14 | `.cursor/rules/` 14 .mdc dosyası. Claude ↔ Cursor tam eşleşme                                                                                                                                                                                                                          | CMS management sayfaları                 |
| 2026-04-23 | **v0.4.0 tamamlandı:** RabbitMQ, Email Templates, Email Logs yönetim sayfaları. Ortak altyapı (ApiError, permissions, Sheet, DestructiveConfirmDialog). Sidebar güncellendi. Monaco editor eklendi. CHANGELOG + CMS_MANAGEMENT_PAGES rehberi yazıldı. 43/43 test geçti, build başarılı | TODO-01 (log temizliği) veya v5 planlama |

---

## AKTİF BRANCH

`main` — v0.4.0 merge edildi, tüm CMS yönetim sayfaları canlı.
