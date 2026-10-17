'use server'

import { logger } from '@/lib/logger'
import { BaseResponse } from '@/types/BaseResponse'
import { fetcher } from '@/utils/services/fetcher'

export interface GenerateArticleInput {
  topic: string
  keywords: string
}

export interface GenerateArticleResult {
  success: boolean
  html?: string
  error?: string
}

/**
 * Main server action — delegates 3-step article generation pipeline
 * (Outline → Full Article → HTML Review/Sanitize) to elly-backend `/api/v1/ai/article`.
 */
export async function generateArticleAction(
  input: GenerateArticleInput,
): Promise<GenerateArticleResult> {
  try {
    const { topic, keywords } = input

    if (!topic || topic.trim().length < 3) {
      return {
        success: false,
        error: 'Makale konusu en az 3 karakter olmalıdır',
      }
    }

    logger.info('[generateArticleAction] Makale üretimi başlatıldı', { topic })

    const res = await fetcher<
      BaseResponse<{ html: string }> & { message?: string }
    >('/api/v1/ai/article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topic.trim(),
        keywords: keywords?.trim() ?? '',
      }),
    })

    if (!res?.result || !res.data?.html) {
      return {
        success: false,
        error: res?.message || 'Makale üretimi sırasında bir hata oluştu.',
      }
    }

    logger.info('[generateArticleAction] Tamamlandı ✓')
    return { success: true, html: res.data.html }
  } catch (err) {
    logger.error('[generateArticleAction] Hata oluştu', err)
    const message =
      err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu'
    return { success: false, error: message }
  }
}
