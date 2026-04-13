# Agent rehberi — Cursor, Claude Code ve genel kullanım

Bu dosya, projede yapay zekâ asistanlarının ve alt-agent rollerinin nerede tanımlandığını ve nasıl koordine edileceğini özetler. **Proje bağlamı ve stack** için önce [`CLAUDE.md`](./CLAUDE.md) okunmalıdır.

## Yapı özeti

| Konum                                              | Amaç                                                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [`CLAUDE.md`](./CLAUDE.md)                         | Proje stack’i, dizin yapısı, kod/test/API kuralları, agent tablosu                            |
| **Bu dosya (`AGENTS.md`)**                         | Tüm platformlar için agent envanteri ve eşleme                                                |
| [`.claude/agents/`](./.claude/agents/)             | **Claude Code** subagent tanımları (YAML frontmatter: `model`, `tools`)                       |
| [`.agents/`](./.agents/)                           | **Cursor ve diğer araçlar** için aynı rollerin araç-agnostic kopyası (model/tools satırı yok) |
| [`.claude/settings.json`](./.claude/settings.json) | Claude Code Bash/izin allowlist                                                               |
| [`.claude/skills/`](./.claude/skills/)             | Proje skill’leri (ör. `project-conventions`)                                                  |
| [`.claude/PROGRESS.md`](./.claude/PROGRESS.md)     | Modül ilerlemesi ve oturum notları (tercihen tek kaynak)                                      |

`.claude/agents/*.md` ile `.agents/*.md` **aynı rol ve talimatları** taşır; fark yalnızca Claude Code’a özel metadata’dadır.

## Rol envanteri

| Rol                    | Dosya (Claude)                         | Dosya (genel / Cursor)          | Yetki                                | Ne zaman                           |
| ---------------------- | -------------------------------------- | ------------------------------- | ------------------------------------ | ---------------------------------- |
| **team-lead**          | `.claude/agents/team-lead.md`          | `.agents/team-lead.md`          | Okuma/yazma, koordinasyon            | Büyük özellik, çok dosya, refactor |
| **test-writer**        | `.claude/agents/test-writer.md`        | `.agents/test-writer.md`        | Okuma/yazma, test                    | Yeni veya değişen kod için Vitest  |
| **security-reviewer**  | `.claude/agents/security-reviewer.md`  | `.agents/security-reviewer.md`  | Salt okunur                          | API, server action, auth, form     |
| **ui-reviewer**        | `.claude/agents/ui-reviewer.md`        | `.agents/ui-reviewer.md`        | Salt okunur                          | Yeni sayfa/component, a11y         |
| **nextjs-performance** | `.claude/agents/nextjs-performance.md` | `.agents/nextjs-performance.md` | Salt okunur (+ analiz için terminal) | Bundle, RSC sınırı, data fetching  |

Claude Code tarafında `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` ile subagent takımı kullanılıyorsa tanımlar `.claude/agents/` içinden gelir.

## Koordinasyon kuralları (tüm agent’lar)

- Team lead büyük işleri alt görevlere böler; **aynı dosyaya birden fazla yazıcı agent atanmaz** (çakışma önleme).
- Önce salt okunur incelemeleri (security, ui, performance) paralel düşün; ardından implementasyon ve test-writer.
- Rapor formatı: **severity/impact**, **location** (`dosya:satır`), **issue**, **fix**.
- Package manager: **Bun** (`bun run`, `bun install`, `bunx`). `console.log` production kodunda yok. TypeScript strict, `any` yok.

## Cursor kullanımı

- Büyük işlerde ilgili rol dosyasını bağlam olarak ekle: ör. `@.agents/team-lead.md` veya `@AGENTS.md`.
- Kod stili için: `@.claude/skills/project-conventions/SKILL.md` (veya workspace’te eşlenen skill).

## Admin uygulama dizinleri (güncel repo)

`CLAUDE.md` üst düzey `(site)` / `(admin)` özetini verebilir; bu repodaki yönetim paneli sayfaları pratikte şunlardır:

- `src/app/(baseLayout)/` — çoğu admin sayfası
- `src/app/(layoutLess)/` — örn. login
- `src/app/_actions/` — server actions
- `src/app/_hooks/`, `src/app/_services/` — TanStack Query hook’ları ve servis katmanı

Detaylı modül listesi ve checklist için `.claude/PROGRESS.md` kullanılır.
