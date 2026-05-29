import { fetcher } from '@/utils/services/fetcher'
import type { BaseResponse } from '@/types/BaseResponse'
import type { LoginResponse } from '@/types/AuthResponse'
import type { MfaSetupResponse, MfaStatus } from '@/types/mfa'

/**
 * 2FA / MFA servisleri.
 *
 * status / setup / setupVerify / disable → JWT gerekir (fetcher otomatik ekler).
 * verifyLogin → JWT YOK; sadece mfaToken yeterli (fetcher /auth/mfa/verify için
 * Authorization header'ını strip eder).
 */

/** Mevcut 2FA durumu — açık mı? */
export const getMfaStatusService = async (): Promise<MfaStatus> => {
  const res: BaseResponse<MfaStatus> = await fetcher(
    '/api/v1/auth/mfa/status',
    {
      method: 'GET',
    },
  )
  if (!res.result) throw new Error(res.message ?? '2FA durumu alınamadı')
  return res.data
}

/** QR + secret üretir (henüz etkinleştirmez) */
export const getMfaSetupService = async (): Promise<MfaSetupResponse> => {
  const res: BaseResponse<MfaSetupResponse> = await fetcher(
    '/api/v1/auth/mfa/setup',
    { method: 'GET' },
  )
  if (!res.result) throw new Error(res.message ?? '2FA kurulumu başlatılamadı')
  return res.data
}

/** 6 haneli kodu doğrulayıp 2FA'yı etkinleştirir */
export const verifyMfaSetupService = async (code: string): Promise<string> => {
  const res: BaseResponse<string> = await fetcher(
    '/api/v1/auth/mfa/setup/verify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    },
  )
  if (!res.result) throw new Error(res.message ?? 'Kod doğrulanamadı')
  return res.data
}

/** Şifre doğrulamasıyla 2FA'yı devre dışı bırakır */
export const disableMfaService = async (password: string): Promise<string> => {
  const res: BaseResponse<string> = await fetcher('/api/v1/auth/mfa/disable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.result) throw new Error(res.message ?? '2FA devre dışı bırakılamadı')
  return res.data
}

/**
 * Login 2. adımı — mfaToken + 6 haneli kod ile oturum açar.
 * JWT gerektirmez; backend başarılı doğrulamada login ile aynı HttpOnly
 * cookie'leri set eder ve tam LoginResponse döner.
 */
export const verifyLoginMfaService = async (
  mfaToken: string,
  code: string,
): Promise<LoginResponse> => {
  const res: BaseResponse<LoginResponse> = await fetcher(
    '/api/v1/auth/mfa/verify',
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mfaToken, code }),
    },
  )
  if (!res.result)
    throw new Error(res.message ?? 'Kod geçersiz veya süresi doldu')
  return res.data
}
