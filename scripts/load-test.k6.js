/**
 * k6 Load Testing Script
 * https://k6.io/
 *
 * Installation:
 *   brew install k6  (macOS)
 *   choco install k6 (Windows)
 *
 * Usage:
 *   k6 run scripts/load-test.k6.js
 *   k6 run --vus 50 --duration 30s scripts/load-test.k6.js
 *   k6 run --out json=results.json scripts/load-test.k6.js
 */

import { check, group, sleep } from 'k6'
import http from 'k6/http'
import { Counter, Rate, Trend } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const successRate = new Rate('success')
const pageLoadTime = new Trend('page_load_time')
const apiResponseTime = new Trend('api_response_time')
const requestCounter = new Counter('requests')

// Test configuration
export const options = {
  // Stages for ramping up/down virtual users
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 }, // Stay at 10 users
    { duration: '30s', target: 50 }, // Ramp up to 50 users
    { duration: '1m', target: 50 }, // Stay at 50 users
    { duration: '30s', target: 50 }, // Spike to 50 users
    { duration: '1m', target: 50 }, // Stay at 50 users
    { duration: '30s', target: 0 }, // Ramp down to 0
  ],

  // Thresholds for pass/fail criteria
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be under 1000ms
    http_req_failed: ['rate<0.05'], // Error rate should be under 5%
    errors: ['rate<0.05'],
    success: ['rate>0.95'],
    page_load_time: ['p(95)<4000'], // 95% of page loads under 4s
    api_response_time: ['p(95)<1000'], // 95% of API calls under 1000ms
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

/**
 * Main test scenario
 */
export default function () {
  group('Homepage Load', () => {
    const startTime = Date.now()
    const res = http.get(`${BASE_URL}/`)

    const loadTime = Date.now() - startTime
    pageLoadTime.add(loadTime)
    requestCounter.add(1)

    const success = check(res, {
      'homepage status is 200': r => r.status === 200,
      'homepage has content': r => r.body.length > 0,
      'homepage loads under 2s': () => loadTime < 2000,
      'homepage has correct content-type': r =>
        r.headers['Content-Type']?.includes('text/html'),
    })

    errorRate.add(!success)
    successRate.add(success)
  })

  sleep(1)

  group('Static Assets', () => {
    const assets = ['/assets/img/favicon.ico']

    assets.forEach(asset => {
      const res = http.get(`${BASE_URL}${asset}`)
      requestCounter.add(1)

      check(res, {
        [`${asset} loads successfully`]: r =>
          r.status === 200 || r.status === 304,
        [`${asset} has cache headers`]: r =>
          r.headers['Cache-Control'] !== undefined,
      })
    })
  })

  sleep(0.5)

  group('API Endpoints', () => {
    // Test contact API (rate limited)
    const startTime = Date.now()
    const contactRes = http.post(
      `${BASE_URL}/api/contact`,
      JSON.stringify({
        name: 'Load Test',
        email: 'test@example.com',
        message: 'Load testing message',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )

    apiResponseTime.add(Date.now() - startTime)
    requestCounter.add(1)

    check(contactRes, {
      'contact API responds': r => r.status !== 0,
      'contact API not rate limited': r => r.status !== 429,
    })
  })

  sleep(1)

  group('Example Pages', () => {
    const pages = ['/example', '/example/isr']

    pages.forEach(page => {
      const startTime = Date.now()
      const res = http.get(`${BASE_URL}${page}`)

      pageLoadTime.add(Date.now() - startTime)
      requestCounter.add(1)

      const success = check(res, {
        [`${page} status is 200`]: r => r.status === 200,
        [`${page} has content`]: r => r.body.length > 0,
      })

      errorRate.add(!success)
      successRate.add(success)
    })
  })

  sleep(Math.random() * 2 + 1) // Random sleep 1-3 seconds
}

/**
 * Setup function - runs once at the start
 */
export function setup() {
  console.log(`🚀 Starting load test against ${BASE_URL}`)
  console.log('='.repeat(50))

  // Verify server is running
  const res = http.get(`${BASE_URL}/`)
  if (res.status !== 200) {
    throw new Error(`Server not responding at ${BASE_URL}`)
  }

  return { startTime: Date.now() }
}

/**
 * Teardown function - runs once at the end
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000
  console.log('='.repeat(50))
  console.log(`✅ Load test completed in ${duration.toFixed(2)}s`)
}

/**
 * Custom summary for results
 */
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    duration: data.state.testRunDurationMs,
    vus: data.metrics.vus?.values?.value || 0,
    requests: data.metrics.http_reqs?.values?.count || 0,
    failedRequests: data.metrics.http_req_failed?.values?.passes || 0,
    avgResponseTime: data.metrics.http_req_duration?.values?.avg || 0,
    p95ResponseTime: data.metrics.http_req_duration?.values['p(95)'] || 0,
    errorRate: data.metrics.errors?.values?.rate || 0,
  }

  return {
    'reports/load-test-summary.json': JSON.stringify(summary, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}

function textSummary(data, options) {
  return `
╔════════════════════════════════════════════════════════╗
║                  LOAD TEST RESULTS                     ║
╠════════════════════════════════════════════════════════╣
║ Total Requests: ${(data.metrics.http_reqs?.values?.count || 0).toString().padStart(10)}                         ║
║ Success Rate:   ${((1 - (data.metrics.http_req_failed?.values?.rate || 0)) * 100).toFixed(2).padStart(10)}%                        ║
║ Avg Response:   ${(data.metrics.http_req_duration?.values?.avg || 0).toFixed(2).padStart(10)}ms                       ║
║ P95 Response:   ${(data.metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2).padStart(10)}ms                       ║
╚════════════════════════════════════════════════════════╝
`
}
