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
}

export type RefreshTokenResponseType = BaseResponse<RefreshTokenResponse>
