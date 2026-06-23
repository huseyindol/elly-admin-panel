import { BaseResponse } from './BaseResponse'

export interface LoginResponse {
  token: string
  refreshToken: string
  type: string
  userId: number
  username: string
  email: string
  userCode: string
  expiredDate: number
  refreshExpiredDate?: number
  roles: string[]
  permissions: string[]
  /** 2FA açıksa login yanıtında true gelir; token null'dır, mfaToken doludur */
  mfaRequired?: boolean
  /** 2FA challenge token'ı (kısa ömürlü ~5dk) — sadece bellekte tut, persist etme */
  mfaToken?: string
}

export type LoginResponseType = BaseResponse<LoginResponse>

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
  type: string
  userId: number
  username: string
  email: string
  userCode: string
  expiredDate: number
  refreshExpiredDate?: number
  roles: string[]
  permissions: string[]
}

export type RefreshTokenResponseType = BaseResponse<RefreshTokenResponse>
