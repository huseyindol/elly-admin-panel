#!/usr/bin/env node

/**
 * Performance Audit Script
 * Run comprehensive performance analysis on the Next.js application
 *
 * Usage: node scripts/performance-audit.mjs [--url=http://localhost:3000]
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const DEFAULT_URL = 'http://localhost:3000'
const REPORTS_DIR = './reports/performance'

// Parse command line arguments
const args = process.argv.slice(2)
const urlArg = args.find(arg => arg.startsWith('--url='))
const targetUrl = urlArg ? urlArg.split('=')[1] : DEFAULT_URL

console.log('\n🚀 Next.js Performance Audit')
console.log('='.repeat(50))
console.log(`Target URL: ${targetUrl}`)
console.log(`Reports Directory: ${REPORTS_DIR}`)
console.log('='.repeat(50))

// Create reports directory
if (!existsSync(REPORTS_DIR)) {
  mkdirSync(REPORTS_DIR, { recursive: true })
  console.log(`📁 Created reports directory: ${REPORTS_DIR}`)
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

/**
 * Run Lighthouse audit
 */
async function runLighthouse() {
  console.log('\n📊 Running Lighthouse Audit...')

  const outputPath = join(REPORTS_DIR, `lighthouse-${timestamp}`)

  try {
    execSync(
      `npx lighthouse ${targetUrl} --output=html,json --output-path=${outputPath} --chrome-flags="--headless --no-sandbox"`,
      { stdio: 'inherit' },
    )
    console.log(`✅ Lighthouse report saved to: ${outputPath}.html`)
  } catch (error) {
    console.error('❌ Lighthouse audit failed:', error.message)
  }
}

/**
 * Analyze bundle size
 */
async function analyzeBundles() {
  console.log('\n📦 Analyzing Bundle Sizes...')

  try {
    // Build with bundle analyzer
    execSync('ANALYZE=true bun run build', {
      stdio: 'inherit',
      env: { ...process.env, ANALYZE: 'true' },
    })
    console.log('✅ Bundle analysis complete - check browser for visualization')
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message)
  }
}

/**
 * Check build output sizes
 */
function checkBuildSizes() {
  console.log('\n📏 Checking Build Output Sizes...')

  const buildDir = '.next'
  if (!existsSync(buildDir)) {
    console.log('⚠️ Build directory not found. Run "bun run build" first.')
    return
  }

  try {
    const result = execSync(
      `du -sh ${buildDir} ${buildDir}/static ${buildDir}/server 2>/dev/null || true`,
      { encoding: 'utf-8' },
    )
    console.log('\nBuild Directory Sizes:')
    console.log(result)
  } catch (error) {
    console.error('❌ Size check failed:', error.message)
  }
}

/**
 * Generate performance report
 */
function generateReport() {
  console.log('\n📝 Generating Performance Report...')

  const report = {
    timestamp: new Date().toISOString(),
    targetUrl,
    recommendations: [
      {
        category: 'Images',
        items: [
          'Use next/image for automatic optimization',
          'Implement lazy loading for below-fold images',
          'Use WebP/AVIF formats',
          'Add width and height attributes',
        ],
      },
      {
        category: 'JavaScript',
        items: [
          'Use dynamic imports for large components',
          'Implement code splitting',
          'Remove unused dependencies',
          'Tree-shake imports',
        ],
      },
      {
        category: 'CSS',
        items: [
          'Purge unused CSS with Tailwind',
          'Critical CSS extraction',
          'Avoid large CSS files',
        ],
      },
      {
        category: 'Caching',
        items: [
          'Implement ISR for semi-static pages',
          'Use stale-while-revalidate',
          'Configure CDN caching headers',
        ],
      },
      {
        category: 'Core Web Vitals',
        items: [
          'LCP < 2.5s: Optimize largest image/text block',
          'FID < 100ms: Minimize JavaScript execution',
          'CLS < 0.1: Reserve space for dynamic content',
          'INP < 200ms: Optimize event handlers',
        ],
      },
    ],
  }

  const reportPath = join(REPORTS_DIR, `performance-report-${timestamp}.json`)
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`✅ Report saved to: ${reportPath}`)
}

/**
 * Display helpful commands
 */
function showCommands() {
  console.log('\n📋 Useful Performance Commands:')
  console.log('='.repeat(50))
  console.log(`
  # Bundle Analysis
  ANALYZE=true bun run build

  # Lighthouse Audit
  bun run lighthouse

  # Lighthouse CI
  bun run lhci

  # Build Size Check
  du -sh .next .next/static .next/server

  # Find large files in build
  find .next -type f -size +100k -exec ls -lh {} \\;

  # Check unused dependencies
  npx depcheck

  # Analyze imports
  npx source-map-explorer .next/static/chunks/*.js
  `)
}

// Run all checks
async function main() {
  try {
    checkBuildSizes()
    generateReport()
    showCommands()

    console.log('\n✨ Performance audit complete!')
    console.log(`📁 Reports saved to: ${REPORTS_DIR}`)
  } catch (error) {
    console.error('\n❌ Audit failed:', error.message)
    process.exit(1)
  }
}

main()
