# CMS Yönetim Sayfaları — Entegrasyon Rehberi

> v0.4.0 ile eklenen üç yönetim modülü: **RabbitMQ**, **Email Templates**, **Email Logs**.
> Bu rehber frontend geliştirici ve yeni bir agent için tek kaynak olarak tasarlanmıştır.

---

## Genel Mimari

```
Panel (Next.js)                 CMS (Spring Boot)
─────────────────               ──────────────────
/infrastructure/rabbitmq  →  /api/v1/admin/rabbit/*   → RabbitMQ :15672 (internal)
/email-templates          →  /api/v1/email-templates/*
/email-logs               →  /api/v1/emails/*
```

- Panel **direkt RabbitMQ'ya bağlanmaz.** CMS thin proxy görevi görür.
- Tüm API yanıtları `BaseResponse<T>` wrapper'ı döner (`{ result, data, message, errorCode, status }`).
- `unwrapOrThrow()` helper'ı bu wrapper'ı açar, `result=false` ise `ApiError` fırlatır.
- Auth: JWT Bearer token, `accessToken` cookie'sinden fetcher otomatik alır.

---

## Permission Sistemi

### Gerekli Permissionlar

| Permission               | Modül           | Açıklama                          |
| ------------------------ | --------------- | --------------------------------- |
| `rabbit:read`            | RabbitMQ        | Queue/message listeleme, overview |
| `rabbit:manage`          | RabbitMQ        | Purge, republish (destructive)    |
| `email_templates:read`   | Email Templates | Liste ve detay görüntüleme        |
| `email_templates:manage` | Email Templates | Oluştur, güncelle, sil            |
| `emails:read`            | Email Logs      | Log listesi                       |
| `emails:retry`           | Email Logs      | Başarısız mail retry              |

### Kullanım

```typescript
// Server Component / Server Action'da
import { requirePermission } from '@/lib/auth/permissions.server'
await requirePermission('rabbit:read')          // yetersizse /403'e redirect

// Client Component'te (buton disable/tooltip)
import { usePermission } from '@/app/_hooks/usePermission'
const canManage = usePermission('rabbit:manage')
<button disabled={!canManage} ...>Purge</button>
```

### CMS DB Permission Seed (bir kez çalıştır)

```sql
INSERT INTO permissions (name) VALUES
  ('email_templates:read'), ('email_templates:manage'),
  ('emails:read'), ('emails:retry'),
  ('rabbit:read'), ('rabbit:manage')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN'
  AND p.name IN (
    'email_templates:read', 'email_templates:manage',
    'emails:read', 'emails:retry',
    'rabbit:read', 'rabbit:manage'
  )
ON CONFLICT DO NOTHING;
```

---

## Modül 1: RabbitMQ Yönetimi

### Route: `/infrastructure/rabbitmq`

### Dosya Yapısı

```
src/app/(baseLayout)/infrastructure/rabbitmq/
├── page.tsx                          Server Component — permission guard + force-dynamic
├── loading.tsx
└── _components/
    ├── OverviewCard.tsx               Broker özet istatistikleri (10s refresh)
    ├── QueueTable.tsx                 DataTable — 5s live refresh
    ├── QueueDetailSheet.tsx           Sheet — queue detay + mesaj peek
    ├── MessageList.tsx                peek butonu, JSON pretty-print
    ├── DestructiveConfirmDialog.tsx   Queue adı yazarak onay
    └── RepublishDialog.tsx            DLQ → hedef queue republish

src/app/_services/rabbit-admin.services.ts
src/app/_hooks/useRabbitMQ.ts
```

### API Endpoint'leri

| Method | Path                                                   | Permission      |
| ------ | ------------------------------------------------------ | --------------- |
| GET    | `/api/v1/admin/rabbit/overview`                        | `rabbit:read`   |
| GET    | `/api/v1/admin/rabbit/queues`                          | `rabbit:read`   |
| GET    | `/api/v1/admin/rabbit/queues/{name}`                   | `rabbit:read`   |
| GET    | `/api/v1/admin/rabbit/queues/{name}/messages?count=10` | `rabbit:read`   |
| POST   | `/api/v1/admin/rabbit/queues/{name}/purge`             | `rabbit:manage` |
| POST   | `/api/v1/admin/rabbit/queues/{name}/republish`         | `rabbit:manage` |

### Query Keys

```typescript
rabbitKeys.overview() // ['rabbit', 'overview']
rabbitKeys.queues() // ['rabbit', 'queues']
rabbitKeys.queue(name) // ['rabbit', 'queue', name]
rabbitKeys.messages(name) // ['rabbit', 'messages', name]
```

### Refresh Stratejisi

- Overview: `refetchInterval: 10_000`
- Queue listesi: `refetchInterval: 5_000`
- Mesaj peek: `enabled: false` (kullanıcı butona basınca `refetch()`)

---

## Modül 2: Email Templates

### Route: `/email-templates`, `/email-templates/new`, `/email-templates/[key]`

### Dosya Yapısı

```
src/app/(baseLayout)/email-templates/
├── page.tsx                          Server Component — liste
├── loading.tsx
├── new/
│   └── page.tsx                      Yeni template formu
└── [key]/
    └── page.tsx                      Edit sayfası (Client Component)
    └── _components/
        ├── TemplateForm.tsx           react-hook-form + zod + Monaco
        ├── MonacoBodyEditor.tsx       dynamic import (SSR-safe), HTML mode
        └── PreviewPanel.tsx          JSON dummy data → iframe sandbox render

src/app/_services/email-templates.services.ts
src/app/_hooks/useEmailTemplates.ts
src/schemas/emailTemplateSchema.ts
```

### API Endpoint'leri

| Method | Path                                     | Permission               |
| ------ | ---------------------------------------- | ------------------------ |
| GET    | `/api/v1/email-templates?page=0&size=20` | `email_templates:read`   |
| GET    | `/api/v1/email-templates/{key}`          | `email_templates:read`   |
| POST   | `/api/v1/email-templates`                | `email_templates:manage` |
| PUT    | `/api/v1/email-templates/{key}`          | `email_templates:manage` |
| DELETE | `/api/v1/email-templates/{key}`          | `email_templates:manage` |
| POST   | `/api/v1/email-templates/{key}/preview`  | `email_templates:read`   |

### Önemli Davranışlar

- **OptimisticLock:** PUT body'de `optimisticLockVersion` alanı zorunlu.
  409 Conflict → toast: _"Başka biri güncellemiş, yenile"_
- **Template Key:** Oluşturulduktan sonra değiştirilemez (edit formda readOnly).
- **Preview:** `POST /preview` body `{ data: {...} }`. Response `{ html, subject }`.
  iframe `sandbox=""` — XSS koruması için.
- **Classpath Fallback:** DB'de key yoksa CMS `templates/emails/{key}.html` kullanır.

### Form Zod Schema

```typescript
// src/schemas/emailTemplateSchema.ts
templateKey: z.string().regex(/^[a-z0-9-]+$/)
subject: z.string().min(1).max(255)
htmlBody: z.string().min(1)
description: z.string().max(500).nullable().optional()
active: z.boolean()
```

---

## Modül 3: Email Logs

### Route: `/email-logs?status=FAILED&page=0`

### Dosya Yapısı

```
src/app/(baseLayout)/email-logs/
├── page.tsx                          Server Component — requirePermission
├── loading.tsx
└── _components/
    ├── EmailLogsClient.tsx           URL-based state + DataTable
    ├── StatusFilter.tsx              Tümü / PENDING / SENT / FAILED toggle
    ├── EmailLogStatusBadge.tsx       Renkli durum badge'i
    ├── EmailLogDetailSheet.tsx       Detay + error message panel
    └── RetryButton.tsx               Retry mutation, disabled kuralları

src/app/_services/email-logs.services.ts
src/app/_hooks/useEmailLogs.ts
src/app/_utils/dateUtils.ts
```

### API Endpoint'leri

| Method | Path                                    | Permission     |
| ------ | --------------------------------------- | -------------- |
| GET    | `/api/v1/emails?status=&page=0&size=20` | `emails:read`  |
| POST   | `/api/v1/emails/{id}/retry`             | `emails:retry` |
| GET    | `/api/v1/emails/templates`              | `emails:read`  |

### Retry Kuralları

- `SENT` → retry edilemez (400 VALIDATION_ERROR döner)
- `FAILED` veya `PENDING` → retry edilebilir
- Başarılı retry: status → `PENDING`, retryCount → 0, errorMessage → null

### URL State

```
/email-logs?status=FAILED&page=2
```

Filtre değişince `router.push` ile URL güncellenir. Sayfa yenilemede state korunur.

---

## Ortak Yardımcı Dosyalar

| Dosya                                              | İşlev                                          |
| -------------------------------------------------- | ---------------------------------------------- |
| `src/types/cms.ts`                                 | Tüm CMS DTO tip tanımları                      |
| `src/lib/api/api-error.ts`                         | `ApiError`, `unwrapOrThrow()`                  |
| `src/lib/auth/permissions.ts`                      | JWT decode, `extractPermissionsFromToken()`    |
| `src/lib/auth/permissions.server.ts`               | `requirePermission()` (server-only)            |
| `src/app/_hooks/usePermission.ts`                  | `usePermission()`, `usePermissions()` (client) |
| `src/app/_components/Sheet.tsx`                    | Yan drawer bileşeni                            |
| `src/app/_components/DestructiveConfirmDialog.tsx` | "Adını yaz ve onayla" dialog                   |
| `src/app/_utils/dateUtils.ts`                      | `formatRelativeTime()`, `formatAbsoluteTime()` |

---

## Yeni Bir CMS Modülü Eklerken Kontrol Listesi

```
[ ] src/types/cms.ts içine DTO tiplerini ekle
[ ] Permission sabitini Permissions const'a ekle
[ ] src/app/_services/{module}.services.ts oluştur (unwrapOrThrow kullan)
[ ] src/app/_hooks/use{Module}.ts oluştur (TanStack Query + query keys)
[ ] src/app/(baseLayout)/{module}/page.tsx — requirePermission + force-dynamic
[ ] src/app/(baseLayout)/{module}/loading.tsx — skeleton
[ ] Sidebar.tsx içine link ekle
[ ] docs/CHANGELOG.md → [Unreleased] bölümüne ekle
[ ] CMS DB'de permission seed çalıştır
```
