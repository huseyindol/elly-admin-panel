# Dynamic Template Loading System

Bu döküman, admin panelinde kullanılan dinamik template yükleme sistemini açıklar.

## Genel Bakış

Template sistemi, `Page`, `Component`, `Widget` ve `Post` entity'leri için dinamik şablon seçimi sağlar. Template dosyaları `src/components/dynamic/` dizininden runtime'da okunur.

## Dizin Yapısı

```
src/
├── components/dynamic/           # Template dosyaları
│   ├── pages/
│   │   ├── APage.tsx
│   │   ├── BPage.tsx
│   │   └── CPage.tsx
│   ├── components/
│   │   ├── AComponent.tsx
│   │   └── BComponent.tsx
│   ├── widgets/
│   │   ├── AWidget.tsx
│   │   └── BWidget.tsx
│   └── posts/
│       ├── APost.tsx
│       └── BPost.tsx
│
├── app/(admin)/admin/
│   ├── _actions/
│   │   └── templates.actions.ts  # Server Action
│   └── _hooks/
│       └── useTemplates.ts       # Custom Hook
│
└── scripts/
    └── generate-templates.ts     # Alternatif: Statik dosya üretici
```

## Nasıl Çalışır?

### 1. Server Action (`templates.actions.ts`)

Server tarafında dosya sistemini okur ve template listesini döndürür:

```typescript
'use server'

export async function getPageTemplates(): Promise<TemplateOption[]> {
  // src/components/dynamic/pages/ dizinini okur
  // .tsx/.ts dosyalarını listeler
  // { value: 'APage', label: 'APage' } formatında döndürür
}
```

### 2. Custom Hook (`useTemplates.ts`)

React component'lerde kullanım için hook:

```typescript
import { useTemplates } from '@/app/(admin)/admin/_hooks/useTemplates'

function MyForm() {
  const { templates, isLoading } = useTemplates('pages')
  // templates: [{ value: '', label: 'Template Seçin' }, { value: 'APage', label: 'APage' }, ...]
}
```

**Desteklenen tipler:** `'pages' | 'components' | 'widgets' | 'posts'`

### 3. Form'da Kullanım

```tsx
const { templates: pageTemplates } = useTemplates('pages')

<select {...register('template')}>
  {pageTemplates.map(t => (
    <option key={t.value} value={t.value}>
      {t.label}
    </option>
  ))}
</select>
```

## Yeni Template Ekleme

1. İlgili dizine `.tsx` dosyası ekleyin:

   ```bash
   # Örnek: Yeni page template
   touch src/components/dynamic/pages/MyNewPage.tsx
   ```

2. Component'i oluşturun:

   ```tsx
   export default function MyNewPage() {
     return <div>My New Page Template</div>
   }
   ```

3. Form'u yenileyin - yeni template otomatik listede görünecek!

## Alternatif: Statik Script

Build-time statik liste oluşturmak için:

```bash
bun scripts/generate-templates.ts
```

Bu komut `src/app/(admin)/admin/_constants/templates.ts` dosyasını oluşturur.

> **Not:** Dinamik Server Action kullanıldığı için bu script opsiyoneldir.

## Akış Diyagramı

```
┌──────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│   Form Component │────▶│   useTemplates Hook │────▶│   Server Action  │
└──────────────────┘     └─────────────────────┘     └─────────┬────────┘
                                                               │
                                                               ▼
                                                     ┌──────────────────┐
                                                     │  File System     │
                                                     │  /dynamic/pages  │
                                                     └──────────────────┘
```

## Backend Entegrasyonu

> ⚠️ **Önemli:** Backend API'ları `template` alanını desteklemelidir. Şu an sadece frontend'de select görüntüleniyor, API'ların bu alanı persist etmesi gerekir.
