/** 2FA / MFA tipleri — TOTP tabanlı (Google Authenticator vb.) */

/** GET /api/v1/auth/mfa/setup yanıtı */
export interface MfaSetupResponse {
  /** Base32 secret — manuel giriş için gösterilir */
  secret: string
  /** otpauth://totp/... — QR olarak render edilir */
  qrUri: string
  issuer: string
}

/** GET /api/v1/auth/mfa/status yanıtı */
export interface MfaStatus {
  mfaEnabled: boolean
}
