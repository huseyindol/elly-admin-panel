# Elly CMS — Mimari ve Schema Dokumantasyonu

Bu dokuman, Elly CMS Admin Panel'in mimari yapisi, entity iliskileri ve katman organizasyonunu gorsel olarak aciklar.

---

## 1. CMS Entity Iliskileri (Veri Modeli)

Asagidaki diagram, CMS'in temel veri modelini ve entity'ler arasi iliskileri gosterir.

```mermaid
erDiagram
    PAGE ||--o{ COMPONENT : "componentIds"
    COMPONENT ||--o{ BANNER : "bannerIds"
    COMPONENT ||--o{ WIDGET : "widgetIds"
    COMPONENT ||--o{ FORM : "formIds"
    WIDGET ||--o{ BANNER : "bannerIds"
    WIDGET ||--o{ POST : "postIds"

    PAGE {
        string id PK
        string title
        string slug UK
        boolean status
        string template
        object seoInfo
    }

    COMPONENT {
        string id PK
        string name
        enum type "BANNER | WIDGET | FORM"
        string content
        int orderIndex
        boolean status
        string template
    }

    BANNER {
        string id PK
        string title
        string altText
        object images "desktop, tablet, mobile"
        string link
        enum target "_blank | _self"
        int orderIndex
        boolean status
        string subFolder
    }

    WIDGET {
        string id PK
        string name
        enum type "BANNER | POST"
        string content
        int orderIndex
        boolean status
        string template
    }

    POST {
        string id PK
        string title
        string content
        string slug UK
        int orderIndex
        boolean status
        string template
        object seoInfo
    }

    FORM {
        int id PK
        string title
        int version
        boolean active
        object schema "fields, steps, config"
    }

    SEO_INFO {
        string title
        string description
        string keywords
        string canonicalUrl
        boolean noIndex
        boolean noFollow
    }

    PAGE ||--o| SEO_INFO : "seoInfo"
    POST ||--o| SEO_INFO : "seoInfo"
```

---

## 2. Hiyerarsik Yapi Agaci (Composition Hierarchy)

Bu diagram, bir sayfanin nasil compose edildigini, hangi entity icine nelerin gelebilecegi kurallarini gosterir.

```mermaid
graph TD
    subgraph "Sayfa Kompozisyonu"
        PAGE["<b>PAGE</b><br/>(Sayfa)"]
        COMP_B["<b>COMPONENT</b><br/>type: BANNER"]
        COMP_W["<b>COMPONENT</b><br/>type: WIDGET"]
        COMP_F["<b>COMPONENT</b><br/>type: FORM"]

        PAGE --> COMP_B
        PAGE --> COMP_W
        PAGE --> COMP_F

        BANNER1["BANNER<br/>desktop + tablet + mobile"]
        BANNER2["BANNER"]
        BANNER3["BANNER"]

        WIDGET1["<b>WIDGET</b><br/>type: BANNER"]
        WIDGET2["<b>WIDGET</b><br/>type: POST"]

        FORM1["<b>FORM</b><br/>schema-driven"]

        COMP_B --> BANNER1

        COMP_W --> WIDGET1
        COMP_W --> WIDGET2

        COMP_F --> FORM1

        WIDGET1 --> BANNER2
        WIDGET1 --> BANNER3

        POST1["POST<br/>(Yazi + SEO)"]
        POST2["POST"]
        WIDGET2 --> POST1
        WIDGET2 --> POST2

        FIELD1["Field: text, email,<br/>number, select..."]
        STEP1["Step: wizard adimlari"]
        FORM1 --> FIELD1
        FORM1 --> STEP1
    end

    style PAGE fill:#6366f1,color:#fff,stroke:#4f46e5,stroke-width:2px
    style COMP_B fill:#8b5cf6,color:#fff,stroke:#7c3aed
    style COMP_W fill:#8b5cf6,color:#fff,stroke:#7c3aed
    style COMP_F fill:#8b5cf6,color:#fff,stroke:#7c3aed
    style BANNER1 fill:#f59e0b,color:#000,stroke:#d97706
    style BANNER2 fill:#f59e0b,color:#000,stroke:#d97706
    style BANNER3 fill:#f59e0b,color:#000,stroke:#d97706
    style WIDGET1 fill:#10b981,color:#fff,stroke:#059669
    style WIDGET2 fill:#10b981,color:#fff,stroke:#059669
    style POST1 fill:#3b82f6,color:#fff,stroke:#2563eb
    style POST2 fill:#3b82f6,color:#fff,stroke:#2563eb
    style FORM1 fill:#ec4899,color:#fff,stroke:#db2777
    style FIELD1 fill:#f3f4f6,color:#000,stroke:#9ca3af
    style STEP1 fill:#f3f4f6,color:#000,stroke:#9ca3af
```

### Kural Ozeti

| Container              | Icerebilecegi Entity'ler | Aciklama                                        |
| ---------------------- | ------------------------ | ----------------------------------------------- |
| **Page**               | Component[]              | Bir sayfa N adet component icerir               |
| **Component (BANNER)** | Banner[]                 | Banner tipindeki component direkt banner icerir |
| **Component (WIDGET)** | Widget[]                 | Widget tipindeki component widget icerir        |
| **Component (FORM)**   | Form[]                   | Form tipindeki component form icerir            |
| **Widget (BANNER)**    | Banner[]                 | Banner tipindeki widget banner icerir           |
| **Widget (POST)**      | Post[]                   | Post tipindeki widget post icerir               |
| **Form**               | Field[], Step[]          | Schema-driven: alanlar ve adimlar               |
| **Banner**             | —                        | Yaprak node, alt entity icermez                 |
| **Post**               | —                        | Yaprak node, alt entity icermez                 |

---

## 3. Uygulama Katman Mimarisi

```mermaid
graph TB
    subgraph "Browser"
        USER["Kullanici"]
    end

    subgraph "Next.js App Router"
        subgraph "Route Layer"
            LOGIN["(layoutLess)/login"]
            DASH["(baseLayout)/dashboard"]
            PAGES_R["(baseLayout)/pages/*"]
            COMP_R["(baseLayout)/components/*"]
            WIDGET_R["(baseLayout)/widgets/*"]
            BANNER_R["(baseLayout)/banners/*"]
            POST_R["(baseLayout)/posts/*"]
            CONTENT_R["(baseLayout)/contents/*"]
            FORM_R["(baseLayout)/forms/*"]
            ASSET_R["(baseLayout)/assets/*"]
        end

        subgraph "Layout Layer"
            ROOT_L["Root Layout<br/>Providers, Theme"]
            BASE_L["BaseAdminLayout<br/>Sidebar + Header"]
            LESS_L["LayoutLess<br/>(no chrome)"]
        end

        subgraph "Component Layer (app/_components)"
            UI_COMP["DataTable, Modal,<br/>SearchInput, DualListbox,<br/>ImageUploadBox, TagsInput,<br/>ConfirmDialog, StatusBadge"]
            FORM_COMP["DynamicForm,<br/>FieldRenderer,<br/>StepManager"]
            LAYOUT_COMP["BaseAdminLayout,<br/>Header, Sidebar"]
        end

        subgraph "Hook Layer (app/_hooks)"
            HOOKS["useAdminTheme<br/>useBasicInfos<br/>useDebounce<br/>useFormSchema<br/>useTemplates"]
        end

        subgraph "Service Layer (app/_services)"
            SVC["pages.services<br/>components.services<br/>widgets.services<br/>banners.services<br/>posts.services<br/>contents.services<br/>forms.services<br/>assets.services"]
        end

        subgraph "Shared Layer"
            SCHEMAS["Zod Schemas<br/>(src/schemas/)"]
            TYPES["TypeScript Types<br/>(src/types/)"]
            UTILS["Utilities<br/>(src/utils/, src/lib/)"]
            PROVIDERS["Providers<br/>TanStack Query, Theme"]
            ACTIONS["Server Actions<br/>(src/actions/)"]
        end
    end

    subgraph "External"
        API["Backend API<br/>/api/v1/*"]
        GEMINI["Google Gemini AI"]
    end

    USER --> ROOT_L
    ROOT_L --> BASE_L
    ROOT_L --> LESS_L
    BASE_L --> DASH
    BASE_L --> PAGES_R
    BASE_L --> COMP_R
    BASE_L --> WIDGET_R
    BASE_L --> BANNER_R
    BASE_L --> POST_R
    BASE_L --> CONTENT_R
    BASE_L --> FORM_R
    BASE_L --> ASSET_R
    LESS_L --> LOGIN

    PAGES_R --> UI_COMP
    COMP_R --> UI_COMP
    FORM_R --> FORM_COMP
    PAGES_R --> HOOKS
    COMP_R --> HOOKS

    HOOKS --> SVC
    SVC --> API
    ACTIONS --> GEMINI

    SVC --> SCHEMAS
    SVC --> TYPES
    SVC --> UTILS

    style USER fill:#1e293b,color:#fff
    style API fill:#dc2626,color:#fff,stroke:#b91c1c
    style GEMINI fill:#4285f4,color:#fff
    style ROOT_L fill:#6366f1,color:#fff
    style BASE_L fill:#8b5cf6,color:#fff
    style LESS_L fill:#8b5cf6,color:#fff
```

---

## 4. CRUD Sayfasi Yapisi (Her Entity Icin)

Her entity icin standart CRUD pattern uygulanir:

```mermaid
graph LR
    subgraph "CRUD Pattern"
        LIST["<b>/entity</b><br/>Liste Sayfasi<br/>DataTable + Search"]
        NEW["<b>/entity/new</b><br/>Olusturma<br/>Form + Validation"]
        EDIT["<b>/entity/[id]/edit</b><br/>Duzenleme<br/>Form + Prefill"]
    end

    LIST -->|"Yeni Ekle"| NEW
    LIST -->|"Duzenle"| EDIT
    NEW -->|"Kaydet"| LIST
    EDIT -->|"Guncelle"| LIST

    style LIST fill:#10b981,color:#fff
    style NEW fill:#3b82f6,color:#fff
    style EDIT fill:#f59e0b,color:#000
```

**Uygulandigi entity'ler:** Pages, Components, Widgets, Banners, Posts, Contents

**Farkli pattern:** Forms (`/forms/[id]` — ayri edit route yerine detay sayfasi)

---

## 5. Kimlik Dogrulama Akisi

```mermaid
sequenceDiagram
    participant U as Kullanici
    participant L as Login Page
    participant SA as Server Action
    participant API as Backend API
    participant C as Cookie Store

    U->>L: Email + Sifre
    L->>SA: saveTokens()
    SA->>API: POST /auth/login
    API-->>SA: accessToken + refreshToken
    SA->>C: Set cookies (httpOnly)
    SA-->>L: Redirect /dashboard

    Note over U,C: Sonraki istekler
    U->>API: Request + accessToken
    API-->>U: Response

    Note over U,C: Token suresi dolunca
    U->>API: Request + expired token
    API-->>U: 401 Unauthorized
    U->>SA: refreshTokenProxy()
    SA->>API: POST /auth/refresh
    API-->>SA: Yeni accessToken
    SA->>C: Update cookie
    SA-->>U: Retry original request
```

---

## 6. Form Engine Yapisi

Form entity'si schema-driven bir yapidadir. Tum form tanimlamasi JSON olarak saklanir.

```mermaid
graph TD
    subgraph "Form Definition"
        FD["Form"]
        FD --> SCHEMA["Schema"]
        SCHEMA --> CONFIG["Config<br/>layout: single|vertical|wizard<br/>submitLabel"]
        SCHEMA --> FIELDS["Fields[]"]
        SCHEMA --> STEPS["Steps[]<br/>(wizard icin)"]

        FIELDS --> F1["Field"]
        F1 --> F1_TYPE["type: text|email|number|<br/>select|checkbox|radio|<br/>textarea|date|phone|url"]
        F1 --> F1_VAL["validation?<br/>min, max, pattern"]
        F1 --> F1_COND["condition?<br/>field, operator, value"]
        F1 --> F1_OPT["options?<br/>label + value pairs"]
    end

    subgraph "Runtime Rendering"
        DYN["DynamicForm"]
        DYN --> ZG["zod-generator<br/>Schema → Zod"]
        DYN --> FR["FieldRenderer<br/>Field → JSX"]
        DYN --> SM["StepManager<br/>Wizard navigation"]
        DYN --> CE["condition-evaluator<br/>Show/hide fields"]
    end

    FD -.->|"JSON schema"| DYN

    style FD fill:#ec4899,color:#fff
    style SCHEMA fill:#f472b6,color:#fff
    style DYN fill:#8b5cf6,color:#fff
    style ZG fill:#a78bfa,color:#fff
    style FR fill:#a78bfa,color:#fff
    style SM fill:#a78bfa,color:#fff
    style CE fill:#a78bfa,color:#fff
```

---

## 7. Dizin Sorumluluk Haritasi

| Dizin                   | Sorumluluk                           | Ornekler                           |
| ----------------------- | ------------------------------------ | ---------------------------------- |
| `src/app/(baseLayout)/` | Admin CRUD route'lari                | pages/, components/, widgets/      |
| `src/app/(layoutLess)/` | Chrome'suz sayfalar                  | login/                             |
| `src/app/_components/`  | Admin UI componentleri (colocated)   | DataTable, Modal, Sidebar          |
| `src/app/_services/`    | API servis fonksiyonlari (colocated) | pages.services.ts                  |
| `src/app/_hooks/`       | Admin-specific React hooks           | useFormSchema, useDebounce         |
| `src/app/_utils/`       | Admin yardimci fonksiyonlar          | zod-generator, condition-evaluator |
| `src/components/ui/`    | Shadcn UI primitives (global)        | Button, Input, Card                |
| `src/schemas/`          | Zod validation semalari              | page.ts, component.ts              |
| `src/types/`            | TypeScript tip tanimlari             | BaseResponse.ts, form.ts           |
| `src/actions/`          | Global server actions                | auth/logout, generate-article      |
| `src/services/`         | Global servisler                     | auth/refreshService                |
| `src/utils/`            | Genel utility fonksiyonlari          | fetcher, imageUrl                  |
| `src/lib/`              | Core library (env, security, AI)     | env.ts, gemini.ts, rate-limiter.ts |
| `src/providers/`        | React provider'lar                   | TanStack Query, Theme              |
| `src/proxy/`            | Token proxy islemleri                | refreshTokenProxy                  |
