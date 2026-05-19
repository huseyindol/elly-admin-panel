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
Görevin: Verilen ham konu ve anahtar kelimeleri alarak, AI'ın derinlemesine, görsel destekli ve odaklı bir makale yazabilmesi için yapılandırılmış bir plan oluşturmak.

Ham Konu: ${topic}
Yardımcı Anahtar Kelimeler: ${keywords || 'Belirtilmedi'}

Lütfen aşağıdaki formatta bir makale planı oluştur:
- Ana başlık önerisi
- Hedef kitle
- Makalenin ana mesajı (1-2 cümle)
- Bölüm başlıkları (en az 5, en fazla 7 bölüm) — her bölüm derinlemesine işlenecek
- Her bölümde ele alınacak temel noktalar (3-5 madde, sadece liste değil; kavram, örnek ve gerekçe)
- Görsel planı: Makale gövdesi içine yerleştirilecek 2 (en fazla 3) görselin nereye konulacağı ve içeriği. Her görsel için:
  * yerleşim: "Hangi bölümün sonunda / hangi paragrafın altında"
  * imagePrompt: kısa İNGİLİZCE görsel prompt (max 14 kelime, fotogerçekçi/diyagram/illustration stilini belirt, marka/kişi adı içermesin)
  * alt: kısa Türkçe alt metin (max 10 kelime)
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
Görevin: Aşağıdaki makale planına göre DERİNLEMESİNE, görsel destekli ve SEO dostu bir makale yazmak.

MAKALE PLANI:
${outline}

YAZIM KURALLARI:
- Makaleyi Türkçe yaz
- Akıcı, anlaşılır ve profesyonel bir dil kullan
- Yüzeysel geçme: her bölüm derinlemesine işlensin, kavramlar tanımlansın, gerekçelendirilsin, somut örnek/senaryo/karşılaştırma verilsin
- Toplam uzunluk minimum 800, maksimum 1500 kelime olmalı (bölüm başına ortalama 150-250 kelime). 800'ün altı kabul edilmez, 1500'ü aşma.
- Sadece geçerli HTML çıktısı ver (body içeriği, html/body/head etiketleri olmadan)
- Kullanabileceğin HTML etiketleri: h1, h2, h3, p, ul, ol, li, strong, em, blockquote, img
- Başlıklar için h1 (ana başlık, sadece 1 adet), h2 (bölüm başlıkları), h3 (alt başlıklar) kullan
- Önemli kavramları <strong> ile vurgula
- Listeleri yalnızca açıklayıcı olduğu yerde kullan — gereksiz bullet'a kaçma

GÖRSEL KURALLARI (ZORUNLU):
- Makale gövdesine 2 (gerekiyorsa en fazla 3) görsel yerleştir. Daha azı kabul edilmez, daha fazlası dağıtıcı olur.
- Her görsel ayrı bir <p>...</p> bloğu içinde olmalı: <p><img src="..." alt="..." width="1200" height="675" loading="lazy" /></p>
- Görseller H1 başlığından ÖNCE olmaz. İlk görsel ilk veya ikinci bölümün ardından, son görsel sonuç bölümünden ÖNCE olmalı.
- Her img src değeri ŞU FORMATTA olmalı (başka domain kullanma):
  https://image.pollinations.ai/prompt/{ENCODED_PROMPT}?width=1200&height=675&nologo=true
  - {ENCODED_PROMPT} kısmı URL-encoded İngilizce görsel prompt'tur (boşluk yerine %20, virgül yerine %2C)
  - Görsel prompt'u 6-14 kelime, fotogerçekçi/illustration/diagram stili belirt, marka veya kişi adı içermesin
- Her görselin alt metni TÜRKÇE, max 12 kelime, görseli açıklayıcı ve anahtar kavramı barındıran şekilde olmalı
- Görsel için ek başlık/figcaption yazma — sadece <p><img/></p>

Herhangi bir markdown, ek açıklama veya kod bloğu ekleme — sadece saf HTML döndür.`

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
1. Sadece şu etiketlere izin ver: h1, h2, h3, p, ul, ol, li, strong, em, blockquote, img — diğer tüm etiketleri kaldır
2. Başlık hiyerarşisini düzelt (h1 → h2 → h3 sırası, sadece 1 adet h1)
3. Boş etiketleri kaldır
4. Birden fazla ardışık boş satırı tek satıra indir
5. img dışındaki tüm etiketlerden script, style, class, id ve inline style attribute'larını kaldır
6. img etiketinde SADECE şu attribute'lara izin ver: src, alt, width, height, loading. Diğerlerini (class, id, style, srcset, data-*, onerror vb.) kaldır.
7. img src değeri "https://image.pollinations.ai/prompt/" ile başlamıyorsa ya da http/https ile başlayan geçerli bir URL değilse görseli komple kaldır.
8. Her img için alt boşsa kısa Türkçe bir alt metni türet; img yine de <p>...</p> içinde sarmalanmış olmalı, değilse sarmalanmış hale getir
9. Görsel sayısı 2 veya 3 olmalı. 1 veya 0 ise olduğu gibi bırak (daha fazlası dağıtıcı). 4+ görsel varsa fazlasını kaldır, içerikle en alakalı 3 tanesini koru.
10. HTML entity'lerini düzgün encode et (&amp; &lt; &gt; vb.)
11. Makul olmayan ya da çok kısa paragrafları bir önceki veya sonraki paragrafla birleştir

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
