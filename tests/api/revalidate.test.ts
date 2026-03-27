import { GET, POST } from '@/app/api/revalidate/route'
import { createMockRequest } from '@tests/utils/test-utils'
import { describe, expect, it, vi } from 'vitest'

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

describe('Revalidate API', () => {
  describe('POST /api/revalidate', () => {
    it('should return 400 when no tag or path provided', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/revalidate',
        body: {},
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
      expect(data.error).toContain('Provide at least one')
    })

    it('should return 401 when unauthorized', async () => {
      vi.stubEnv('NEXT_PUBLIC_REVALIDATE_SECRET', 'secret-key')

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/revalidate',
        headers: {},
        body: {
          tag: 'test-tag',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')

      vi.unstubAllEnvs()
    })

    it('should revalidate by tag', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/revalidate',
        body: {
          tag: 'test-tag',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(data.revalidated).toContain('tag:test-tag')
    })

    it('should revalidate by path', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/revalidate',
        body: {
          path: '/',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(data.revalidated).toContain('path:/')
    })

    it('should accept authorization header', async () => {
      vi.stubEnv('NEXT_PUBLIC_REVALIDATE_SECRET', 'secret-key')

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/revalidate',
        headers: {
          authorization: 'Bearer secret-key',
        },
        body: {
          tag: 'test-tag',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)

      vi.unstubAllEnvs()
    })
  })

  describe('GET /api/revalidate', () => {
    it('should revalidate using query parameters', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/revalidate?tag=test-tag',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(data.revalidated).toContain('tag:test-tag')
    })

    it('should return 400 when no parameters', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/revalidate',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.ok).toBe(false)
    })
  })
})
