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
import { saveTokens } from '@/actions/auth/saveTokens'
import { updateGlobalCookie, useCookie } from '@/context/CookieContext'
import { LoginInput, LoginSchema } from '@/schemas/user'
import { LoginResponseType } from '@/types/AuthResponse'
import { CookieEnum } from '@/utils/constant/cookieConstant'
import { fetcher } from '@/utils/services/fetcher'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

const AdminLoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const router = useRouter()
  const { updateCookie } = useCookie()

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
            ? { tenantId: formData.tenantId, loginType: 'tenant' }
            : { loginType: 'admin' }),
        }),
      })
      if (response.error) {
        setGeneralError(response.error || 'Giriş yapılırken bir hata oluştu.')
        return
      }
      await saveTokens({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        expiredDate: response.data.expiredDate,
        userCode: response.data.userCode,
      })
      updateGlobalCookie(CookieEnum.ACCESS_TOKEN, response.data.token)
      updateGlobalCookie(CookieEnum.REFRESH_TOKEN, response.data.refreshToken)
      updateGlobalCookie(
        CookieEnum.EXPIRED_DATE,
        String(response.data.expiredDate),
      )
      updateGlobalCookie(CookieEnum.USER_CODE, response.data.userCode)
      updateCookie(CookieEnum.ACCESS_TOKEN, response.data.token)
      updateCookie(CookieEnum.REFRESH_TOKEN, response.data.refreshToken)
      updateCookie(CookieEnum.EXPIRED_DATE, String(response.data.expiredDate))

      // Redirect to admin dashboard
      router.push('/admin/dashboard')
    } catch {
      setGeneralError(
        'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyiniz.',
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Girişi</h1>
          <p className="mt-2 text-muted-foreground">
            Yönetim paneline erişmek için giriş yapınız
          </p>
        </div>

        {/* Login Form */}
        <Card className="border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl">Hoş Geldiniz</CardTitle>
            <CardDescription className="text-center">
              Hesabınıza giriş yaparak devam edin
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
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
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 Yönetim Paneli. Tüm hakları saklıdır.</p>
        </div>

        {/* Demo Credentials */}
        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <p className="mb-2 text-center font-medium">Demo Bilgileri</p>
          <div className="space-y-1 text-muted-foreground">
            <p>
              <strong>Zod Validasyonu:</strong> Form otomatik olarak e-posta
              formatını ve şifre uzunluğunu kontrol eder.
            </p>
            <p>
              Kullanıcı oluşturmak için{' '}
              <code className="rounded bg-muted px-1">POST /api/users</code>{' '}
              endpoint'ini kullanın.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage
