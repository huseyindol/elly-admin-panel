# nextjs-approute-project — Claude Rehberi

## Proje

Huseyin DOL'un modern portföy ve CMS sitesi. Next.js 16 App Router, React 19, TypeScript strict mode.

## Tech Stack

- Framework: Next.js 16 (App Router, Server Components, Server Actions)
- UI: Tailwind CSS 4, Shadcn UI, Framer Motion
- Form: React Hook Form + Zod 4
- Data: TanStack Query 5
- Test: Vitest 4 + Testing Library (jsdom)
- Email: Resend
- Package Manager: Bun (npm değil, `bun run`, `bun install`, `bunx` kullanılmalı)
- Deployment: Vercel

## Dizin Yapısı

- `src/app/` — Sayfalar (App Router). `(baseLayout)/` admin panel sayfaları, `(layoutLess)/` layout-free (login), `api/` route handler'lar
- `src/app/_services/` — Panel modül servisleri (forms, posts, mail-accounts, chat, email-logs, …). Her entity için ayrı dosya
- `src/app/_hooks/` — TanStack Query hook'ları + admin tema/permission hook'ları
- `src/app/_components/` — Panel paylaşılan bileşenler (Sheet, DataTable, ConfirmDialog, DestructiveConfirmDialog, vb.)
- `src/app/_utils/` — Yardımcılar (zod-generator, condition-evaluator, dateUtils)
- `src/components/` — Genel React componentler. `ui/` shadcn, `forms/`, `dynamic/`, `chat/`
- `src/stores/` — Zustand store'ları (`permission-store`, `user-store`, `chat-ws-store`). `persist` middleware ile localStorage
- `src/services/auth/` — Auth servisleri (refreshService) — login/refresh endpoint'lerine direkt fetch
- `src/lib/` — Yardımcı araçlar (env.ts, rate-limiter.ts, security.ts, utils.ts, api/api-error.ts, auth/permissions\*.ts)
- `src/schemas/` — Zod validation şemaları
- `src/actions/` — Server Actions (AI üretimi, vb.)
- `src/types/` — TypeScript tip tanımları (`AuthResponse`, `form`, `cms`, `user-management`, `chat`)
- `src/context/` — React Context (CookieContext)
- `src/providers/` — React Provider'lar (QueryClient + CookieContext + Theme)
- `src/proxy.ts` — **Next.js 16 middleware** (Next 16'da `middleware.ts` yerine `proxy.ts` adıyla çalışır)
- `src/proxy/` — Middleware yardımcı modülleri (`refreshTokenProxy`, `removeCookies`)
- `tests/` — Vitest test dosyaları (components/, lib/, api/)

## Davranış Rehberi

LLM kodlama hatalarını azaltmak için dört ilke her zaman aktiftir: **Düşün → Sor, Basit tut, Cerrahi değiş, Hedef-odaklı ilerle**. Detay için [`.claude/skills/karpathy-guidelines/SKILL.md`](./.claude/skills/karpathy-guidelines/SKILL.md) (Cursor karşılığı `.cursor/rules/karpathy-guidelines.mdc`).

## Kodlama Kuralları

- TypeScript strict mode — `any` kullanma
- Component isimleri: PascalCase
- Dosya isimleri: PascalCase (componentler), kebab-case (utils/lib)
- `console.log` production kodunda yasak
- Tüm API rotaları rate limiting (`src/lib/rate-limiter.ts`) ve input sanitization içermeli
- Validation: Zod ile, şemalar `src/schemas/` altında
- Client component'ler için dosya başında `'use client'` direktifi
- Pre-commit hook `tsc --noEmit` çalıştırır — type error varsa commit engellenir
- Cookie'ye yazılan `number` değerler `String()` ile dönüştürülmeli (`cookies.set` sadece `string` kabul eder)

## Test Kuralları

- Test framework: Vitest + @testing-library/react
- Test dosyaları: `tests/` altında, source dizin yapısını yansıtır
  - `tests/components/` → `src/components/` için
  - `tests/lib/` → `src/lib/` için
  - `tests/api/` → `src/app/api/` için
- Import path: `@/components/...` (path alias)
- Mock pattern: `vi.mock(...)` dosya başında
- Coverage threshold: %50 branch, %30 function, %10 line
- Test çalıştırma: `bun run test:ci`

## API Güvenliği

- Rate limiting: `src/lib/rate-limiter.ts` — IP bazlı, 60 istek/dk
- Security headers: `src/lib/security.ts` — HSTS, CSP, X-Frame-Options
- Input sanitization tüm API rotalarında zorunlu
- `.env` dosyalarına dokunma

## Önemli Dosyalar

- `src/lib/env.ts` — Zod ile environment variable validasyonu
- `src/lib/rate-limiter.ts` — IP bazlı rate limiting
- `src/lib/security.ts` — Security header'ları ve yardımcı araçlar
- `src/proxy.ts` — Next.js 16 middleware (auth redirect + silent token refresh)
- `src/utils/services/fetcher.ts` — Tek merkezli fetcher (CSR + SSR, auto Authorization, 401 refresh akışı)
- `src/utils/constant/cookieConstant.ts` — Cookie isim enum'u + `COOKIE_MAX_AGE` + `deriveMaxAgeFromExpiredDate`
- `src/stores/permission-store.ts` — Roller + permissions (persist)
- `src/stores/user-store.ts` — userId / username / email / userCode (persist)
- `src/stores/chat-ws-store.ts` — STOMP/SockJS chat client + sinyaller (newGroup, deletedGroup, invitedGroup, unreadCounts)
- `next.config.ts` — Next.js konfigürasyonu
- `vitest.config.ts` — Test konfigürasyonu

## Auth Akışı (kritik)

- **Backend token TTL'leri:** accessToken **4 saat**, refreshToken **6 ay**
- **Cookie max-age** `cookieConstant.ts` üzerinden tek kaynak. accessToken / expiredDate cookie'leri **backend'in döndüğü `expiredDate` (Unix ms)** ile hizalanır → `deriveMaxAgeFromExpiredDate()`. refreshToken / userCode / tenantId 6 ay sabit
- **JWT JWE'dir** (encrypted) — `atob` ile decode etme. Roller / userId backend'ten `/api/v1/auth/login` ve `/api/v1/users/me/permissions` ile gelir, zustand store'larında persist edilir
- **Cookie silme:** Next.js `response.cookies.set` Map dedup'ı yapar. Toplu silme için `src/proxy/removeCookies.ts` raw `Set-Cookie` header'larıyla 9 farklı varyant gönderir. Client-side logout için `GET /api/auth/logout` route handler'ı (plain `Response`)
- **Middleware** (`src/proxy.ts`): accessToken yoksa veya expired ise refreshToken varken sessizce yenileme yapar; başarısızsa `removeCookies` + `/login`. `/login` üzerinde stale cookie varsa self-heal eder
- **Reactive hooks** (component'lerde):
  - `useMyRoleLevel()` — permission-store'dan rol seviyesi (SUPER_ADMIN=4, ADMIN=3, EDITOR=2, VIEWER=1)
  - `useMyUserId()`, `useMyUsername()`, `useMyEmail()`, `useMyUserCode()` — user-store'dan
  - `usePermission('permission-key')` — boolean permission check
- **Async helper'lar** (non-component, örn. chat-ws-store): `getMyUserId()` önce store'a bakar, yoksa `/api/v1/users/me` fallback

## Chat / WebSocket

- STOMP üzerinden SockJS — `src/stores/chat-ws-store.ts`
- Subscription kovaları: `globalSubs` (presence + groups/new + groups/deleted + per-user groups/joined), `activeGroupSubs` (typing + read), `allGroupSubs` (her grup için mesaj sub'ı)
- Sinyaller one-shot: `newGroupSignal`, `deletedGroupSignal`, `invitedGroupSignal` — sidebar tüketince `null`'a çeker
- WS topic'leri:
  - `/topic/groups/new` — yeni grup yayını
  - `/topic/groups/deleted` — `msg.body = groupId`
  - `/topic/user/{userId}/groups/joined` — kişisel davet
  - `/topic/group/{id}` — mesajlar (allGroupSubs)
  - `/topic/group/{id}/typing` ve `/read` (activeGroupSubs)

## Agent Teams Koordinasyonu

**Cursor ve diğer asistanlar:** Rol tanımlarının araç-agnostic özeti ve dizin eşlemesi için kökteki [`AGENTS.md`](./AGENTS.md) dosyasına bak. Cursor’da bağlam olarak `@AGENTS.md` veya `@.agents/<rol>.md` kullanılabilir.

Bu proje `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` ile çalışır. Claude Code subagent tanımları `.claude/agents/` altındadır; Cursor ile aynı içerik `.agents/` altında tekrarlanır (model/tools frontmatter hariç). Takım yapısı:

### Takım Yapısı

| Agent                  | Rol                             | Model  | Yetki           |
| ---------------------- | ------------------------------- | ------ | --------------- |
| **team-lead**          | Koordinatör, task decomposition | opus   | Read/Write/Bash |
| **test-writer**        | Test yazımı                     | sonnet | Read/Write      |
| **security-reviewer**  | Güvenlik review                 | sonnet | Read-only       |
| **ui-reviewer**        | UI/a11y review                  | sonnet | Read-only       |
| **nextjs-performance** | Performance review              | sonnet | Read-only       |

### Koordinasyon Kuralları

- Team Lead tüm büyük görevleri alt task'lara ayırır
- Her teammate yalnızca kendine atanan dosya/dizinlerde çalışır
- **Aynı dosyaya birden fazla agent yazmamalı** (file conflict önleme)
- Bulguları yapılandırılmış formatta raporla (impact, location, issue, fix)
- Kritik sorunları hemen team lead'e bildir
- Teammate'ler arası doğrudan iletişim mümkün (mesaj sistemi)

### İş Akışı

1. Team Lead görevi analiz eder ve alt görevlere böler
2. Her alt görev uygun teammate'e atanır
3. Teammate'ler paralel çalışır, dosya ownership'e uyar
4. Sonuçlar team lead'de birleştirilir, kalite kontrolü yapılır
5. Final rapor kullanıcıya sunulur
