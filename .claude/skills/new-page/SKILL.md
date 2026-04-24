---
name: new-page
description: Scaffold an admin page (list, create, edit) under (baseLayout). Use when the user runs /new-page <entity-name>.
disable-model-invocation: true
allowed-tools: Read, Write, Glob, Grep
---

Scaffold admin pages for: **$ARGUMENTS**

## Steps

1. Parse `$ARGUMENTS`:
   - `entity-name` — kebab-case (e.g. `blog-categories`)
   - `EntityName` — PascalCase (e.g. `BlogCategories`)
   - `entitySingular` — tekil PascalCase (e.g. `BlogCategory`)

2. Read reference pages:
   - `src/app/(baseLayout)/mail-accounts/page.tsx` — list page pattern
   - `src/app/(baseLayout)/mail-accounts/new/page.tsx` — create page pattern
   - `src/app/(baseLayout)/mail-accounts/[id]/edit/page.tsx` — edit page pattern

3. Create **list page**: `src/app/(baseLayout)/{entity-name}/page.tsx`

Must include:

- `'use client'` directive
- Import from `use{EntityName}` hook
- `DataTable` with column definitions
- Delete confirmation via `AlertDialog`
- Link to `/new` and `/[id]/edit`
- Loading spinner, error toast, empty state
- Breadcrumb: Dashboard > {Entity Name}

4. Create **create page**: `src/app/(baseLayout)/{entity-name}/new/page.tsx`

Must include:

- `'use client'` directive
- React Hook Form + Zod schema
- `createMutation` from hook
- Success toast + redirect to list
- Error handling
- Breadcrumb: Dashboard > {Entity Name} > Yeni

5. Create **edit page**: `src/app/(baseLayout)/{entity-name}/[id]/edit/page.tsx`

Must include:

- `'use client'` directive
- `useParams()` to get `id`
- `getQuery(id)` to fetch existing data
- React Hook Form with `defaultValues` from fetched data
- `updateMutation` from hook
- Success toast + redirect
- Loading state while fetching
- Breadcrumb: Dashboard > {Entity Name} > Düzenle

6. Report created pages and remind about:
   - Sidebar menu entry in `src/app/_components/Sidebar.tsx`
   - Zod schema if not yet created
   - Service + hook if not yet created (suggest `/new-service`)
