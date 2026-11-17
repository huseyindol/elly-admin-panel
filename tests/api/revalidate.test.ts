import { GET, POST } from '@/app/api/revalidate/route'
import { createMockRequest } from '@tests/utils/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Revalidate API', () => {
  describe('POST /api/revalidate', () => {
    it('should return 401 when REVALIDATE_SECRET is not configured (fail-closed)', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/revalidate',
        body: { tag: 'test-tag' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.ok).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 when no authorization header is provided', async () => {
      vi.stubEnv('REVALIDATE_SECRET', 'secret-key')

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/revalidate',
        headers: {},
        body: { tag: 'test-tag' },
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 401 when bearer token is wrong', async () => {
      vi.stubEnv('REVALIDATE_SECRET', 'secret-key')

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/revalidate',
        headers: { authorization: 'Bearer wrong-key' },
        body: { tag: 'test-tag' },
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 401 when secret is sent in body instead of header', async () => {
      vi.stubEnv('REVALIDATE_SECRET', 'secret-key')

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/revalidate',
        headers: {},
        body: { tag: 'test-tag', secret: 'secret-key' },
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 when authorized but no tag or path provided', async () => {
      vi.stubEnv('REVALIDATE_SECRET', 'secret-key')

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/revalidate',
        headers: { authorization: 'Bearer secret-key' },
        body: {},
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error).toContain('Provide at least one')
    })

    it('should revalidate by tag with correct bearer token', async () => {
      vi.stubEnv('REVALIDATE_SECRET', 'secret-key')

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/revalidate',
        headers: { authorization: 'Bearer secret-key' },
        body: { tag: 'test-tag' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(data.revalidated).toContain('tag:test-tag')
    })

    it('should revalidate by path with correct bearer token', async () => {
      vi.stubEnv('REVALIDATE_SECRET', 'secret-key')

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/revalidate',
        headers: { authorization: 'Bearer secret-key' },
        body: { path: '/' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(data.revalidated).toContain('path:/')
    })
  })

  describe('GET /api/revalidate', () => {
    it('should return 401 when REVALIDATE_SECRET is not configured (fail-closed)', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/revalidate?tag=test-tag',
      })

      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return 401 when secret is sent as query parameter', async () => {
      vi.stubEnv('REVALIDATE_SECRET', 'secret-key')

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/revalidate?tag=test-tag&secret=secret-key',
      })

      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should revalidate using query parameters with bearer token', async () => {
      vi.stubEnv('REVALIDATE_SECRET', 'secret-key')

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/revalidate?tag=test-tag',
        headers: { authorization: 'Bearer secret-key' },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(data.revalidated).toContain('tag:test-tag')
    })

    it('should return 400 when authorized but no parameters', async () => {
      vi.stubEnv('REVALIDATE_SECRET', 'secret-key')

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/revalidate',
        headers: { authorization: 'Bearer secret-key' },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
    })
  })
})
