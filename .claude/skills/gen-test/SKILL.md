---
name: gen-test
description: Generate a Vitest + Testing Library test file for a given source file. Use when the user runs /gen-test <file-path>.
disable-model-invocation: true
allowed-tools: Read, Write, Grep, Glob
---

Generate a comprehensive Vitest test for: $ARGUMENTS

## Steps

1. Read the source file at `$ARGUMENTS`
2. Read `tests/setup.ts` for global test configuration
3. Glob `tests/**/*.test.{ts,tsx}` to find 2-3 similar existing tests as style reference
4. Determine the correct output path:
   - `src/components/Foo.tsx` → `tests/components/Foo.test.tsx`
   - `src/lib/bar.ts` → `tests/lib/bar.test.ts`
   - `src/app/api/baz/route.ts` → `tests/api/baz.test.ts`
   - `src/services/foo.ts` → `tests/services/foo.test.ts`
5. Write the test file following these conventions:

### Import Order

```typescript
import ComponentOrFunction from '@/path/to/source'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
```

### Mock Pattern (place before describe blocks)

```typescript
vi.mock('module-name', () => ({
  ExportName: () => <div>Mock</div>,
}))
```

### Test Coverage Requirements

- Render/call without crashing
- All props/arguments covered
- User interactions (if component)
- Loading / error / empty states (if applicable)
- Edge cases

Write the complete test file to the output path.
