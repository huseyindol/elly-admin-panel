import { RefreshTokenResponseType } from '../../types/AuthResponse'

// refresh Service
// NOTE: proxy.ts ve CSR'da refresh token kullanılıyor
export const refreshService = async (refreshToken: string) => {
  const response: Response = await fetch(
    `${process.env.NEXT_PUBLIC_API}/api/v1/auth/refresh`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
      }),
    },
  )
  const data: RefreshTokenResponseType = await response.json()
  return data
}
