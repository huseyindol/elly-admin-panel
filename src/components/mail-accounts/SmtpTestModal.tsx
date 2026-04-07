'use client'

import { useAdminTheme } from '@/app/_hooks'
import { testMailAccountService } from '@/app/_services/mail-accounts.services'
import { SmtpTestInput, SmtpTestSchema } from '@/schemas/mail-account'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface SmtpTestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: number
  accountName: string
}

export function SmtpTestModal({
  open,
  onOpenChange,
  accountId,
  accountName,
}: SmtpTestModalProps) {
  const { isDarkMode } = useAdminTheme()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SmtpTestInput>({
    resolver: zodResolver(SmtpTestSchema),
    defaultValues: { testTo: '' },
  })

  const testMutation = useMutation({
    mutationFn: (data: SmtpTestInput) =>
      testMailAccountService(accountId, data.testTo),
    onSuccess: response => {
      setSuccessMessage(response.data ?? 'Test maili başarıyla gönderildi')
      setErrorMessage(null)
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
      setSuccessMessage(null)
    },
  })

  const onSubmit = (data: SmtpTestInput) => {
    setSuccessMessage(null)
    setErrorMessage(null)
    testMutation.mutate(data)
  }

  const handleClose = () => {
    reset()
    setSuccessMessage(null)
    setErrorMessage(null)
    onOpenChange(false)
  }

  if (!open) return null

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500'
  }`

  const labelClass = `block text-sm font-medium mb-2 ${
    isDarkMode ? 'text-slate-300' : 'text-gray-700'
  }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Modalı kapat"
      />

      {/* Dialog */}
      <div
        className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl ${
          isDarkMode
            ? 'border border-slate-700/50 bg-slate-900'
            : 'border border-gray-200 bg-white'
        }`}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3
              className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              SMTP Bağlantı Testi
            </h3>
            <p
              className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
            >
              {accountName}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className={`rounded-lg p-1.5 transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 rounded-xl bg-emerald-500/20 p-3 text-sm text-emerald-400">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 rounded-xl bg-rose-500/20 p-3 text-sm text-rose-400">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="testTo" className={labelClass}>
              Test E-posta Adresi
            </label>
            <input
              id="testTo"
              type="email"
              {...register('testTo')}
              className={inputClass}
              placeholder="test@ornek.com"
            />
            {errors.testTo && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.testTo.message}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Kapat
            </button>
            <button
              type="submit"
              disabled={testMutation.isPending}
              className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
            >
              {testMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Gönderiliyor...</span>
                </span>
              ) : (
                'Test Gönder'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
