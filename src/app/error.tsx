'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle, Home, RefreshCcw } from 'lucide-react'
import { useEffect } from 'react'

/**
 * Error Component for App Router
 * Automatically wraps route segments and catches errors
 */
export default function ErrorPage({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>) {
  useEffect(() => {
    // Log error to console in development
    console.error('Error caught by error.tsx:', error)

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service
      // Sentry.captureException(error, {
      //   extra: {
      //     digest: error.digest
      //   }
      // })
    }
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="border-destructive/50 w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-destructive/10 rounded-full p-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Bir Hata Oluştu
            </h1>
            <p className="text-sm text-muted-foreground">
              Üzgünüz, beklenmeyen bir hata oluştu
            </p>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="rounded-md bg-muted p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Hata Detayları (Sadece Geliştirme)
            </p>
            <p className="font-mono text-sm text-destructive">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset} className="flex-1 gap-2" size="lg">
            <RefreshCcw className="h-4 w-4" />
            Tekrar Dene
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            variant="outline"
            className="flex-1 gap-2"
            size="lg"
          >
            <Home className="h-4 w-4" />
            Ana Sayfa
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Sorun devam ederse lütfen bizimle iletişime geçin
        </p>
      </div>
    </div>
  )
}
