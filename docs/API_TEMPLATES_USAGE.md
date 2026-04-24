# Template API Endpoint Kullanımı (`/api/templates`)

`src/app/api/templates/route.ts` dosyasında yer alan servis, projede bulunan dinamik şablonların (sayfa, bileşen, widget, post) listesini HTTP üzerinden sağlayan bir REST API endpointidir.

## Özellikler ve Güvenlik

- **URL:** `GET /api/templates`
- **Rate Limiting:** Gelen istekler IP adresine göre hız limitlerine tabidir. Aşırı istek durumunda `429 Too Many Requests` hatası döner.
- **CORS Koruması:** `OPTIONS` ve `GET` istekleri için CORS header'ları eklenmiştir. İstekler projenin environment ayarlarındaki `NEXT_PUBLIC_ADMIN_URL` adresinden gelmelidir. Ayarlı değilse herkese (`*`) açık olur.
- **Cache (Önbellek):** Performansı optimize etmek için API yanıtları `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` başlığıyla döner, bu sayede CDN veya tarayıcı düzeyinde kısa süreli önbelleğeleme yapılır.

## Parametreler

| Parametre | Tip    | Zorunlu | Açıklama                                                                                                                                           |
| :-------- | :----- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`    | String | Hayır   | Görüntülenecek script tipini daraltır. Sadece belirlediğiniz klasördeki dizini okur.<br>Mevcut Değerler: `pages`, `posts`, `components`, `widgets` |

## Kullanım Örnekleri

### 1. Belirli Bir Tür İçin Template Almak

Eğer sadece **sayfalar (pages)** için oluşturulmuş şablon dosyalarını (`src/components/dynamic/pages/` dizinindekiler) listelemek isterseniz query string olarak `type=pages` eklemelisiniz.

**İstek:**

```http
GET /api/templates?type=pages
```

**Yanıt (JSON):**
Her zaman `value` ve `label` içeren nesne dizisi döner. Liste her zaman boş bir "Template Seçin" öğesi ile başlar.

```json
[
  { "value": "", "label": "Template Seçin" },
  { "value": "HomePageTemplate", "label": "HomePageTemplate" },
  { "value": "AboutPageTemplate", "label": "AboutPageTemplate" }
]
```

### 2. Tüm Template Listelerini Toplu Almak

Eğer `type` parametresi göndermezseniz, API tüm geçerli klasörleri arar ve kategorileştirilmiş tek bir JSON objesi döndürür.

**İstek:**

```http
GET /api/templates
```

**Yanıt (JSON):**

```json
{
  "pages": [
    { "value": "", "label": "Template Seçin" },
    { "value": "HomePageTemplate", "label": "HomePageTemplate" }
  ],
  "posts": [
    { "value": "", "label": "Template Seçin" },
    { "value": "ArticleTemplate", "label": "ArticleTemplate" }
  ],
  "components": [{ "value": "", "label": "Template Seçin" }],
  "widgets": [{ "value": "", "label": "Template Seçin" }]
}
```

### 3. Frontend (React) Üzerinden Kullanımı

Aşağıdaki örnekte Next.js veya standart React üzerinden `fetch` ile bu endpoint'in nasıl çağrılacağını görebilirsiniz:

```typescript
// fetchTemplate.ts
export type TemplateOption = { value: string; label: string }
export type TemplateType = 'pages' | 'posts' | 'components' | 'widgets'

export async function fetchTemplatesByType(
  type: TemplateType,
): Promise<TemplateOption[]> {
  const response = await fetch(`/api/templates?type=${type}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 429) {
      console.error('IP Bazlı İstek Sınırına (Rate Limit) Takıldınız.')
    }
    throw new Error('Template verisi alınamadı.')
  }

  return response.json()
}
```

## Arkanda Yatan Mimari (Nasıl Çalışıyor?)

1. İstek geldiğinde güvenlik amaçlı IP adresi kontrol edilir ve `limiter.check(ip)` metodundan geçirilir.
2. `src/components/dynamic/` klasörü altına gidilerek `type` opsiyonunda belirtilen isme sahip klasör taranır. (Ör. `src/components/dynamic/pages`)
3. Sadece `.tsx` veya `.ts` uzantılı dosyalar dikkate alınır, `index.tsx` gibi dosyalar pas geçilir.
4. Dosya isimlerinin uzantıları kaldırılır, alfabetik sıraya göre dizilir ve `{ label, value }` yapısına büründürülerek formatlanır.
