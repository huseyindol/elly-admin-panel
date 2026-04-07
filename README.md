# Elly CMS — Admin Panel

Headless CMS yonetim paneli. Sayfalar, componentler, widgetlar, bannerlar, postlar ve formlar tek bir arayuzden yonetilir. Backend API uzerinden CRUD islemleri yapilir; frontend tamamen Next.js App Router + React Server Components mimarisi uzerine kuruludur.

## Tech Stack

| Katman          | Teknoloji                                    |
| --------------- | -------------------------------------------- |
| Framework       | Next.js 16 (App Router, RSC, Server Actions) |
| UI Library      | React 19                                     |
| Language        | TypeScript 5.9 (strict mode)                 |
| Styling         | Tailwind CSS 4, Shadcn UI                    |
| State / Data    | TanStack Query 5                             |
| Forms           | React Hook Form 7 + Zod 4                    |
| Rich Text       | TipTap 3                                     |
| AI              | Google Generative AI (Gemini)                |
| Animation       | Framer Motion 12                             |
| Toast           | Sonner                                       |
| Test            | Vitest 4 + Testing Library                   |
| Package Manager | Bun                                          |
| Deployment      | Vercel (standalone output)                   |

## Kurulum

```bash
# 1. Bagimliliklari yukle
bun install

# 2. Environment variables
cp .env.example .env.local
# .env.local dosyasini duzenle

# 3. Dev server (port 3333)
bun dev
```

Tarayicida [http://localhost:3333](http://localhost:3333) adresini ac.

## Proje Yapisi

```
elly-admin-panel/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (Providers)
│   │   ├── globals.css               # Global stiller
│   │   ├── error.tsx                 # Route-level error handler
│   │   ├── global-error.tsx          # Global error boundary
│   │   ├── not-found.tsx             # 404 sayfasi
│   │   │
│   │   ├── (baseLayout)/             # Admin layout (Sidebar + Header)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/            # Gosterge paneli
│   │   │   ├── pages/                # Sayfa CRUD
│   │   │   ├── components/           # Component CRUD
│   │   │   ├── widgets/              # Widget CRUD
│   │   │   ├── banners/              # Banner CRUD
│   │   │   ├── posts/                # Post CRUD
│   │   │   ├── contents/             # Icerik CRUD
│   │   │   ├── forms/                # Form CRUD
│   │   │   └── assets/               # Asset yonetimi
│   │   │
│   │   ├── (layoutLess)/             # Layout'suz sayfalar
│   │   │   ├── layout.tsx
│   │   │   └── login/                # Giris sayfasi
│   │   │
│   │   ├── _components/              # Colocated admin componentleri
│   │   │   ├── _layouts/             # BaseAdminLayout
│   │   │   ├── assets/               # Asset tablosu, upload modal
│   │   │   ├── forms/                # DynamicForm, FieldRenderer, StepManager
│   │   │   ├── DataTable.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── SearchInput.tsx
│   │   │   ├── DualListbox.tsx
│   │   │   ├── ImageUploadBox.tsx
│   │   │   ├── TagsInput.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── CopyButton.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── TopProducts.tsx
│   │   │   ├── RecentOrders.tsx
│   │   │   └── Icons.tsx
│   │   │
│   │   ├── _services/                # API service fonksiyonlari
│   │   │   ├── pages.services.ts
│   │   │   ├── components.services.ts
│   │   │   ├── widgets.services.ts
│   │   │   ├── banners.services.ts
│   │   │   ├── posts.services.ts
│   │   │   ├── contents.services.ts
│   │   │   ├── forms.services.ts
│   │   │   └── assets.services.ts
│   │   │
│   │   ├── _hooks/                   # Custom React hooks
│   │   │   ├── useAdminTheme.ts
│   │   │   ├── useBasicInfos.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useFormSchema.ts
│   │   │   └── useTemplates.ts
│   │   │
│   │   ├── _utils/                   # Admin yardimci fonksiyonlari
│   │   │   ├── zod-generator.ts
│   │   │   ├── zod-introspection.ts
│   │   │   ├── condition-evaluator.ts
│   │   │   ├── arrayUtils.ts
│   │   │   ├── stringUtils.ts
│   │   │   └── urlUtils.ts
│   │   │
│   │   ├── _actions/                 # Colocated server actions
│   │   │   └── templates.actions.ts
│   │   │
│   │   └── api/
│   │       └── revalidate/           # ISR cache invalidation endpoint
│   │           └── route.ts
│   │
│   ├── components/                   # Shared (global) componentler
│   │   ├── ui/                       # Shadcn UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   ├── RichTextEditor.tsx
│   │   │   └── AiFieldButton.tsx
│   │   └── posts/
│   │       └── AiArticlePanel.tsx
│   │
│   ├── actions/                      # Global server actions
│   │   ├── auth/
│   │   │   ├── logout.ts
│   │   │   └── saveTokens.ts
│   │   ├── generate-article.ts
│   │   └── generate-field.ts
│   │
│   ├── schemas/                      # Zod validation semalari
│   │   ├── page.ts
│   │   ├── component.ts
│   │   ├── widget.schema.ts
│   │   ├── banner.schema.ts
│   │   ├── post.schema.ts
│   │   ├── form.schema.ts
│   │   ├── pageseo.ts
│   │   ├── revalidate.ts
│   │   ├── user.ts
│   │   ├── constants/
│   │   │   └── industryOptions.ts
│   │   └── dynamic/
│   │       ├── experienceSchema.ts
│   │       └── skillsSchema.ts
│   │
│   ├── types/                        # TypeScript tip tanimlari
│   │   ├── BaseResponse.ts           # API response + entity modelleri
│   │   ├── APITypes.ts
│   │   ├── AuthResponse.ts
│   │   ├── content.ts
│   │   ├── form.ts
│   │   ├── siteInfoTypes.ts
│   │   ├── ssgTypes.ts
│   │   └── userTypes.ts
│   │
│   ├── services/                     # Global servisler
│   │   └── auth/
│   │       └── refreshService.ts
│   │
│   ├── utils/                        # Genel utility
│   │   ├── hooks.ts
│   │   ├── imageUrl.ts
│   │   ├── constant/
│   │   │   └── cookieConstant.ts
│   │   ├── form/
│   │   │   └── validate.tsx
│   │   └── services/
│   │       ├── fetcher.ts
│   │       └── contents.ts
│   │
│   ├── context/
│   │   └── CookieContext.tsx
│   │
│   ├── providers/
│   │   ├── Providers.tsx             # TanStack Query + Theme
│   │   ├── ThemeProvider.tsx
│   │   └── HydrationProvider.tsx
│   │
│   ├── proxy/                        # Token proxy
│   │   ├── refreshTokenProxy.ts
│   │   └── removeCookies.ts
│   │
│   ├── lib/                          # Core library
│   │   ├── env.ts                    # Zod env validation
│   │   ├── gemini.ts                 # Gemini AI client
│   │   ├── logger.ts
│   │   ├── rate-limiter.ts
│   │   ├── security.ts
│   │   └── utils.ts                  # cn() helper
│   │
│   └── data/
│       └── mockData.ts
│
├── tests/                            # Vitest testleri
│   ├── setup.ts
│   ├── utils/
│   │   └── test-utils.tsx
│   ├── lib/
│   │   ├── rate-limiter.test.ts
│   │   └── security.test.ts
│   └── api/
│       └── revalidate.test.ts
│
├── scripts/                          # CI/CD & analiz
│   ├── generate-templates.ts
│   ├── performance-audit.mjs
│   ├── load-test.k6.js
│   └── upload-sbom.sh
│
├── .github/workflows/                # GitHub Actions
│   ├── ci.yml
│   └── test-pr.yml
│
├── next.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.mjs
├── vitest.config.ts
├── eslint.config.mjs
├── .prettierrc
├── components.json                   # Shadcn UI config
└── package.json
```

## Entity Iliskileri (CMS Veri Modeli)

Bu CMS'in temel veri modeli hiyerarsik bir yapidadir:

```
Page
 └── Component[]  (type: BANNER | WIDGET | FORM)
      ├── Banner[]
      ├── Widget[]  (type: BANNER | POST)
      │    ├── Banner[]
      │    └── Post[]
      └── Form[]
```

### Page (Sayfa)

En ust duzey entity. Bir sayfa birden fazla **Component** icerebilir.

| Alan       | Tip         | Aciklama                    |
| ---------- | ----------- | --------------------------- |
| title      | string      | Sayfa basligi               |
| slug       | string      | URL-friendly tanimlayici    |
| status     | boolean     | Aktif/Pasif                 |
| template   | string?     | Sablom adi                  |
| seoInfo    | SeoInfo?    | SEO meta verileri           |
| components | Component[] | Sayfaya atanan componentler |

### Component (Bilesen)

Bir sayfanin icindeki yapi taslari. Tipine gore **Banner**, **Widget** veya **Form** icerebilir.

| Alan       | Tip                    | Aciklama            |
| ---------- | ---------------------- | ------------------- |
| name       | string                 | Component adi       |
| type       | BANNER / WIDGET / FORM | Component tipi      |
| orderIndex | number                 | Siralama            |
| status     | boolean                | Aktif/Pasif         |
| template   | string?                | Sablon adi          |
| banners    | Banner[]               | Icerideki bannerlar |
| widgets    | Widget[]               | Icerideki widgetlar |
| forms      | Form[]                 | Icerideki formlar   |

### Widget

Bir componentin icinde yer alan alt birim. Tipine gore **Banner** veya **Post** icerebilir.

| Alan       | Tip           | Aciklama                  |
| ---------- | ------------- | ------------------------- |
| name       | string        | Widget adi                |
| type       | BANNER / POST | Widget tipi               |
| orderIndex | number        | Siralama                  |
| banners    | Banner[]      | Widget icindeki bannerlar |
| posts      | Post[]        | Widget icindeki postlar   |

### Banner

Gorsel icerik birimi. Desktop, tablet ve mobil icin ayri gorseller destekler.

| Alan       | Tip                       | Aciklama                 |
| ---------- | ------------------------- | ------------------------ |
| title      | string                    | Banner basligi           |
| images     | {desktop, tablet, mobile} | Responsive gorseller     |
| link       | string?                   | Tiklaninca gidilecek URL |
| target     | \_blank / \_self          | Link acilis sekli        |
| orderIndex | number                    | Siralama                 |
| subFolder  | string                    | Asset alt klasoru        |

### Post (Yazi)

Icerik yazisi. SEO bilgileri icerir.

| Alan       | Tip     | Aciklama                 |
| ---------- | ------- | ------------------------ |
| title      | string  | Yazi basligi             |
| content    | string  | Icerik (HTML/Rich Text)  |
| slug       | string  | URL-friendly tanimlayici |
| seoInfo    | SeoInfo | SEO meta verileri        |
| orderIndex | number  | Siralama                 |

### Form

Dinamik form tanimlama. Schema-driven: alanlar, adimlar ve layout JSON olarak saklanir.

| Alan          | Tip        | Aciklama             |
| ------------- | ---------- | -------------------- |
| title         | string     | Form basligi         |
| version       | number     | Versiyon             |
| active        | boolean    | Aktif/Pasif          |
| schema.fields | Field[]    | Form alanlari        |
| schema.steps  | Step[]?    | Wizard adimlari      |
| schema.config | FormConfig | Layout, submit label |

**Desteklenen alan tipleri:** `text`, `email`, `number`, `select`, `checkbox`, `multi_checkbox`, `radio`, `textarea`, `date`, `phone`, `url`

**Layout secenekleri:** `single`, `vertical`, `wizard`

## API Endpointleri

Tum API cagrilari `src/app/_services/` altindaki servis fonksiyonlari uzerinden yapilir. Backend API base URL environment variable ile belirlenir.

| Entity     | List                        | Get                        | Create                  | Update                     | Delete                        |
| ---------- | --------------------------- | -------------------------- | ----------------------- | -------------------------- | ----------------------------- |
| Pages      | GET /api/v1/pages/list      | GET /api/v1/pages/:slug    | POST /api/v1/pages      | PUT /api/v1/pages/:id      | DELETE /api/v1/pages/:id      |
| Components | GET /api/v1/components/list | GET /api/v1/components/:id | POST /api/v1/components | PUT /api/v1/components/:id | DELETE /api/v1/components/:id |
| Widgets    | GET /api/v1/widgets/list    | GET /api/v1/widgets/:id    | POST /api/v1/widgets    | PUT /api/v1/widgets/:id    | DELETE /api/v1/widgets/:id    |
| Banners    | GET /api/v1/banners/list    | GET /api/v1/banners/:id    | POST /api/v1/banners    | PUT /api/v1/banners/:id    | DELETE /api/v1/banners/:id    |
| Posts      | GET /api/v1/posts/list      | GET /api/v1/posts/:id      | POST /api/v1/posts      | PUT /api/v1/posts/:id      | DELETE /api/v1/posts/:id      |
| Forms      | GET /api/v1/forms/list      | GET /api/v1/forms/:id      | POST /api/v1/forms      | PUT /api/v1/forms/:id      | DELETE /api/v1/forms/:id      |

**Internal API route:** `POST /api/revalidate` — ISR cache invalidation (tag/path based)

## Route Yapisi

| Route                   | Sayfa            | Aciklama                  |
| ----------------------- | ---------------- | ------------------------- |
| `/login`                | Login            | Giris sayfasi (layoutsuz) |
| `/dashboard`            | Dashboard        | Gosterge paneli           |
| `/pages`                | Page List        | Sayfa listesi             |
| `/pages/new`            | Page Create      | Yeni sayfa olustur        |
| `/pages/[id]/edit`      | Page Edit        | Sayfa duzenle             |
| `/components`           | Component List   | Component listesi         |
| `/components/new`       | Component Create | Yeni component olustur    |
| `/components/[id]/edit` | Component Edit   | Component duzenle         |
| `/widgets`              | Widget List      | Widget listesi            |
| `/widgets/new`          | Widget Create    | Yeni widget olustur       |
| `/widgets/[id]/edit`    | Widget Edit      | Widget duzenle            |
| `/banners`              | Banner List      | Banner listesi            |
| `/banners/new`          | Banner Create    | Yeni banner olustur       |
| `/banners/[id]/edit`    | Banner Edit      | Banner duzenle            |
| `/posts`                | Post List        | Post listesi              |
| `/posts/new`            | Post Create      | Yeni post olustur         |
| `/posts/[id]/edit`      | Post Edit        | Post duzenle              |
| `/contents`             | Content List     | Icerik listesi            |
| `/contents/new`         | Content Create   | Yeni icerik olustur       |
| `/contents/[id]/edit`   | Content Edit     | Icerik duzenle            |
| `/forms`                | Form List        | Form listesi              |
| `/forms/new`            | Form Create      | Yeni form olustur         |
| `/forms/[id]`           | Form Detail      | Form detay / duzenle      |
| `/assets`               | Asset List       | Asset yonetimi            |

## Scripts

```bash
# Development
bun dev                 # Dev server (port 3333, --inspect)
bun build               # Production build
bun start               # Production server

# Code Quality
bun lint                # ESLint
bun lint:fix            # ESLint auto-fix
bun type-check          # tsc --noEmit
bun format              # Prettier write
bun format:check        # Prettier check

# Testing
bun test                # Vitest (interactive)
bun test:run            # Vitest single run
bun test:watch          # Vitest watch mode
bun test:ui             # Vitest UI
bun test:coverage       # Coverage raporu
bun test:ci             # CI mode (coverage + verbose)

# Performance & Analysis
bun analyze             # Bundle analyzer
bun run perf:audit      # Performance audit
bun run perf:build      # Build + audit
bun run load-test       # k6 load test
bun run load-test:quick # k6 quick (10 VU, 30s)

# Security & SBOM
bun run sbom:generate   # CycloneDX SBOM
bun run sbom:upload     # SBOM upload
```

## Guvenlik

- **Rate Limiting:** IP bazli, `src/lib/rate-limiter.ts`
- **Security Headers:** HSTS, CSP, X-Frame-Options — `src/lib/security.ts`
- **Environment Validation:** Zod ile build-time kontrol — `src/lib/env.ts`
- **Auth:** JWT token yonetimi, refresh token proxy
- **Input Sanitization:** Tum API rotalarda zorunlu
- **Pre-commit Hook:** `tsc --noEmit` (Husky + lint-staged)

## CI/CD

GitHub Actions workflows:

- **ci.yml** — Lint, type-check, build, test
- **test-pr.yml** — PR uzerinde test + coverage

## Lisans

MIT
