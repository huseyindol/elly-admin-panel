# Error Handling Guide

Bu projede kullanılan error handling stratejileri ve best practices.

## 📋 İçindekiler

1. [Error Boundaries](#error-boundaries)
2. [Next.js Error Pages](#nextjs-error-pages)
3. [API Error Handling](#api-error-handling)
4. [Client-Side Error Handling](#client-side-error-handling)
5. [Server Actions Error Handling](#server-actions-error-handling)

---

## Error Boundaries

### ErrorBoundary Component

**Dosya:** `src/components/ErrorBoundary.tsx`

React component hatalarını yakalayan ve kullanıcı dostu UI gösteren boundary.

**Kullanım:**

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function Page() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  )
}
```

**Custom Fallback:**

```tsx
<ErrorBoundary
  fallback={<div>Özel hata mesajı</div>}
  onError={(error, errorInfo) => {
    // Custom error handling
    console.error('Caught error:', error)
  }}
>
  <YourComponent />
</ErrorBoundary>
```

**Özellikler:**

- ✅ Automatic error catching
- ✅ Custom fallback UI
- ✅ Error callback for logging
- ✅ Reset functionality
- ✅ Development vs Production mode

---

## Next.js Error Pages

### 1. Route-Level Error (error.tsx)

**Dosya:** `src/app/error.tsx`

Route segment'lerde oluşan hataları yakalar.

```tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

**Ne zaman çalışır:**

- ✅ Component render hataları
- ✅ Data fetching hataları
- ✅ Server Component hataları
- ❌ Root layout hataları (global-error.tsx kullan)

### 2. Global Error (global-error.tsx)

**Dosya:** `src/app/global-error.tsx`

Root layout dahil tüm hataları yakalar.

```tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Critical Error!</h2>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  )
}
```

**Özellikler:**

- ✅ En üst seviye error handler
- ✅ Kendi `<html>` ve `<body>` tag'lerini içermeli
- ✅ Root layout hatalarını yakalar

### 3. Not Found (not-found.tsx)

**Dosya:** `src/app/not-found.tsx`

404 sayfası için custom UI.

```tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <Link href="/">Return Home</Link>
    </div>
  )
}
```

**Kullanım:**

```tsx
import { notFound } from 'next/navigation'

export default async function Page({ params }: { params: { id: string } }) {
  const data = await fetchData(params.id)

  if (!data) {
    notFound()
  }

  return <div>{data.title}</div>
}
```

---

## API Error Handling

### Standard Error Response

```typescript
// src/types/APITypes.ts
export type APIResponseErrorType = {
  success: false
  error: string
  message: unknown
  status: number
}
```

### API Route Error Handling

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation
    if (!body.email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 },
      )
    }

    // Business logic
    const result = await doSomething(body)

    return NextResponse.json({ success: true, data: result }, { status: 200 })
  } catch (error) {
    console.error('API Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
```

### Error Status Codes

```typescript
// 4xx Client Errors
400 // Bad Request - Invalid input
401 // Unauthorized - Authentication required
403 // Forbidden - Permission denied
404 // Not Found - Resource not found
429 // Too Many Requests - Rate limit exceeded

// 5xx Server Errors
500 // Internal Server Error - Generic server error
503 // Service Unavailable - Service down/maintenance
```

---

## Client-Side Error Handling

### Fetch with Error Handling

```typescript
// src/utils/services/fetcher.ts
export const fetcher = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (response.status === 204) {
      return null as T
    }

    return response.json() as Promise<T>
  } catch (error) {
    console.error('Fetch error:', error)
    throw error
  }
}
```

### React Query Error Handling

```typescript
import { useQuery } from '@tanstack/react-query'

function Component() {
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetcher('/api/posts'),
    retry: 3,
    onError: (error) => {
      console.error('Query failed:', error)
      // Show toast notification
    }
  })

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error: {error.message}</div>

  return <div>{/* Render data */}</div>
}
```

### Form Error Handling

```typescript
import { useState } from 'react'

function ContactForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      // Success

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* Form fields */}
    </form>
  )
}
```

---

## Server Actions Error Handling

### Basic Server Action Error

```typescript
// src/actions/posts.ts
'use server'

export async function createPost(title: string, body: string) {
  try {
    const response = await fetch('https://api.example.com/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('Server Action Error:', error)
    throw new Error('Failed to create post')
  }
}
```

### Using useTransition for Error Handling

```typescript
'use client'

import { useTransition } from 'react'
import { createPost } from '@/actions/posts'

function PostForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        await createPost(title, body)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <button disabled={isPending}>
        {isPending ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
```

---

## Best Practices

### 1. ✅ Always Handle Errors

```typescript
// ❌ Bad
async function fetchData() {
  const response = await fetch('/api/data')
  return response.json()
}

// ✅ Good
async function fetchData() {
  try {
    const response = await fetch('/api/data')

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('Fetch failed:', error)
    throw error
  }
}
```

### 2. ✅ Provide User-Friendly Messages

```typescript
// ❌ Bad
throw new Error('ERR_NETWORK_FAILED_500')

// ✅ Good
throw new Error('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.')
```

### 3. ✅ Log Errors in Production

```typescript
if (process.env.NODE_ENV === 'production') {
  // Send to Sentry, DataDog, etc.
  Sentry.captureException(error)
}
```

### 4. ✅ Clean Up on Error

```typescript
try {
  const handle = await openResource()
  await doSomething(handle)
} catch (error) {
  console.error(error)
  throw error
} finally {
  // Always clean up
  await closeResource()
}
```

### 5. ✅ Specific Error Types

```typescript
class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

// Usage
try {
  // ...
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
  } else if (error instanceof NetworkError) {
    // Handle network error
  } else {
    // Handle unknown error
  }
}
```

---

## Testing Error Handling

### Component Error Test

```typescript
// Throw error in component
function BuggyComponent() {
  throw new Error('Test error')
}

// Should be caught by ErrorBoundary
```

### API Error Test

```bash
# Test 400 error
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{}'

# Test rate limit (429)
for i in {1..65}; do
  curl http://localhost:3000/api/contact
done
```

### Server Action Error Test

```typescript
// In your test file
import { createPost } from '@/actions/posts'

test('handles server action error', async () => {
  await expect(createPost('', '')).rejects.toThrow('Failed to create post')
})
```

---

## Monitoring & Alerts

### Sentry Integration (Recommended)

```bash
bun add @sentry/nextjs
```

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
```

---

## Özet

| Error Type       | Handler                  | Dosya                              |
| ---------------- | ------------------------ | ---------------------------------- |
| Component Errors | ErrorBoundary            | `src/components/ErrorBoundary.tsx` |
| Route Errors     | error.tsx                | `src/app/error.tsx`                |
| Global Errors    | global-error.tsx         | `src/app/global-error.tsx`         |
| 404 Errors       | not-found.tsx            | `src/app/not-found.tsx`            |
| API Errors       | try/catch + NextResponse | `src/app/api/*/route.ts`           |
| Server Actions   | try/catch + throw        | `src/actions/*.ts`                 |
| Client Fetch     | try/catch + state        | Components                         |

---

## Kaynaklar

- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [MDN Error Handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
