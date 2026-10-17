'use server'

import { logger } from '@/lib/logger'
import { BaseResponse } from '@/types/BaseResponse'
import { fetcher } from '@/utils/services/fetcher'

interface BackendErrorResponse {
  result?: boolean
  message?: string
}

async function postAiEndpoint<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetcher<BaseResponse<T> & BackendErrorResponse>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res?.result || !res.data) {
      return {
        success: false,
        error: res?.message || 'AI üretimi sırasında bir hata oluştu.',
      }
    }
    return { success: true, data: res.data }
  } catch (err) {
    logger.error(`[postAiEndpoint] ${path} hatası`, err)
    const msg = err instanceof Error ? err.message : ''
    return {
      success: false,
      error: msg || 'AI servisine bağlanırken bir hata oluştu.',
    }
  }
}

// ─── Slug ────────────────────────────────────────────────────────────────────

export async function generateSlugAction(
  title: string,
): Promise<{ success: boolean; slug?: string; error?: string }> {
  const res = await postAiEndpoint<{ slug: string }>('/api/v1/ai/slug', {
    title,
  })
  if (!res.success || !res.data?.slug) {
    return { success: false, error: res.error ?? 'Slug oluşturulamadı' }
  }
  return { success: true, slug: res.data.slug }
}

// ─── SEO Fields ───────────────────────────────────────────────────────────────

export interface GeneratedSeoFields {
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

export async function generateSeoFieldsAction(title: string): Promise<{
  success: boolean
  data?: GeneratedSeoFields
  error?: string
}> {
  const res = await postAiEndpoint<GeneratedSeoFields>('/api/v1/ai/seo', {
    title,
  })
  if (!res.success || !res.data) {
    return { success: false, error: res.error ?? 'SEO alanları oluşturulamadı' }
  }
  return { success: true, data: res.data }
}

// ─── Alt Text ────────────────────────────────────────────────────────────────

export async function generateAltTextAction(
  title: string,
): Promise<{ success: boolean; altText?: string; error?: string }> {
  const res = await postAiEndpoint<{ altText: string }>('/api/v1/ai/alt-text', {
    title,
  })
  if (!res.success || !res.data?.altText) {
    return { success: false, error: res.error ?? 'Alt metin oluşturulamadı' }
  }
  return { success: true, altText: res.data.altText }
}

// ─── Blog Info (description + category + readingTime + image prompt) ────────

export interface GeneratedBlogInfo {
  description: string
  category: string
  readingTime: string
  imagePrompt: string
}

export async function generateBlogInfoAction(
  title: string,
  content: string,
): Promise<{
  success: boolean
  data?: GeneratedBlogInfo
  error?: string
}> {
  if (!title.trim() || !content.replace(/<[^>]+>/g, '').trim()) {
    return { success: false, error: 'Başlık ve içerik gerekli' }
  }
  const res = await postAiEndpoint<GeneratedBlogInfo>('/api/v1/ai/blog-info', {
    title,
    content,
  })
  if (!res.success || !res.data) {
    return {
      success: false,
      error: res.error ?? 'Blog bilgileri oluşturulamadı',
    }
  }
  return { success: true, data: res.data }
}

// ─── Description ─────────────────────────────────────────────────────────────

export async function generateDescriptionAction(
  name: string,
  context?: string,
): Promise<{ success: boolean; description?: string; error?: string }> {
  const res = await postAiEndpoint<{ description: string }>(
    '/api/v1/ai/description',
    { name, context },
  )
  if (!res.success || !res.data?.description) {
    return { success: false, error: res.error ?? 'Açıklama oluşturulamadı' }
  }
  return { success: true, description: res.data.description }
}
