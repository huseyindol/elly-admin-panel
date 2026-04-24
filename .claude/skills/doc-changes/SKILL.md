---
name: doc-changes
description: >
  Tamamlanan bir geliştirmeyi veya değişikliği otomatik olarak dokümante eder.
  docs/CHANGELOG.md [Unreleased] bölümünü günceller, gerekirse yeni bir
  docs/{FEATURE}.md rehber dosyası oluşturur.
  Commit öncesi veya sonrası, her geliştirmede /doc-changes komutu ile çalıştır.
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, Bash
---

## Bağlam: Proje Bilgisi

Bu bir Next.js 16 App Router projesi (elly-admin-panel). Değişiklik kayıtları
`docs/CHANGELOG.md` dosyasında tutulur. Her özellik için isteğe bağlı olarak
`docs/{FEATURE_NAME}.md` rehber dosyası da oluşturulabilir.

## Görev

`$ARGUMENTS` değerine göre dökümantasyon üret.

- `$ARGUMENTS` boşsa → son git commit'i analiz ederek değişiklikleri çıkar.
- `$ARGUMENTS` bir açıklama içeriyorsa → o açıklamayı bağlam olarak kullan.
- Örnek: `/doc-changes RabbitMQ yönetim sayfası eklendi`

---

## Adım 1 — Mevcut Durumu Oku

```bash
git log --oneline -1
git diff HEAD~1 --name-only
```

Ayrıca oku:

- `docs/CHANGELOG.md` — mevcut format ve son entry'yi anlamak için
- Son commit'te değişen dosyalar (önemli olanlar, max 10)

---

## Adım 2 — Değişiklikleri Sınıflandır

Değiştirilen dosyaların path'lerine bakarak şu kategorilerden hangilerinin uygulandığını belirle:

| Kategori            | Dosya pattern                              | CHANGELOG etiketi |
| ------------------- | ------------------------------------------ | ----------------- |
| Yeni sayfa/route    | `src/app/(baseLayout)/*/page.tsx`          | **Added**         |
| Yeni servis         | `src/app/_services/*.ts`                   | **Added**         |
| Yeni hook           | `src/app/_hooks/*.ts`                      | **Added**         |
| Yeni shared bileşen | `src/app/_components/*.tsx`                | **Added**         |
| Yeni tip/schema     | `src/types/*.ts`, `src/schemas/*.ts`       | **Added**         |
| Bileşen değişikliği | `src/app/**/*.tsx` (mevcut dosya)          | **Changed**       |
| Hata düzeltme       | `src/app/**` + hata sözcüğü commit msg'da  | **Fixed**         |
| Bağımlılık          | `package.json`, `bun.lock`                 | **Infra**         |
| CI/CD               | `.github/workflows/*.yml`                  | **Infra**         |
| Güvenlik            | `src/lib/security.ts`, `src/middleware.ts` | **Security**      |

---

## Adım 3 — docs/CHANGELOG.md Güncelle

`[Unreleased]` bölümüne ekle. Kurallar:

1. **`[Unreleased]` bölümü yoksa** başa ekle:

   ```markdown
   ## [Unreleased]
   ```

2. **Uygun alt başlık altına** (`### Added`, `### Changed`, vb.) kısa bir madde ekle.
   Format: `- kısa açıklama — ilgili dosya yolu (isteğe bağlı)`

3. **Detay seviyesi:**
   - Tek satır özet (ne eklendi/değişti)
   - Birden fazla dosya varsa, en önemli 3-5'i listele
   - İç implementasyon detayları gereksiz — kullanıcı/geliştirici için önemli olanı yaz

4. **Tarih:** `[Unreleased]` başlığına tarih yazmıyoruz (release'de eklenecek).

**Örnek çıktı (CHANGELOG.md güncellemesi):**

```markdown
## [Unreleased]

### Added

- Kullanıcı davet sistemi — `/users/invite` sayfası, `useInviteUser` hook,
  `src/app/_services/users.services.ts`
- `InviteForm` bileşeni react-hook-form + zod (email regex, rol seçimi)

### Fixed

- Sidebar'da aktif link tespiti `/pages` alt-route'larında çalışmıyordu
```

---

## Adım 4 — Rehber Dosyası (Koşullu)

Aşağıdaki durumlardan biri geçerliyse `docs/{FEATURE_NAME}.md` oluştur:

- 5'ten fazla yeni dosya eklendiyse
- Yeni bir backend entegrasyonu varsa
- Diğer geliştiricilerin "nasıl kullanırım" diyeceği bir API/hook/bileşen seti eklendiyse
- `$ARGUMENTS` "rehber yaz" veya "docs" içeriyorsa

**Rehber dosyası içeriği:**

```markdown
# {Feature} — Kullanım Rehberi

> Kısa açıklama (1-2 cümle).

## Genel Bakış

Mimari / akış şeması (varsa)

## Dosya Yapısı

Oluşturulan dosyaların ağaç görünümü ve kısa açıklamalar

## API / Servis Referansı

Endpoint'ler, request/response tipleri

## Kullanım Örnekleri

Kod snippet'leri — en yaygın kullanım senaryoları

## Önemli Davranışlar / Edge Case'ler

İnce noktalar, hata halleri

## Kontrol Listesi (Bu modülü tekrar eklerken)

- [ ] adımlar
```

Dosya adı formatı: `docs/{KEBAB_CASE_FEATURE}.md`

---

## Adım 5 — Özet Rapor

Şu formatı kullan:

```
## Dökümantasyon Güncellendi ✅

### docs/CHANGELOG.md
[Unreleased] bölümüne X madde eklendi: ...

### docs/{FEATURE}.md (yeni oluşturuldu / güncellendi)
...

### Sonraki Adım (isteğe bağlı)
- Release hazırsa: [Unreleased] → [X.Y.Z] — YYYY-MM-DD formatında dön
- Backend değişikliği varsa ilgili CMS dokümanını da güncelle
```

---

## Kurallar

- `docs/` dışındaki dosyalara dokunma (kod değiştirme)
- Sadece son commit'teki veya `$ARGUMENTS`'taki değişikliği kaydet
- Mevcut CHANGELOG formatını bozma (başlık hiyerarşisi, tarih stilleri)
- Kısa tut: bir madde max 2 satır
- Türkçe yaz (proje dili Türkçe)
