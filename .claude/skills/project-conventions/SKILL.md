---
name: project-conventions
description: Code style, naming conventions, and architectural patterns for the nextjs-approute-project. Apply automatically when writing or reviewing any code in this project.
user-invocable: false
---

## Naming Conventions

- React components: PascalCase (`MyComponent.tsx`)
- Utility/lib files: kebab-case (`rate-limiter.ts`)
- Constants: UPPER_SNAKE_CASE
- Hooks: camelCase starting with `use` (`useMyHook`)
- Types/interfaces: PascalCase (`type MyType`, `interface MyInterface`)
- Zod schemas: camelCase ending with `Schema` (`contactFormSchema`)

## Component Patterns

- Server Components by default — add `'use client'` only when needed (state, effects, event handlers, browser APIs)
- Props interfaces defined inline or in `src/types/`
- Shadcn UI components from `src/components/ui/` — don't reinvent base elements
- Tailwind CSS for styling — no inline styles, no CSS modules

## API Route Patterns

```typescript
// Every API route must have:
import { rateLimiter } from '@/lib/rate-limiter'
// Rate limit check at the start
// Method validation
// Zod schema validation for body/params
// Error responses must not leak internals
```

## Validation Pattern

```typescript
// Schemas in src/schemas/
import { z } from 'zod'
export const mySchema = z.object({ ... })

// In route: parse input with schema
const result = mySchema.safeParse(await req.json())
if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
```

## Environment Variables

```typescript
// Always use src/lib/env.ts — never process.env directly
import { env } from '@/lib/env'
const apiKey = env.MY_API_KEY
```

## Error Handling

- API routes: structured `{ error: string, message?: string }` responses
- Client components: use `ErrorBoundary` from `src/components/ErrorBoundary.tsx`
- Never expose stack traces or internal error details to clients

## Forbidden

- `any` TypeScript type
- `console.log` in production code (use only in dev/debug)
- Direct `process.env` access (use `src/lib/env.ts`)
- Editing `.env` files
- Manually editing `package-lock.json` or lock files
- `dangerouslySetInnerHTML` without sanitization justification
