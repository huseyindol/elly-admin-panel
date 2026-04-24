---
name: new-module
description: Scaffold a complete CRUD module (service, hook, schema, types, pages). Use when the user runs /new-module <entity-name>.
disable-model-invocation: true
allowed-tools: Read, Write, Glob, Grep
---

Scaffold a full CRUD admin module for entity: **$ARGUMENTS**

## Steps

1. Parse `$ARGUMENTS` to get:
   - `entityName` — kebab-case (e.g. `blog-categories`)
   - `EntityName` — PascalCase (e.g. `BlogCategories`)
   - `entitySingular` — tekil form (e.g. `blog-category`)

2. Read existing modules for pattern reference:
   - `src/app/_services/mail-accounts.services.ts` — service pattern
   - `src/app/_hooks/useMailAccounts.ts` — TanStack Query hook pattern
   - `src/schemas/mail-account.ts` — Zod schema pattern
   - `src/types/mail-account.ts` — type pattern
   - `src/app/(baseLayout)/mail-accounts/page.tsx` — list page
   - `src/app/(baseLayout)/mail-accounts/new/page.tsx` — create page

3. Create these files (replace placeholders):

```
src/app/_services/{entity-name}.services.ts    — CRUD API calls via fetcher
src/app/_hooks/use{EntityName}.ts              — TanStack Query hooks (list, get, create, update, delete)
src/schemas/{entity-name}.ts                   — Zod create + update schemas
src/types/{entity-name}.ts                     — TypeScript interfaces (Entity, CreateDTO, UpdateDTO)
src/app/(baseLayout)/{entity-name}/page.tsx    — List page with DataTable
src/app/(baseLayout)/{entity-name}/new/page.tsx — Create form page
src/app/(baseLayout)/{entity-name}/[id]/edit/page.tsx — Edit form page
```

4. Service pattern must use:
   - `fetcher` from `@/utils/services/fetcher`
   - API prefix: `/api/v1/{entity-name}`
   - Return types from the types file

5. Hook pattern must use:
   - `useQuery` for list/get
   - `useMutation` with `queryClient.invalidateQueries` for CUD
   - Proper cache keys: `['{entity-name}']`, `['{entity-name}', id]`

6. Page patterns must include:
   - `'use client'` directive
   - DataTable with columns definition
   - React Hook Form + Zod validation
   - Toast notifications (Sonner) for success/error
   - Loading states
   - Breadcrumb navigation

7. Report created files and next manual steps (sidebar menu entry, backend API)

## Naming Rules

- Files: kebab-case (`blog-categories.services.ts`)
- Components/Types: PascalCase (`BlogCategory`, `UseBlogCategories`)
- Hook: `use{PascalCase}` (`useBlogCategories`)
- API path: `/api/v1/{kebab-case}`
- Cache key: `['{kebab-case}']`
