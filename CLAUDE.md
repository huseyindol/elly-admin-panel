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

- `src/app/` — Sayfalar (App Router). `(site)/` public, `(admin)/` yönetim paneli
- `src/components/` — React componentleri. `ui/` shadcn, `forms/` formlar, `dynamic/` dinamik içerik
- `src/lib/` — Yardımcı araçlar (env.ts, rate-limiter.ts, security.ts, utils.ts)
- `src/services/` — API servisleri (auth, typicode)
- `src/schemas/` — Zod validation şemaları
- `src/actions/` — Server Actions
- `src/types/` — TypeScript tip tanımları
- `src/context/` — React Context
- `src/providers/` — React Provider'lar
- `tests/` — Vitest test dosyaları (components/, lib/, api/)

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
- `src/middleware.ts` — Next.js middleware
- `next.config.ts` — Next.js konfigürasyonu
- `vitest.config.ts` — Test konfigürasyonu

## Agent Teams Koordinasyonu

Bu proje `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` ile çalışır. Takım yapısı:

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
