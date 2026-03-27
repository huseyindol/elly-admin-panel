/**
 * Lighthouse CI Configuration
 * Run with: bun run lighthouse
 */
module.exports = {
  ci: {
    collect: {
      // Use static server for built app
      staticDistDir: '.next',
      // Or use running server
      // url: ['http://localhost:3000'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        // Throttling settings
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        // Performance
        'categories:performance': ['warn', { minScore: 0.9 }],

        // Accessibility
        'categories:accessibility': ['error', { minScore: 0.9 }],

        // Best Practices
        'categories:best-practices': ['warn', { minScore: 0.9 }],

        // SEO
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        interactive: ['warn', { maxNumericValue: 3800 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
      },
    },
    upload: {
      // Upload to temporary public storage (free)
      target: 'temporary-public-storage',
      // Or upload to your own server
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.example.com',
    },
  },
}
