# PR Checklist — nextjs-approute-project

## Kod Kalitesi

- [ ] TypeScript hataları yok (`any` kullanılmamış)
- [ ] `console.log` production kodunda yok
- [ ] Yeni fonksiyonlar/componentler için tip tanımları yapılmış
- [ ] Import path'ler `@/` alias kullanıyor (relative `../` değil)

## Test

- [ ] Yeni component/fonksiyon için test yazılmış
- [ ] Mevcut testler bozulmamış (`npm run test:ci` geçiyor)
- [ ] Edge case'ler test edilmiş (hata, boş, loading durumları)

## Güvenlik

- [ ] Yeni API rotaları rate limiting içeriyor (`src/lib/rate-limiter.ts`)
- [ ] Kullanıcı girdileri Zod ile validate ediliyor (`src/schemas/`)
- [ ] Hassas veri response'lara sızmıyor
- [ ] `process.env` yerine `src/lib/env.ts` kullanılıyor
- [ ] `.env` dosyaları commit edilmemiş

## Next.js Kuralları

- [ ] Client component'ler (`'use client'`) gerçekten client-side ihtiyaç duyuyor
- [ ] Görseller `next/image` ile kullanılıyor
- [ ] Internal linkler `next/link` ile yapılıyor

## UI / Erişilebilirlik

- [ ] Yeni UI elementleri klavye ile erişilebilir
- [ ] Görsellerde `alt` text var
- [ ] Form inputları `<label>` ile ilişkilendirilmiş

## Genel

- [ ] Lock dosyaları (package-lock.json) kasıtlı değiştirilmişse gerekçesi var
- [ ] Yeni bağımlılıklar projeye uygun ve güvenli
- [ ] Breaking change varsa dokümante edilmiş
