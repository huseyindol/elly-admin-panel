---
name: ai-generate
description: Reference for adding AI generation features using the Gemini pipeline. Covers field generation, article generation, and how to create new AI actions. Use when the user wants to add AI-powered functionality.
user-invocable: false
---

## Gemini AI Entegrasyon Referansı

Bu projede AI üretimi Gemini API + Server Actions ile yapılır.

### Mevcut AI Altyapı

| Dosya                                     | İşlev                                                 |
| ----------------------------------------- | ----------------------------------------------------- |
| `src/lib/gemini.ts`                       | Gemini client (model: `gemini-2.0-flash`)             |
| `src/actions/generate-field.ts`           | Tekil alan üretimi (slug, SEO, alt text, description) |
| `src/actions/generate-article.ts`         | 3-aşamalı makale pipeline                             |
| `src/components/ui/AiFieldButton.tsx`     | Inline AI buton komponenti                            |
| `src/components/posts/AiArticlePanel.tsx` | Makale üretim paneli                                  |

### Yeni AI Action Ekleme Paterni

```typescript
// src/actions/generate-{feature}.ts
'use server'

import { geminiModel } from '@/lib/gemini'
import { logger } from '@/lib/logger'

export async function generate{Feature}Action(input: InputType): Promise<{
  success: boolean
  data?: OutputType
  error?: string
}> {
  try {
    const prompt = `...`  // Türkçe prompt, rolü ve kuralları belirt
    const result = await geminiModel.generateContent(prompt)
    const text = result.response.text()

    // Parse & validate output
    return { success: true, data: parsedOutput }
  } catch (error) {
    logger.error('generate-{feature} failed', error)
    // ASLA ham hata mesajı dönme — API key sızabilir
    return { success: false, error: 'Üretim sırasında bir hata oluştu.' }
  }
}
```

### Kurallar

1. **Server Action olarak yaz** — `'use server'` zorunlu, API key client'a gitmez
2. **Hata sanitizasyonu** — `catch` bloğunda ham error mesajını kullanıcıya dönme
3. **Logger kullan** — `console.log` yasak, `logger.error()` kullan
4. **Türkçe prompt** — İçerik Türkçe üretilecekse prompt'ta belirt
5. **Yapılandırılmış çıktı** — JSON istiyorsan prompt'ta format belirt, `JSON.parse` ile ayrıştır
6. **AiFieldButton** — Tekil alan üretimi için `<AiFieldButton onClick={handler} loading={loading} />` kullan
7. **Panel component** — Çok aşamalı üretim için ayrı panel bileşeni oluştur (`AiArticlePanel` referans)

### 3-Aşamalı Pipeline Pattern

Büyük içerik üretimlerinde kullan:

1. **Planlama Agent** — Konu → yapılandırılmış outline (JSON)
2. **Üretim Agent** — Outline → tam içerik (HTML/text)
3. **Temizlik Agent** — Ham çıktı → sanitize edilmiş çıktı (XSS-safe, heading hiyerarşisi)

Her aşama ayrı `generateContent` çağrısı. Aşamalar arası veriyi server-side tut.

### İzin Verilen HTML Tag'leri (Makale)

`h1`, `h2`, `h3`, `p`, `ul`, `ol`, `li`, `strong`, `em`, `blockquote`

Başka tag'ler (script, iframe, style, div, span) `frontendAgent` tarafından temizlenir.
