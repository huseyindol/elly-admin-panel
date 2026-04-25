'use client'

import { useAdminTheme } from '@/app/_hooks'
import { createMailAccountService } from '@/app/_services/mail-accounts.services'
import {
  CreateMailAccountInput,
  CreateMailAccountSchema,
} from '@/schemas/mail-account'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export default function NewMailAccountPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMailAccountInput>({
    resolver: zodResolver(CreateMailAccountSchema),
    defaultValues: {
      name: '',
      fromAddress: '',
      smtpHost: '',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      isDefault: false,
      active: true,
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateMailAccountInput) =>
      createMailAccountService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-accounts'] })
      toast.success('Mail hesabı başarıyla oluşturuldu')
      router.push('/mail-accounts')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Mail hesabı oluşturulurken bir hata oluştu')
    },
  })

  const onSubmit = (data: CreateMailAccountInput) => {
    createMutation.mutate(data)
  }

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500'
  }`

  const labelClass = `block text-sm font-medium mb-2 ${
    isDarkMode ? 'text-slate-300' : 'text-gray-700'
  }`

  const errorClass = 'mt-1 text-xs text-rose-400'

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/mail-accounts"
          className={`transition-colors hover:text-violet-400 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          Mail Hesapları
        </Link>
        <span className={isDarkMode ? 'text-slate-600' : 'text-gray-400'}>
          /
        </span>
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
          Yeni Hesap
        </span>
      </div>

      {/* Page Header */}
      <div>
        <h1
          className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Yeni Mail Hesabı
        </h1>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          Yeni bir SMTP mail hesabı ekleyin
        </p>
      </div>

      {/* Error Message */}
      {createMutation.isError && (
        <div
          className={`rounded-xl p-4 ${
            isDarkMode
              ? 'bg-rose-500/20 text-rose-300'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          Hata:{' '}
          {createMutation.error?.message ||
            'Mail hesabı oluşturulurken bir hata oluştu'}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div
          className={`rounded-2xl p-6 ${
            isDarkMode
              ? 'border border-slate-800/50 bg-slate-900/60'
              : 'border border-gray-200 bg-white'
          }`}
        >
          <h2
            className={`mb-4 text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Hesap Bilgileri
          </h2>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className={labelClass}>
                Hesap Adı *
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className={inputClass}
                placeholder="Satış Hesabı"
              />
              {errors.name && (
                <p className={errorClass}>{errors.name.message}</p>
              )}
            </div>

            {/* From Address */}
            <div>
              <label htmlFor="fromAddress" className={labelClass}>
                Gönderen E-posta *
              </label>
              <input
                id="fromAddress"
                type="email"
                {...register('fromAddress')}
                className={inputClass}
                placeholder="sales@firma.com"
              />
              {errors.fromAddress && (
                <p className={errorClass}>{errors.fromAddress.message}</p>
              )}
            </div>

            {/* SMTP Host */}
            <div>
              <label htmlFor="smtpHost" className={labelClass}>
                SMTP Sunucusu *
              </label>
              <input
                id="smtpHost"
                type="text"
                {...register('smtpHost')}
                className={inputClass}
                placeholder="smtp.gmail.com"
              />
              {errors.smtpHost && (
                <p className={errorClass}>{errors.smtpHost.message}</p>
              )}
            </div>

            {/* SMTP Port */}
            <div>
              <label htmlFor="smtpPort" className={labelClass}>
                SMTP Port *
              </label>
              <input
                id="smtpPort"
                type="number"
                {...register('smtpPort', { valueAsNumber: true })}
                className={inputClass}
                placeholder="587"
              />
              {errors.smtpPort && (
                <p className={errorClass}>{errors.smtpPort.message}</p>
              )}
            </div>

            {/* SMTP Username */}
            <div>
              <label htmlFor="smtpUsername" className={labelClass}>
                SMTP Kullanıcı Adı *
              </label>
              <input
                id="smtpUsername"
                type="text"
                {...register('smtpUsername')}
                className={inputClass}
                placeholder="sales@firma.com"
              />
              {errors.smtpUsername && (
                <p className={errorClass}>{errors.smtpUsername.message}</p>
              )}
            </div>

            {/* SMTP Password */}
            <div>
              <label htmlFor="smtpPassword" className={labelClass}>
                SMTP Şifre *
              </label>
              <div className="relative">
                <input
                  id="smtpPassword"
                  type={showPassword ? 'text' : 'password'}
                  {...register('smtpPassword')}
                  className={`${inputClass} pr-12`}
                  placeholder="SMTP şifreniz"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm transition-colors ${
                    isDarkMode
                      ? 'text-slate-500 hover:text-slate-300'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {showPassword ? 'Gizle' : 'Göster'}
                </button>
              </div>
              {errors.smtpPassword && (
                <p className={errorClass}>{errors.smtpPassword.message}</p>
              )}
            </div>

            {/* Gmail Info Note */}
            <div
              className={`rounded-xl p-4 text-sm ${
                isDarkMode
                  ? 'border border-amber-500/20 bg-amber-500/10 text-amber-300'
                  : 'border border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              <p className="font-medium">Gmail kullanıcıları için:</p>
              <p className="mt-1">
                Gmail kullanıyorsanız normal şifre çalışmaz. Google Hesabı →
                Güvenlik → Uygulama Şifreleri&apos;nden 16 karakterli şifre
                oluşturun.
              </p>
            </div>

            {/* Is Default */}
            <div className="flex items-center gap-3">
              <input
                id="isDefault"
                type="checkbox"
                {...register('isDefault')}
                className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
              />
              <label
                htmlFor="isDefault"
                className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
              >
                Varsayılan hesap olarak ayarla
              </label>
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
              <input
                id="active"
                type="checkbox"
                {...register('active')}
                className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                defaultChecked
              />
              <label
                htmlFor="active"
                className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
              >
                Aktif
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/mail-accounts"
            className={`flex-1 rounded-xl px-4 py-3 text-center text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Kaydediliyor...</span>
              </span>
            ) : (
              'Hesap Oluştur'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
