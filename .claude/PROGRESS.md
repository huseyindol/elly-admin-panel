# Elly Admin Panel — Geliştirme İlerleyiş Dosyası

> Claude bu dosyayı her oturumda okur ve günceller.  
> Kaldığı yerden devam etmek için buraya bakar.

---

## TAMAMLANAN MODÜLLER ✅

### SKILL-01: AI Alan Üretimi

- **Dosyalar:** `src/actions/generate-field.ts`, `src/components/ui/AiFieldButton.tsx`
- Slug, SEO başlık/açıklama/keywords, banner alt text, içerik açıklaması
- Tüm actionlar Server Action — Gemini key client'a gitmez

### SKILL-02: AI Makale Üretimi (3-Stage Pipeline)

- **Dosyalar:** `src/actions/generate-article.ts`, `src/components/posts/AiArticlePanel.tsx`
- Stage 1: `articleAgent()` → Topic + keywords → Outline
- Stage 2: `generateFullArticle()` → Outline → HTML makale
- Stage 3: `frontendAgent()` → HTML temizle + heading hiyerarşisi düzelt
- İzin verilen tag'ler: h1-h3, p, ul, ol, li, strong, em, blockquote
- Model: `gemini-2.0-flash` | Config: `src/lib/gemini.ts`

### SKILL-03: Mail Account Yönetimi

- **Konum:** `src/app/(baseLayout)/mail-accounts/`
- CRUD + SMTP test modal + form entegrasyon dropdown
- Servis: `src/app/_services/mail-accounts.services.ts`

### SKILL-04: Multi-tenant Template Sistemi

- Hook: `useTemplates(type)` — `src/app/_hooks/useTemplates.ts`
- API: `GET /api/v1/templates?type=posts|pages|...`

### SKILL-05: Agent Teams + Cross-Platform Skills (Claude Code + Cursor)

- `.claude/agents/` → Claude Code subagent’ları (YAML: model, tools) — 5 rol
- `.claude/skills/` → Claude Code skill’leri — 9 adet, `/komut` ile çalışır
- `.cursor/rules/` → Cursor .mdc rules — aynı 5 agent + 9 skill, `@kural-adı` ile çalışır
- `.agents/` → araç-agnostic agent tanımları (legacy referans)
- Kök `AGENTS.md` → platform eşleme tablosu ve koordinasyon özeti
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` ile Claude tarafında aktif

**Cross-platform eşleşme tamamlandı:**
| Claude Code | Cursor | Tetikleme |
|---|---|---|
| `.claude/agents/team-lead.md` | `.cursor/rules/team-lead.mdc` | subagent / `@team-lead` |
| `.claude/skills/new-module/SKILL.md` | `.cursor/rules/new-module.mdc` | `/new-module` / `@new-module` |
| _(9 skill + 5 agent — tam eşleşme)_ | | |

### SKILL-06: RichText Editor

- `src/components/ui/RichTextEditor.tsx` — Tiptap 3.x
- AI makale çıktısını doğrudan alır

### SKILL-07: ISR Revalidation

- `src/app/api/revalidate/` — Bearer token auth ile cache temizleme

---

## DEVAM EDEN / PLANLANAN ⚠️

### SKILL-08: Production Log Temizliği

- `src/utils/services/fetcher.ts` satır 37, 45, 54 → `console.log` kaldırılacak

### SKILL-09: Error Monitoring

- `src/app/error.tsx` + `global-error.tsx` → Sentry/monitoring entegrasyonu

### SKILL-10: Pages Error Toast

- `src/app/(baseLayout)/pages/page.tsx` → hata durumunda toast eklenecek

### SKILL-11: Cookie Timezone Fix

- `src/proxy.ts` → süresi dolan cookie timezone dönüşümü

---

## YENİ MODÜL EKLERKEN CHECKLIST

```
1. src/app/_services/[entity].services.ts     — API katmanı
2. src/app/_hooks/use[Entity].ts              — TanStack Query hook
3. src/schemas/[entity].ts                    — Zod şema
4. src/types/[entity].ts                      — TypeScript tipler
5. src/app/(baseLayout)/[entity]/page.tsx     — Liste sayfası
6. src/app/(baseLayout)/[entity]/new/page.tsx — Yeni kayıt
7. src/app/(baseLayout)/[entity]/[id]/edit/   — Düzenleme
8. src/components/[entity]/                   — Paylaşılan componentler (gerekirse)
```

---

## KRİTİK KURALLAR

- Package manager: sadece `bun` (`bun run`, `bun install`, `bunx`)
- TypeScript strict — `any` yasak
- `console.log` production koduna girmesin
- Cookie'ye number yazarken `String()` ile dönüştür
- Pre-commit: `tsc --noEmit` — type error varsa commit engellenir
- Yeni API rotaları: rate limiting + input sanitization zorunlu
- Zod şemaları: `src/schemas/` altında

---

## OTURUM LOGU

| Tarih      | Yapılan                                                                                                                                                                                                           | Sonraki Adım                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 2026-04-12 | Memory sistemi kuruldu, proje tam snapshot alındı                                                                                                                                                                 | Skill sistemi genişletme                 |
| 2026-04-13 | 5 yeni skill eklendi (new-module, new-service, new-page, ai-generate, debug-fix). Bug fix: pr-check `npm`→`bun`, CLAUDE.md dizin yapısı düzeltildi, settings.json genişletildi, AGENTS.md skill envanteri eklendi | Cross-platform eşleşme                   |
| 2026-04-14 | `.cursor/rules/` altına 14 .mdc dosyası oluşturuldu: 5 agent + 9 skill. Eski `nextjs-rule.mdc` deprecated. AGENTS.md platform eşleme tablosuna güncellendi. Claude Code ↔ Cursor tam eşleşme tamamlandı           | SKILL-08 (log temizliği) veya yeni modül |

---

## AKTİF BRANCH

`claude/ai-article-generation-DZrrK`  
Main'e merge edilmemiş son çalışmalar burada.
