# Agent & Skill Rehberi — Claude Code + Cursor

Bu dosya, projede yapay zekâ asistanlarının, rollerin ve skill'lerin nerede tanımlandığını özetler. **Proje bağlamı ve stack** için önce [`CLAUDE.md`](./CLAUDE.md) okunmalıdır.

## Yapı özeti

| Konum                                              | Platform     | Amaç                                                 |
| -------------------------------------------------- | ------------ | ---------------------------------------------------- |
| [`.claude/agents/`](./.claude/agents/)             | Claude Code  | Subagent tanımları (YAML: `model`, `tools`)          |
| [`.claude/skills/`](./.claude/skills/)             | Claude Code  | Skill'ler — `/komut` ile çalışır                     |
| [`.claude/settings.json`](./.claude/settings.json) | Claude Code  | Bash/izin allowlist                                  |
| [`.claude/PROGRESS.md`](./.claude/PROGRESS.md)     | Her iki araç | Modül ilerlemesi ve oturum notları                   |
| [`.cursor/rules/`](./.cursor/rules/)               | Cursor       | Agent rolleri + skill'ler — `@kural-adı` ile çalışır |
| [`.agents/`](./.agents/)                           | Genel        | Araç-agnostic agent tanımları (legacy referans)      |
| **Bu dosya (`AGENTS.md`)**                         | Her iki araç | Envanter ve koordinasyon özeti                       |

## Platform eşleme tablosu

### Agent Rolleri

| Rol                    | Claude Code                            | Cursor                | Kullanım                               |
| ---------------------- | -------------------------------------- | --------------------- | -------------------------------------- |
| **team-lead**          | `.claude/agents/team-lead.md`          | `@team-lead`          | Büyük özellik, refactor, koordinasyon  |
| **test-writer**        | `.claude/agents/test-writer.md`        | `@test-writer`        | Vitest test yazımı                     |
| **security-reviewer**  | `.claude/agents/security-reviewer.md`  | `@security-reviewer`  | API/auth güvenlik review (salt okunur) |
| **ui-reviewer**        | `.claude/agents/ui-reviewer.md`        | `@ui-reviewer`        | UI/a11y review (salt okunur)           |
| **nextjs-performance** | `.claude/agents/nextjs-performance.md` | `@nextjs-performance` | Performance review (salt okunur)       |

### Skill'ler

| Skill                   | Claude Code               | Cursor                    | Açıklama                                                |
| ----------------------- | ------------------------- | ------------------------- | ------------------------------------------------------- |
| **project-conventions** | _(otomatik)_              | _(alwaysApply)_           | Kod stili, naming, mimari — her zaman aktif             |
| **gen-test**            | `/gen-test <dosya>`       | `@gen-test`               | Kaynak dosya için Vitest testi üretir                   |
| **new-component**       | `/new-component <Ad>`     | `@new-component`          | React component + test scaffold                         |
| **new-module**          | `/new-module <entity>`    | `@new-module`             | Tam CRUD modül scaffold (7 dosya)                       |
| **new-service**         | `/new-service <entity>`   | `@new-service`            | Service + TanStack Query hook çifti                     |
| **new-page**            | `/new-page <entity>`      | `@new-page`               | Admin sayfaları scaffold (list, new, edit)              |
| **pr-check**            | `/pr-check`               | `@pr-check`               | Git diff'i proje checklist'ine göre review              |
| **doc-changes**         | `/doc-changes [açıklama]` | `@doc-changes`            | Değişiklikleri CHANGELOG + rehber olarak dokümante eder |
| **ai-generate**         | _(otomatik)_              | _(globs: generate-\*.ts)_ | Gemini AI entegrasyon referansı                         |
| **debug-fix**           | `/debug-fix <sorun>`      | `@debug-fix`              | Sistematik hata ayıklama akışı                          |

## Nasıl kullanılır

### Claude Code'da

```
# Slash command ile skill çalıştır
/new-module blog-categories
/gen-test src/components/ui/AiFieldButton.tsx
/pr-check
/doc-changes              # son commit'ten otomatik dokümante et
/doc-changes Ödeme modülü eklendi   # açıklama ile

# Agent Teams ile (otomatik atanır)
# team-lead büyük görevleri alt agent'lara dağıtır
```

### Cursor'da

```
# Chat'te @ ile referans ver
@new-module blog-categories entity'si için CRUD modül oluştur
@gen-test src/components/ui/AiFieldButton.tsx için test yaz
@pr-check bu PR'ı kontrol et
@doc-changes bu geliştirmeyi dokümante et
@team-lead bu feature'ı planla ve böl
@security-reviewer bu API route'u incele
```

## Koordinasyon kuralları (tüm agent'lar)

- Team lead büyük işleri alt görevlere böler; **aynı dosyaya birden fazla yazıcı agent atanmaz**
- Önce salt okunur incelemeleri (security, ui, performance) paralel düşün; ardından implementasyon
- Rapor formatı: **severity/impact**, **location** (`dosya:satır`), **issue**, **fix**
- Package manager: **Bun** (`bun run`, `bun install`, `bunx`)
- `console.log` production kodunda yok. TypeScript strict, `any` yok

## Admin uygulama dizinleri

- `src/app/(baseLayout)/` — admin panel sayfaları
- `src/app/(layoutLess)/` — login
- `src/app/_actions/`, `src/app/_hooks/`, `src/app/_services/` — iş mantığı katmanı

## Dökümantasyon Akışı

Her özellik tamamlandığında:

```
kod yaz → test geç → @doc-changes çalıştır → commit → push
```

| Doküman                 | Amaç                                                      |
| ----------------------- | --------------------------------------------------------- |
| `docs/CHANGELOG.md`     | Tüm değişikliklerin kronolojik kaydı (Keep a Changelog)   |
| `docs/{FEATURE}.md`     | Belirli modüller için kullanım rehberi (büyük özellikler) |
| `.claude/agent-memory/` | Agent oturum notları, mimari kararlar (kalıcı hafıza)     |

Detaylı modül listesi ve TODO'lar: [`.claude/PROGRESS.md`](./.claude/PROGRESS.md)
