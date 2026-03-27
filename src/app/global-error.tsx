'use client'

import { useEffect } from 'react'

/**
 * Global Error Component
 * Catches errors in root layout
 * Must include <html> and <body> tags
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error caught:', error)

    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service
      // Sentry.captureException(error, {
      //   level: 'fatal',
      //   extra: {
      //     digest: error.digest
      //   }
      // })
    }
  }, [error])

  return (
    <html lang="tr">
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#0f172a',
            color: '#f1f5f9',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#ef4444',
              }}
            >
              ⚠️
            </h1>
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
              }}
            >
              Kritik Bir Hata Oluştu
            </h2>
            <p
              style={{
                fontSize: '1rem',
                marginBottom: '2rem',
                color: '#94a3b8',
              }}
            >
              Üzgünüz, uygulama beklenmeyen bir hatayla karşılaştı. Lütfen
              sayfayı yenileyin.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div
                style={{
                  backgroundColor: '#1e293b',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '2rem',
                  textAlign: 'left',
                }}
              >
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    color: '#ef4444',
                  }}
                >
                  Hata Detayları (Geliştirme):
                </p>
                <pre
                  style={{
                    fontSize: '0.75rem',
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    color: '#f87171',
                  }}
                >
                  {error.message}
                </pre>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                Tekrar Dene
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  backgroundColor: '#1e293b',
                  color: 'white',
                  border: '1px solid #334155',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                Ana Sayfa
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
