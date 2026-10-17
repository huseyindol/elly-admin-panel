---
name: ai-generate
description: Reference for adding AI generation features using the Gemini pipeline. Covers field generation, article generation, and how to create new AI actions. Use when the user wants to add AI-powered functionality.
user-invocable: false
---

## Gemini AI Entegrasyon Referansı

Bu projede AI üretimi `elly-backend` üzerindeki `/api/v1/ai/*` endpoint'leri (Google Gemini Interactions API `gemini-3.8-flash`) + Next.js Server Actions ile yapılır. API anahtarı (`GEMINI_API_KEY`) yalnız `elly-backend` tarafında tutulur.

### Mevcut AI Altyapı

| Dosya                                     | İşlev                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `src/actions/generate-field.ts`           | Tekil alan üretimi (`/api/v1/ai/{slug,seo,alt-text,blog-info,description}`) |
| `src/actions/generate-article.ts`         | 3-aşamalı makale pipeline (`/api/v1/ai/article`)                            |
| `src/components/ui/AiFieldButton.tsx`     | Inline AI buton komponenti                                                  |
| `src/components/posts/AiArticlePanel.tsx` | Makale üretim paneli                                                        |

### Yeni AI Action Ekleme Paterni

```typescript
// src/actions/generate-{feature}.ts
'use server'

import { logger } from '@/lib/logger'
import { BaseResponse } from '@/types/BaseResponse'
import { fetcher } from '@/utils/services/fetcher'

export async function generate{Feature}Action(input: InputType): Promise<{
  success: boolean
  data?: OutputType
  error?: string
}> {
  try {
    const res = await fetcher<BaseResponse<OutputType>>('/api/v1/ai/{feature}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res?.result || !res.data) {
      return { success: false, error: res?.message || 'Üretim sırasında bir hata oluştu.' }
    }
    return { success: true, data: res.data }
  } catch (error) {
    logger.error('generate-{feature} failed', error)
    return { success: false, error: 'Üretim sırasında bir hata oluştu.' }
  }
}
```

### Kurallar

1. **Backend üzerinden çağır** — AI istekleri `fetcher('/api/v1/ai/...', ...)` ile `elly-backend`'e gider; client veya frontend sunucusunda Gemini API key tutulmaz.
2. **Hata sanitizasyonu** — `catch` bloğunda ham error mesajını sızdırma.
3. **Logger kullan** — `console.log` yasak, `logger.error()` kullan.
4. **AiFieldButton** — Tekil alan üretimi için `<AiFieldButton onClick={handler} loading={loading} />` kullan.
5. **Panel component** — Çok aşamalı üretim için ayrı panel bileşeni oluştur (`AiArticlePanel` referans).

### 3-Aşamalı Pipeline Pattern (Backend `AiService.generateArticle`)

Büyük içerik üretimlerinde backend 3 aşamalı pipeline çalıştırır:

1. **Planlama Agent** — Konu → yapılandırılmış outline
2. **Üretim Agent** — Outline → tam içerik (HTML)
3. **Temizlik Agent** — Ham çıktı → sanitize edilmiş çıktı (XSS-safe, heading hiyerarşisi)

### İzin Verilen HTML Tag'leri (Makale)

`h1`, `h2`, `h3`, `p`, `ul`, `ol`, `li`, `strong`, `em`, `blockquote`, `img`

Başka tag'ler (script, iframe, style, div, span) `frontendAgent` tarafından temizlenir.

### Görsel Kuralları (Makale)

- Her makalede **2 (en fazla 3)** görsel olmalı. 0 veya 1 olabilir ama 4+ kabul edilmez.
- `img` etiketi yalnızca `<p>...</p>` içinde sarmalanmış olur.
- `img` üzerinde izinli attribute'lar: `src`, `alt`, `width`, `height`, `loading`.
- `src` formatı (zorunlu domain — Pollinations.ai, ücretsiz AI image proxy):
  `https://image.pollinations.ai/prompt/{ENCODED_PROMPT}?width=1200&height=675&nologo=true`
  - `{ENCODED_PROMPT}` URL-encoded **İngilizce** görsel prompt (6-14 kelime, fotogerçekçi/illustration/diagram stilini belirt, marka veya kişi adı içermesin)
- `alt` zorunlu, Türkçe, max ~12 kelime. Boşsa `frontendAgent` üretir.
- RichTextEditor `@tiptap/extension-image` ile yüklü; başka bir TipTap extension'ı eklemeden önce StarterKit ile çakışma olmadığından emin ol.
