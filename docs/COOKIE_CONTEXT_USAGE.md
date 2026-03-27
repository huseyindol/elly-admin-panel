# Cookie Context Kullanım Kılavuzu

## Genel Bakış

Bu proje, Next.js App Router ile server-side cookie'leri client component'lerde kullanabilmek için bir Cookie Context yapısı kullanır.

## Nasıl Çalışır?

### 1. Server-Side (layout.tsx)

`layout.tsx` dosyası bir server component'tir ve `next/headers` paketinden `cookies()` fonksiyonunu kullanarak cookie'lere erişir:

```tsx
import { cookies } from 'next/headers'

export default async function RootLayout({ children }) {
  const cookiesStore = await cookies()

  return <Providers cookiesStore={cookiesStore}>{children}</Providers>
}
```

### 2. Provider (Providers.tsx)

`Providers.tsx` bir client component'tir ve cookie'leri Context'e aktarır:

```tsx
'use client'

import CookieContext from '../context/CookieContext'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

export default function Providers({
  children,
  cookiesStore,
}: {
  children: React.ReactNode
  cookiesStore: ReadonlyRequestCookies
}) {
  return (
    <CookieContext.Provider value={{ cookiesStore }}>
      {children}
    </CookieContext.Provider>
  )
}
```

### 3. Context (CookieContext.tsx)

Context tanımı ve custom hook:

```tsx
'use client'

import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { createContext, useContext } from 'react'

interface CookieContextType {
  cookiesStore: ReadonlyRequestCookies
}

const CookieContext = createContext<CookieContextType | undefined>(undefined)

export const useCookie = () => {
  const context = useContext(CookieContext)
  if (context === undefined) {
    throw new Error('useCookie must be used within a CookieProvider')
  }
  return context
}

export default CookieContext
```

## Kullanım Örnekleri

### Client Component'te Cookie Okuma

```tsx
'use client'

import { useCookie } from '@/context/CookieContext'

export default function MyComponent() {
  const { cookiesStore } = useCookie()

  // Cookie değerini oku
  const userToken = cookiesStore.get('userToken')?.value
  const userId = cookiesStore.get('userId')?.value

  // Tüm cookie'leri listele
  const allCookies = cookiesStore.getAll()

  console.log('User Token:', userToken)
  console.log('User ID:', userId)
  console.log('All Cookies:', allCookies)

  return (
    <div>
      <h1>Cookie Bilgileri</h1>
      <p>Token: {userToken}</p>
      <p>User ID: {userId}</p>
    </div>
  )
}
```

### API İsteğinde Cookie Kullanma

```tsx
'use client'

import { useCookie } from '@/context/CookieContext'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { cookiesStore } = useCookie()

  const fetchUserData = async () => {
    // Cookie'den token al
    const accessToken = cookiesStore.get('accessToken')?.value

    // API isteğinde kullan
    const response = await fetch('/api/user/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    console.log(data)
  }

  return (
    <div>
      <Button onClick={fetchUserData}>Kullanıcı Bilgilerini Getir</Button>
    </div>
  )
}
```

### Refresh Token Örneği

```tsx
'use client'

import { useCookie } from '@/context/CookieContext'

export default function AuthComponent() {
  const { cookiesStore } = useCookie()

  const refreshAccessToken = async () => {
    const refreshToken = cookiesStore.get('refreshToken')?.value

    if (!refreshToken) {
      console.error('Refresh token bulunamadı')
      return
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      const data = await response.json()
      console.log('Yeni access token:', data.accessToken)

      // Yeni token'ı kullan
      // Not: Cookie'yi güncellemek için server-side action kullanmalısınız
    } catch (error) {
      console.error('Token yenileme hatası:', error)
    }
  }

  return <button onClick={refreshAccessToken}>Token'ı Yenile</button>
}
```

## Önemli Notlar

### ⚠️ Read-Only

`ReadonlyRequestCookies` sadece **okuma** için kullanılabilir. Cookie değerlerini değiştirmek için Server Actions kullanmalısınız:

```tsx
// app/actions/cookies.ts
'use server'

import { cookies } from 'next/headers'

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 gün
  })
}

export async function deleteAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('authToken')
}
```

Client component'ten kullanım:

```tsx
'use client'

import { setAuthCookie, deleteAuthCookie } from '@/app/actions/cookies'

export default function LoginButton() {
  const handleLogin = async () => {
    // Login işlemi
    const token = 'your-auth-token'

    // Server action ile cookie'yi set et
    await setAuthCookie(token)
  }

  const handleLogout = async () => {
    // Server action ile cookie'yi sil
    await deleteAuthCookie()
  }

  return (
    <>
      <button onClick={handleLogin}>Giriş Yap</button>
      <button onClick={handleLogout}>Çıkış Yap</button>
    </>
  )
}
```

### ✅ Type Safety

`useCookie()` hook'u TypeScript tip güvenliği sağlar:

```tsx
const { cookiesStore } = useCookie() // cookiesStore otomatik olarak ReadonlyRequestCookies tipindedir
```

### ✅ Error Handling

Hook, Context dışında kullanılırsa hata fırlatır:

```tsx
export const useCookie = () => {
  const context = useContext(CookieContext)
  if (context === undefined) {
    throw new Error('useCookie must be used within a CookieProvider')
  }
  return context
}
```

## Mevcut Kullanım

Şu anda `src/app/(admin)/admin/dashboard/page.client.tsx` dosyasında cookie context kullanılmaktadır:

```tsx
const { cookiesStore } = useCookie()
const refreshToken = cookiesStore.get('userCode')?.value
```

## Faydalı Cookie Metodları

```tsx
const { cookiesStore } = useCookie()

// Tek bir cookie al
const value = cookiesStore.get('cookieName')?.value

// Tüm cookie'leri al
const allCookies = cookiesStore.getAll()

// Cookie var mı kontrol et
const hasCookie = cookiesStore.has('cookieName')

// Cookie size
const size = cookiesStore.size
```
