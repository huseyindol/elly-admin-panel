'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getGlobalCookies,
  removeGlobalCookie,
  updateGlobalCookie,
  useCookie,
} from '@/context/CookieContext'
import { verifyLoginMfaService } from '@/app/_services/mfa.services'
import { LoginInput, LoginSchema } from '@/schemas/user'
import { usePermissionStore } from '@/stores/permission-store'
import { useUserStore } from '@/stores/user-store'
import { LoginResponse, LoginResponseType } from '@/types/AuthResponse'
import {
  CookieEnum,
  deriveMaxAgeFromExpiredDate,
} from '@/utils/constant/cookieConstant'
import { fetcher } from '@/utils/services/fetcher'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Shield,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

// Login sayfasına geldiğinde silinmesi gereken auth cookie'leri
const AUTH_COOKIES: CookieEnum[] = [
  CookieEnum.ACCESS_TOKEN,
  CookieEnum.REFRESH_TOKEN,
  CookieEnum.EXPIRED_DATE,
  CookieEnum.USER_CODE,
  CookieEnum.TENANT_ID,
]

const AdminLoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const { updateCookie } = useCookie()
  const router = useRouter()

  // 2FA challenge adımı durumu
  const [step, setStep] = useState<'login' | 'mfa'>('login')
  const [mfaToken, setMfaToken] = useState('')
  const [pendingTenantId, setPendingTenantId] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [verifyingMfa, setVerifyingMfa] = useState(false)

  // Önceki oturumdan kalan cookie / store değerlerini temizle.
  // Login ekranına ulaşan kullanıcı zaten oturum açmıyor — kalan auth
  // değerleri eski tenant veya geçersiz token olabilir, yenisini set
  // etmeden önce ortamı temizliyoruz.
  useEffect(() => {
    const cookies = getGlobalCookies()
    const stale = AUTH_COOKIES.filter(name => Boolean(cookies[name]))
    if (stale.length === 0) return

    stale.forEach(name => {
      removeGlobalCookie(name)
      updateCookie(name, '')
    })
    usePermissionStore.getState().clearPermissions()
    useUserStore.getState().clearUser()
  }, [updateCookie])
  // React Hook Form setup with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
      tenantId: '',
    },
  })

  /**
   * Login (veya 2FA verify) başarılı olduğunda cookie'leri + store'ları yazar
   * ve dashboard'a yönlendirir. Normal login ile 2FA verify birebir aynı
   * oturumu kurar.
   */
  const applyLoginSuccess = (data: LoginResponse, tenantId: string) => {
    // Cookie max-age'leri backend'in döndüğü epoch'lardan hesaplanır:
    //   accessToken / expiredDate     → data.expiredDate
    //   refreshToken / userCode       → data.refreshExpiredDate
    // (refreshExpiredDate yoksa cookieConstant default'una düşer.)
    // tenantId — kullanıcı tercihi; refresh expire olsa bile hatırlansın → default sabit.
    const accessTtl = deriveMaxAgeFromExpiredDate(data.expiredDate)
    const refreshTtl = deriveMaxAgeFromExpiredDate(data.refreshExpiredDate)

    updateGlobalCookie(CookieEnum.ACCESS_TOKEN, data.token, accessTtl)
    updateGlobalCookie(CookieEnum.REFRESH_TOKEN, data.refreshToken, refreshTtl)
    updateGlobalCookie(
      CookieEnum.EXPIRED_DATE,
      String(data.expiredDate),
      accessTtl,
    )
    updateGlobalCookie(CookieEnum.USER_CODE, data.userCode, refreshTtl)
    if (tenantId) {
      updateGlobalCookie(CookieEnum.TENANT_ID, tenantId)
    }
    updateCookie(CookieEnum.ACCESS_TOKEN, data.token, accessTtl)
    updateCookie(CookieEnum.REFRESH_TOKEN, data.refreshToken, refreshTtl)
    updateCookie(CookieEnum.EXPIRED_DATE, String(data.expiredDate), accessTtl)
    if (tenantId) {
      updateCookie(CookieEnum.TENANT_ID, tenantId)
    }

    // İzinleri ve kullanıcı kimliğini Zustand store'lara yaz (persist → localStorage)
    usePermissionStore
      .getState()
      .setPermissions(data.roles ?? [], data.permissions ?? [])
    useUserStore.getState().setUser({
      id: data.userId,
      username: data.username,
      email: data.email,
      userCode: data.userCode,
    })

    router.push('/dashboard')
  }

  const onSubmit = async (formData: LoginInput) => {
    setGeneralError('')
    clearErrors()

    try {
      const response = await fetcher<LoginResponseType>('/api/v1/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernameOrEmail: formData.usernameOrEmail,
          password: formData.password,
          ...(formData.tenantId
            ? { tenantId: formData.tenantId, loginType: 'admin' }
            : { loginType: 'admin' }),
        }),
      })
      if (response.error) {
        setGeneralError(response.error || 'Giriş yapılırken bir hata oluştu.')
        return
      }

      // 2FA açıksa token gelmez; mfaToken ile 2. adıma geç
      if (response.data?.mfaRequired && response.data?.mfaToken) {
        setMfaToken(response.data.mfaToken)
        setPendingTenantId(formData.tenantId ?? '')
        setMfaCode('')
        setGeneralError('')
        setStep('mfa')
        return
      }

      applyLoginSuccess(response.data, formData.tenantId ?? '')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setGeneralError(`Hata: ${message}`)
    }
  }

  const onVerifyMfa = async () => {
    if (!/^\d{6}$/.test(mfaCode)) {
      setGeneralError('6 haneli kod girin')
      return
    }
    setVerifyingMfa(true)
    setGeneralError('')
    try {
      const data = await verifyLoginMfaService(mfaToken, mfaCode)
      applyLoginSuccess(data, pendingTenantId)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Kod geçersiz veya süresi doldu'
      setGeneralError(message)
    } finally {
      setVerifyingMfa(false)
    }
  }

  const backToLogin = () => {
    setStep('login')
    setMfaToken('')
    setMfaCode('')
    setGeneralError('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            {step === 'mfa' ? (
              <KeyRound className="h-8 w-8 text-primary" />
            ) : (
              <Shield className="h-8 w-8 text-primary" />
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {step === 'mfa' ? 'İki Adımlı Doğrulama' : 'Admin Girişi'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {step === 'mfa'
              ? 'Authenticator uygulamanızdaki 6 haneli kodu girin'
              : 'Yönetim paneline erişmek için giriş yapınız'}
          </p>
        </div>

        {/* Login / MFA Form */}
        <Card className="border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl">
              {step === 'mfa' ? 'Doğrulama Kodu' : 'Hoş Geldiniz'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 'mfa'
                ? 'Hesabınızı korumak için ikinci adım gerekli'
                : 'Hesabınıza giriş yaparak devam edin'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'mfa' ? (
              <div className="space-y-4">
                {generalError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{generalError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="mfaCode">Doğrulama Kodu</Label>
                  <Input
                    id="mfaCode"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={mfaCode}
                    onChange={e => {
                      setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      if (generalError) setGeneralError('')
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') onVerifyMfa()
                    }}
                    disabled={verifyingMfa}
                    autoFocus
                    className="text-center font-mono text-lg tracking-[0.5em]"
                  />
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={onVerifyMfa}
                  disabled={verifyingMfa || mfaCode.length !== 6}
                >
                  {verifyingMfa ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Doğrulanıyor...
                    </>
                  ) : (
                    'Doğrula ve Giriş Yap'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={backToLogin}
                  disabled={verifyingMfa}
                >
                  Girişe geri dön
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {generalError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{generalError}</AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="usernameOrEmail">
                    E-posta Adresi veya Kullanıcı Adı
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="usernameOrEmail"
                      placeholder="admin@example.com veya admin"
                      {...register('usernameOrEmail')}
                      className="pl-10"
                      disabled={isSubmitting}
                      autoComplete="usernameOrEmail"
                    />
                  </div>
                  {errors.usernameOrEmail && (
                    <p className="text-sm text-destructive">
                      {errors.usernameOrEmail.message}
                    </p>
                  )}
                </div>

                {/* Tenant Field */}
                <div className="space-y-2">
                  <Label htmlFor="tenantId">Tenant ID (opsiyonel)</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tenantId"
                      placeholder="Tenant ID (ör. tenant1, basedb)"
                      {...register('tenantId')}
                      className="pl-10"
                      disabled={isSubmitting}
                      autoComplete="organization"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Şifrenizi giriniz"
                      {...register('password')}
                      className="pl-10 pr-10"
                      disabled={isSubmitting}
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Giriş Yapılıyor...
                    </>
                  ) : (
                    'Giriş Yap'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 Yönetim Paneli. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage
