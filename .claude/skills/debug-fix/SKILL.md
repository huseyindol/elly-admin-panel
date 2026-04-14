---
name: debug-fix
description: Systematic debugging and fix workflow. Use when the user runs /debug-fix <description-of-issue>.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

Debug and fix the issue: **$ARGUMENTS**

## Steps

1. **Reproduce** — Understand the issue from `$ARGUMENTS`
2. **Locate** — Search for related code:
   - Grep for error messages, function names, component names
   - Glob for related files
   - Read the suspected files
3. **Analyze** — Identify root cause:
   - Check TypeScript types (`bun run tsc --noEmit`)
   - Check imports and dependencies
   - Check state management flow
   - Check API response shapes
4. **Fix** — Apply the minimal correct change:
   - Edit only the affected files
   - Maintain existing patterns
   - Don't introduce `any` types
   - Don't add `console.log`
5. **Verify** — Run checks:
   - `bun run tsc --noEmit` — type check
   - `bun run test:ci` — tests pass
   - `bun run lint` — no lint errors
6. **Report** — Summarize:
   - Root cause
   - Files changed
   - What was fixed and why

## Common Patterns in This Project

- **Cookie type error** → `String()` ile dönüştür
- **API response shape mismatch** → `src/types/` altındaki tipleri kontrol et
- **Auth token expired** → `fetcher.ts` token refresh mekanizmasını incele
- **Client/server boundary** → `'use client'` directive eksik olabilir
- **Zod validation fail** → Schema ile gönderilen veriyi karşılaştır
