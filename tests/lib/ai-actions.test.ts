import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  generateAltTextAction,
  generateBlogInfoAction,
  generateDescriptionAction,
  generateSeoFieldsAction,
  generateSlugAction,
} from '@/actions/generate-field'
import { generateArticleAction } from '@/actions/generate-article'

const mockFetcher = vi.fn()

vi.mock('@/utils/services/fetcher', () => ({
  fetcher: (...args: unknown[]) => mockFetcher(...args),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe('AI Generation Server Actions (Backend /api/v1/ai/*)', () => {
  beforeEach(() => {
    mockFetcher.mockReset()
  })

  it('generateSlugAction calls POST /api/v1/ai/slug and returns slug', async () => {
    mockFetcher.mockResolvedValueOnce({
      result: true,
      data: { slug: 'ornek-baslik' },
    })

    const res = await generateSlugAction('Örnek Başlık')
    expect(res).toEqual({ success: true, slug: 'ornek-baslik' })
    expect(mockFetcher).toHaveBeenCalledWith(
      '/api/v1/ai/slug',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Örnek Başlık' }),
      }),
    )
  })

  it('generateSeoFieldsAction calls POST /api/v1/ai/seo', async () => {
    const seo = {
      seoTitle: 'SEO Başlık',
      seoDescription: 'SEO Açıklama',
      seoKeywords: 'k1, k2',
    }
    mockFetcher.mockResolvedValueOnce({ result: true, data: seo })

    const res = await generateSeoFieldsAction('Örnek Başlık')
    expect(res).toEqual({ success: true, data: seo })
    expect(mockFetcher).toHaveBeenCalledWith(
      '/api/v1/ai/seo',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('generateDescriptionAction calls POST /api/v1/ai/description', async () => {
    mockFetcher.mockResolvedValueOnce({
      result: true,
      data: { description: 'Kısa açıklama.' },
    })

    const res = await generateDescriptionAction('Hero', 'component')
    expect(res).toEqual({ success: true, description: 'Kısa açıklama.' })
    expect(mockFetcher).toHaveBeenCalledWith(
      '/api/v1/ai/description',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Hero', context: 'component' }),
      }),
    )
  })

  it('generateAltTextAction calls POST /api/v1/ai/alt-text', async () => {
    mockFetcher.mockResolvedValueOnce({
      result: true,
      data: { altText: 'Banner görsel alt metni' },
    })

    const res = await generateAltTextAction('Kampanya')
    expect(res).toEqual({ success: true, altText: 'Banner görsel alt metni' })
  })

  it('generateBlogInfoAction validates empty content and calls POST /api/v1/ai/blog-info', async () => {
    const emptyRes = await generateBlogInfoAction('Başlık', '<p>   </p>')
    expect(emptyRes.success).toBe(false)
    expect(mockFetcher).not.toHaveBeenCalled()

    const blogInfo = {
      description: 'Özet',
      category: 'Backend',
      readingTime: '4 dk okuma',
      imagePrompt: 'cloud server',
    }
    mockFetcher.mockResolvedValueOnce({ result: true, data: blogInfo })

    const res = await generateBlogInfoAction('Başlık', '<p>İçerik metni</p>')
    expect(res).toEqual({ success: true, data: blogInfo })
  })

  it('generateArticleAction validates min topic length and calls POST /api/v1/ai/article', async () => {
    const shortRes = await generateArticleAction({ topic: 'ab', keywords: '' })
    expect(shortRes.success).toBe(false)
    expect(mockFetcher).not.toHaveBeenCalled()

    mockFetcher.mockResolvedValueOnce({
      result: true,
      data: { html: '<h1>Başlık</h1><p>İçerik</p>' },
    })

    const res = await generateArticleAction({
      topic: 'Spring Boot Mimari',
      keywords: 'java',
    })
    expect(res).toEqual({
      success: true,
      html: '<h1>Başlık</h1><p>İçerik</p>',
    })
  })
})
