import bundleAnalyzer from '@next/bundle-analyzer'

// Validate environment variables at build time
import './src/lib/env'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
})

const nextConfig = {
  output: 'standalone' as const,

  experimental: {
    optimizeCss: true,
    ppr: false,
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
