'use client'

import { useAdminTheme } from '@/app/_hooks'
import { useMailAccounts } from '@/app/_hooks/useMailAccounts'
import {
  deleteMailAccountService,
  verifyMailAccountService,
} from '@/app/_services/mail-accounts.services'
import { SmtpTestModal } from '@/components/mail-accounts/SmtpTestModal'
import { MailAccount } from '@/types/mail-account'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

export default function MailAccountsPage() {
  const { isDarkMode } = useAdminTheme()
  const queryClient = useQueryClient()

  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<MailAccount | null>(null)
  const [testModal, setTestModal] = useState<{
    accountId: number
    accountName: string
  } | null>(null)

  // Tüm hesapları çek; tenant seçenekleri + client-side filtre için
  const { data, isLoading, isError, error } = useMailAccounts()

  const allAccounts = data?.data ?? []

  // Tenant dropdown seçenekleri — benzersiz, sıralı
  const tenantOptions = [
    ...new Set(
      allAccounts.map(a => a.tenantId).filter((id): id is string => !!id),
    ),
  ].sort()

  // Client-side tenant filtresi
  const accounts = selectedTenantId
    ? allAccounts.filter(a => a.tenantId === selectedTenantId)
    : allAccounts

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMailAccountService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-accounts'] })
      toast.success('Mail hesabı silindi')
      setDeleteTarget(null)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Mail hesabı silinemedi')
      setDeleteTarget(null)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (id: number) => verifyMailAccountService(id),
    onSuccess: () => toast.success('SMTP bağlantısı başarılı ✓'),
    onError: (err: Error) =>
      toast.error(err.message || 'SMTP doğrulama başarısız'),
  })

  const cardClass = `rounded-2xl p-5 transition-all ${
    isDarkMode
      ? 'border border-slate-800/50 bg-slate-900/60'
      : 'border border-gray-200 bg-white'
  }`

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

        {/* Tenant Filtresi */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="tenant-filter"
            className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}
          >
            Tenant:
          </label>
          <select
            id="tenant-filter"
            value={selectedTenantId}
            onChange={e => setSelectedTenantId(e.target.value)}
            className={`rounded-xl px-3 py-2 text-sm outline-none transition-colors ${
              isDarkMode
                ? 'border border-slate-700/50 bg-slate-800/50 text-white focus:border-violet-500'
                : 'border border-gray-200 bg-white text-gray-900 focus:border-violet-500'
            }`}
          >
            <option value="">Tümü</option>
            {tenantOptions.map(tid => (
              <option key={tid} value={tid}>
                {tid}
              </option>
            ))}
          </select>
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
              {selectedTenantId
                ? `"${selectedTenantId}" tenant'ına ait mail hesabı bulunamadı`
                : 'Henüz mail hesabı eklenmemiş'}
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
                className={`${cardClass} ${!account.active ? 'opacity-60' : ''} ${
                  account.isPrimary
                    ? isDarkMode
                      ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : 'border-emerald-400 ring-1 ring-emerald-200'
                    : ''
                }`}
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
                    {account.isPrimary && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        Ana Hesap
                      </span>
                    )}
                    {account.tenantId && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          isDarkMode
                            ? 'bg-slate-700 text-slate-300'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {account.tenantId}
                      </span>
                    )}
                    {!account.tenantId && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          isDarkMode ? 'text-slate-600' : 'text-gray-400'
                        }`}
                      >
                        Atanmamış
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

                  <button
                    type="button"
                    onClick={() => verifyMutation.mutate(account.id)}
                    disabled={verifyMutation.isPending}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      isDarkMode
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Doğrula
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(account)}
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

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default border-0 bg-black/60"
            onClick={() => setDeleteTarget(null)}
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
              Hesabı Sil
            </h3>
            <p
              className={`mb-6 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}
            >
              &quot;{deleteTarget.name}&quot; hesabını silmek istediğinizden
              emin misiniz? Bu hesabı kullanan formlar varsayılan hesaba
              geçecektir.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
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
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-500/30 transition-all hover:shadow-xl hover:shadow-rose-500/40 disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Siliniyor...</span>
                  </span>
                ) : (
                  'Sil'
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
