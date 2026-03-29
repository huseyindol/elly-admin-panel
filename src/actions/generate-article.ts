'use server'

import { getGeminiModel } from '@/lib/gemini'
import { logger } from '@/lib/logger'

export interface GenerateArticleInput {
  topic: string
  keywords: string
}

export interface GenerateArticleResult {
  success: boolean
  html?: string
  error?: string
}

/**
 * Article Agent — Step 1
 * Takes the raw topic and keywords, refines them into a structured article outline
 * for more focused and accurate content generation.
 */
async function articleAgent(topic: string, keywords: string): Promise<string> {
  logger.info('[ArticleAgent] Konu analiz ediliyor...', { topic, keywords })
  const model = getGeminiModel()

  const refinementPrompt = `Sen bir makale planlama ve içerik stratejisi uzmanısın.
Görevin: Verilen ham konu ve anahtar kelimeleri alarak, AI'ın daha kaliteli ve odaklanmış bir makale yazabilmesi için yapılandırılmış bir makale planı oluşturmak.

Ham Konu: ${topic}
Yardımcı Anahtar Kelimeler: ${keywords || 'Belirtilmedi'}

Lütfen aşağıdaki formatta bir makale planı oluştur:
- Ana başlık önerisi
- Hedef kitle
- Makalenin ana mesajı (1-2 cümle)
- Bölüm başlıkları (en az 4, en fazla 7 bölüm)
- Her bölümde ele alınacak temel noktalar (2-3 madde)
- Sonuç bölümünde yer alacak çağrı-eylem (CTA)

Yanıtını Türkçe ver ve yalnızca yapılandırılmış planı döndür, ek açıklama yapma.`

  const refinementResult = await model.generateContent(refinementPrompt)
  logger.info('[ArticleAgent] Outline hazırlandı')
  return refinementResult.response.text()
}

/**
 * Article Agent — Step 2
 * Takes the refined outline and generates a full article as HTML
 */
async function generateFullArticle(outline: string): Promise<string> {
  logger.info('[ArticleAgent] Makale içeriği oluşturuluyor...')
  const model = getGeminiModel()

  const articlePrompt = `Sen profesyonel bir Türkçe içerik yazarı ve web editörüsün.
Görevin: Aşağıdaki makale planına göre kapsamlı, bilgilendirici ve SEO dostu bir makale yazmak.

MAKALE PLANI:
${outline}

YAZIM KURALLARI:
- Makaleyi Türkçe yaz
- Akıcı, anlaşılır ve profesyonel bir dil kullan
- Her bölüm için yeterli derinlik ve detay sağla
- Sadece geçerli HTML çıktısı ver (body içeriği, html/body/head etiketleri olmadan)
- Kullanabileceğin HTML etiketleri: h1, h2, h3, p, ul, ol, li, strong, em, blockquote
- Başlıklar için h1 (ana başlık), h2 (bölüm başlıkları), h3 (alt başlıklar) kullan
- Önemli kavramları <strong> ile vurgula
- Listeleri uygun yerde kullan
- Herhangi bir markdown, ek açıklama veya kod bloğu ekleme — sadece saf HTML döndür`

  const articleResult = await model.generateContent(articlePrompt)
  logger.info('[ArticleAgent] Ham HTML içerik üretildi')
  return articleResult.response.text()
}

/**
 * Frontend Agent
 * Reviews the generated HTML article, validates structure,
 * cleans up any unwanted tags, and ensures proper semantic markup
 */
async function frontendAgent(rawHtml: string): Promise<string> {
  logger.info('[FrontendAgent] HTML semantik yapısı gözden geçiriliyor...')
  const model = getGeminiModel()

  const reviewPrompt = `Sen bir frontend geliştirici ve HTML/erişilebilirlik uzmanısın.
Görevin: Verilen HTML makale içeriğini incelemek, düzeltmek ve temizlemek.

HAM HTML:
${rawHtml}

YAPILACAKLAR:
1. Sadece şu etiketlere izin ver: h1, h2, h3, p, ul, ol, li, strong, em, blockquote — diğer tüm etiketleri kaldır
2. Başlık hiyerarşisini düzelt (h1 → h2 → h3 sırası)
3. Boş etiketleri kaldır
4. Birden fazla ardışık boş satırı tek satıra indir
5. Script, style, class, id ve inline style attribute'larını kaldır
6. HTML entity'lerini düzgün encode et (&amp; &lt; &gt; vb.)
7. Makul olmayan ya da çok kısa paragrafları bir önceki veya sonraki paragrafla birleştir

ÖNEMLI: Yalnızca temizlenmiş HTML döndür. Açıklama, yorum, markdown veya kod bloğu ekleme.`

  const reviewResult = await model.generateContent(reviewPrompt)
  let cleanHtml = reviewResult.response.text().trim()

  // Strip markdown code fences if AI wraps output in them
  cleanHtml = cleanHtml
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  logger.info('[FrontendAgent] HTML temizlendi, içerik hazır')
  return cleanHtml
}

/**
 * Main server action — orchestrates Article Agent + Frontend Agent
 * 1. Article Agent refines topic and generates structured content
 * 2. Frontend Agent reviews and cleans the HTML output
 */
export async function generateArticleAction(
  input: GenerateArticleInput,
): Promise<GenerateArticleResult> {
  try {
    const { topic, keywords } = input

    if (!topic || topic.trim().length < 3) {
      return {
        success: false,
        error: 'Makale konusu en az 3 karakter olmalıdır',
      }
    }

    logger.info('[generateArticleAction] Makale üretimi başlatıldı', { topic })

    // Step 1: Article Agent — refine topic into outline
    const outline = await articleAgent(topic.trim(), keywords.trim())

    // Step 2: Article Agent — generate full article from outline
    const rawHtml = await generateFullArticle(outline)

    // Step 3: Frontend Agent — review and clean HTML
    const cleanHtml = await frontendAgent(rawHtml)

    logger.info('[generateArticleAction] Tamamlandı ✓')
    return { success: true, html: cleanHtml }
  } catch (err) {
    logger.error('[generateArticleAction] Hata oluştu', err)

    // API key hatası — kullanıcıya teknik detay gösterme
    const rawMessage = err instanceof Error ? err.message : String(err)
    if (
      rawMessage.includes('API_KEY_INVALID') ||
      rawMessage.includes('API key not valid') ||
      rawMessage.includes('API key')
    ) {
      return {
        success: false,
        error:
          'Gemini API anahtarı geçersiz veya eksik. Lütfen sistem yöneticisiyle iletişime geçin.',
      }
    }

    const message =
      err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu'
    return { success: false, error: message }
  }
}
