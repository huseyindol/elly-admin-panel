'use server'

import { getGeminiModel } from '@/lib/gemini'
import { logger } from '@/lib/logger'

function sanitizeApiKeyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('API_KEY_INVALID') || msg.includes('API key')) {
    return 'Gemini API anahtarı geçersiz veya eksik.'
  }
  return msg
}

// ─── Slug ────────────────────────────────────────────────────────────────────

export async function generateSlugAction(
  title: string,
): Promise<{ success: boolean; slug?: string; error?: string }> {
  try {
    logger.info('[generateSlugAction] Slug üretiliyor', { title })
    const model = getGeminiModel()
    const result = await model.generateContent(
      `Aşağıdaki Türkçe başlıktan SEO dostu bir URL slug'ı oluştur.
Kurallar:
- Sadece küçük harf, rakam ve tire (-) kullan
- Türkçe karakterleri dönüştür (ş→s, ğ→g, ü→u, ö→o, ı→i, ç→c)
- Boşlukları tire ile değiştir
- Ardışık tireleri tekleştir
- Maksimum 80 karakter
- Sadece slug'ı döndür, başka hiçbir şey yazma

Başlık: ${title}`,
    )
    const slug = result.response
      .text()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    logger.info('[generateSlugAction] Tamamlandı', { slug })
    return { success: true, slug }
  } catch (err) {
    logger.error('[generateSlugAction] Hata', err)
    return { success: false, error: sanitizeApiKeyError(err) }
  }
}

// ─── SEO Fields ───────────────────────────────────────────────────────────────

export interface GeneratedSeoFields {
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

export async function generateSeoFieldsAction(title: string): Promise<{
  success: boolean
  data?: GeneratedSeoFields
  error?: string
}> {
  try {
    logger.info('[generateSeoFieldsAction] SEO alanları üretiliyor', { title })
    const model = getGeminiModel()
    const result = await model.generateContent(
      `Aşağıdaki başlık için SEO meta verilerini Türkçe olarak oluştur.
Başlık: "${title}"

Tam olarak şu JSON formatında yanıt ver (başka hiçbir şey yazma):
{
  "seoTitle": "max 60 karakter SEO başlığı",
  "seoDescription": "max 155 karakter meta açıklaması, kullanıcıyı tıklamaya teşvik edecek",
  "seoKeywords": "anahtar1, anahtar2, anahtar3, anahtar4, anahtar5"
}`,
    )

    const raw = result.response
      .text()
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    const parsed: GeneratedSeoFields = JSON.parse(raw)
    logger.info('[generateSeoFieldsAction] Tamamlandı')
    return { success: true, data: parsed }
  } catch (err) {
    logger.error('[generateSeoFieldsAction] Hata', err)
    return { success: false, error: sanitizeApiKeyError(err) }
  }
}

// ─── Description ─────────────────────────────────────────────────────────────

export async function generateDescriptionAction(
  name: string,
  context?: string,
): Promise<{ success: boolean; description?: string; error?: string }> {
  try {
    logger.info('[generateDescriptionAction] Açıklama üretiliyor', { name })
    const model = getGeminiModel()
    const result = await model.generateContent(
      `Aşağıdaki ${context ?? 'içerik'} adı için kısa ve açıklayıcı bir Türkçe açıklama yaz.
Ad: "${name}"

Kurallar:
- Maksimum 2 cümle
- Türkçe yaz
- Sadece açıklamayı döndür, başka hiçbir şey yazma`,
    )
    const description = result.response.text().trim()
    logger.info('[generateDescriptionAction] Tamamlandı')
    return { success: true, description }
  } catch (err) {
    logger.error('[generateDescriptionAction] Hata', err)
    return { success: false, error: sanitizeApiKeyError(err) }
  }
}
