'use client'

import { useAdminTheme } from '@/app/_hooks'
import {
  deleteMailAccountService,
  setDefaultMailAccountService,
} from '@/app/_services/mail-accounts.services'
import { SmtpTestModal } from '@/components/mail-accounts/SmtpTestModal'
import { MailAccount } from '@/types/mail-account'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { useMailAccounts } from '@/app/_hooks/useMailAccounts'

interface ConfirmState {
  type: 'delete' | 'setDefault'
  account: MailAccount
}

export default function MailAccountsPage() {
  const { isDarkMode } = useAdminTheme()
  const queryClient = useQueryClient()
  const { data, isLoading, isError, error } = useMailAccounts()
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [testModal, setTestModal] = useState<{
    accountId: number
    accountName: string
  } | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMailAccountService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-accounts'] })
      toast.success('Mail hesabı silindi')
      setConfirmState(null)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Mail hesabı silinemedi')
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => setDefaultMailAccountService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-accounts'] })
      toast.success('Varsayılan hesap güncellendi')
      setConfirmState(null)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Varsayılan hesap ayarlanamadı')
    },
  })

  const handleConfirm = () => {
    if (!confirmState) return
    if (confirmState.type === 'delete') {
      deleteMutation.mutate(confirmState.account.id)
    } else {
      setDefaultMutation.mutate(confirmState.account.id)
    }
  }

  const isConfirmPending =
    deleteMutation.isPending || setDefaultMutation.isPending

  const cardClass = `rounded-2xl p-5 ${
    isDarkMode
      ? 'border border-slate-800/50 bg-slate-900/60'
      : 'border border-gray-200 bg-white'
  } backdrop-blur-sm`

  const accounts = data?.data ?? []

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Mail Hesapları
            </h1>
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
              SMTP mail hesaplarını yönetin
            </p>
          </div>

          <Link
            href="/mail-accounts/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40"
          >
            <span className="text-lg">+</span>
            <span>Yeni Hesap Ekle</span>
          </Link>
        </div>

        {/* Error */}
        {isError && (
          <div
            className={`rounded-xl p-4 ${
              isDarkMode
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            Hata:{' '}
            {error?.message || 'Mail hesapları yüklenirken bir hata oluştu'}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                Yükleniyor...
              </span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && accounts.length === 0 && (
          <div
            className={`rounded-2xl p-12 text-center ${
              isDarkMode
                ? 'border border-slate-800/50 bg-slate-900/60'
                : 'border border-gray-200 bg-white'
            }`}
          >
            <p
              className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
            >
              Henüz mail hesabı eklenmemiş
            </p>
            <Link
              href="/mail-accounts/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white"
            >
              İlk Hesabı Ekle
            </Link>
          </div>
        )}

        {/* Accounts Grid */}
        {!isLoading && accounts.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map(account => (
              <div
                key={account.id}
                className={`${cardClass} ${!account.active ? 'opacity-60' : ''}`}
              >
                {/* Card Header */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`truncate font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {account.name}
                    </h3>
                    <p
                      className={`truncate text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
                    >
                      {account.fromAddress}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {account.isDefault && (
                      <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-400">
                        Varsayılan
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        account.active
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {account.active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>

                {/* SMTP Info */}
                <div
                  className={`mb-4 rounded-xl p-3 text-sm ${
                    isDarkMode ? 'bg-slate-800/60' : 'bg-gray-50'
                  }`}
                >
                  <p
                    className={`font-mono ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
                  >
                    {account.smtpHost}:{account.smtpPort}
                  </p>
                  <p
                    className={`mt-0.5 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
                  >
                    {account.smtpUsername}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/mail-accounts/${account.id}/edit`}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-center text-xs font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Düzenle
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      setTestModal({
                        accountId: account.id,
                        accountName: account.name,
                      })
                    }
                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    Test Et
                  </button>

                  {!account.isDefault && (
                    <button
                      type="button"
                      disabled={!account.active}
                      onClick={() =>
                        setConfirmState({ type: 'setDefault', account })
                      }
                      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        isDarkMode
                          ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                          : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                      }`}
                      title={
                        !account.active
                          ? 'Pasif hesap varsayılan yapılamaz'
                          : undefined
                      }
                    >
                      Varsayılan Yap
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setConfirmState({ type: 'delete', account })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default border-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmState(null)}
            aria-label="Kapat"
          />
          <div
            className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl ${
              isDarkMode
                ? 'border border-slate-700/50 bg-slate-900'
                : 'border border-gray-200 bg-white'
            }`}
          >
            <h3
              className={`mb-2 text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {confirmState.type === 'delete'
                ? 'Hesabı Sil'
                : 'Varsayılan Hesap Yap'}
            </h3>
            <p
              className={`mb-6 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}
            >
              {confirmState.type === 'delete'
                ? `"${confirmState.account.name}" hesabını silmek istediğinizden emin misiniz? Bu hesabı kullanan formlar varsayılan hesaba geçecektir.`
                : `"${confirmState.account.name}" hesabını varsayılan yapmak istediğinizden emin misiniz?`}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                disabled={isConfirmPending}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                  isDarkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirmPending}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all disabled:opacity-50 ${
                  confirmState.type === 'delete'
                    ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40'
                    : 'bg-gradient-to-r from-violet-500 to-purple-600 shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40'
                }`}
              >
                {isConfirmPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>İşleniyor...</span>
                  </span>
                ) : confirmState.type === 'delete' ? (
                  'Sil'
                ) : (
                  'Varsayılan Yap'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMTP Test Modal */}
      {testModal && (
        <SmtpTestModal
          open={!!testModal}
          onOpenChange={open => {
            if (!open) setTestModal(null)
          }}
          accountId={testModal.accountId}
          accountName={testModal.accountName}
        />
      )}
    </>
  )
}
