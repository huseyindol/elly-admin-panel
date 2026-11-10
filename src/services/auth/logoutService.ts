import type { BaseResponse } from '@/types/BaseResponse'
import { fetcher } from '@/utils/services/fetcher'

/**
 * S4: Sunucu tarafı oturum iptali — POST /api/v1/auth/logout (Bearer zorunlu).
 * Backend refresh token'ı DB'den siler + tokenVersion artırır → tüm access
 * token'lar anında geçersiz; oturum cookie'leri temizlenir.
 *
 * Fire-and-forget kullanım içindir: access token zaten ölmuşse backend 401
 * döner; fetcher'ın sessiz refresh-retry'i de başarısız olursa hata fırlatır —
 * tüm hatalar burada yutulur, çağıran local temizliğe devam eder.
 *
 * keepalive: çağıran hemen window.location.replace ile login'e yönlenir;
 * keepalive olmadan istek navigasyonla iptal edilirdi ve sunucu tarafı iptal
 * (kritik) hiç ulaşmazdı.
 */
export const logoutService = async (): Promise<void> => {
  try {
    await fetcher<BaseResponse<boolean>>('/api/v1/auth/logout', {
      method: 'POST',
      keepalive: true,
    })
  } catch {
    // Swallow (S4): token zaten ölmişse 401 — local temizlik yine de yapılmalı.
  }
}
