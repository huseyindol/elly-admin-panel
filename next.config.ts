import bundleAnalyzer from '@next/bundle-analyzer'

// Validate environment variables at build time
import './src/lib/env'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
})

const nextConfig = {
  output: 'standalone' as const,

  // Server-side terminal logging
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
    incomingRequests: {
      ignore: [/^\/_next\//, /favicon\.ico$/],
    },
  },

  experimental: {
    optimizeCss: true,
    ppr: false,
    // Router Cache: dynamic sayfaların RSC payload'ı client'ta cache'lenir —
    // ziyaret edilen sayfalar arası geçiş sunucuya gitmeden ANINDA olur.
    // Sayfalar root layout'un cookies() okuması (auth/WS hydration) nedeniyle
    // bilinçli olarak dynamic'tir; VERİ tazeliği zaten TanStack Query (staleTime)
    // + WS'te olduğundan shell cache'i güvenlidir. Login/logout router.refresh /
    // tam yönlendirme yaptığı için auth geçişleri cache'e takılmaz.
    staleTimes: {
      dynamic: 60, // saniye — dynamic sayfa payload'ı yeniden kullanım süresi
      static: 300,
    },
  },

  // Force metadata to be in head for all bots
  // Empty regex = matches nothing = no bots are HTML-limited
  htmlLimitedBots: /.*/,

  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'cdn.dummyjson.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'api.huseyindol.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http' as const,
        hostname: 'localhost',
        port: '8080',
        pathname: '/**',
      },
    ],
  },

  // Performance: Headers for caching
  async headers() {
    return [
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
