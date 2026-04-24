import { BaseErrorCode } from '@/types/BaseResponse'

/**
 * CMS API'den dönen `{ result: false, ... }` yanıtlarını tek sınıfta tipleyen
 * özel hata tipi. Servis katmanı bu sınıfı fırlatır, TanStack Query
 * `onError`'da `instanceof ApiError` ile errorCode/status'a göre mesaj
 * özelleştirilebilir.
 */
export class ApiError extends Error {
  readonly status: number
  readonly errorCode: BaseErrorCode | string | null
  readonly rawMessage: string | null

  constructor(
    message: string,
    options: {
      status?: number
      errorCode?: BaseErrorCode | string | null
      rawMessage?: string | null
    } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status ?? 0
    this.errorCode = options.errorCode ?? null
    this.rawMessage = options.rawMessage ?? message
  }

  get isConflict(): boolean {
    return this.status === 409
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  get isValidation(): boolean {
    return this.status === 400 || this.errorCode === 'VALIDATION_ERROR'
  }

  get isUnavailable(): boolean {
    return this.status === 503
  }
}

/**
 * CMS'ten gelen BaseResponse wrapper'ını açar. `result=false` ise ApiError
 * fırlatır, aksi halde `data` döner. Mevcut servislerdeki tekrarlanan
 * kontrolleri tek helper'a indirger.
 */
export function unwrapOrThrow<T>(
  response: {
    result: boolean
    data: T
    message?: string | null
    errorCode?: BaseErrorCode | string | null
    status?: number
    error?: string
  },
  fallbackMessage: string,
): T {
  if (!response.result) {
    throw new ApiError(response.message ?? response.error ?? fallbackMessage, {
      status: response.status,
      errorCode: response.errorCode ?? null,
      rawMessage: response.message ?? null,
    })
  }
  return response.data
}
