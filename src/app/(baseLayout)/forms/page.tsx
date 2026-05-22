'use client'

import {
  Column,
  ConfirmDialog,
  DataTable,
  SearchInput,
  StatusBadge,
} from '@/app/_components'
import { useAdminTheme, useDebounce } from '@/app/_hooks'
import { ForceDeleteFormModal } from '@/app/_components/forms/ForceDeleteFormModal'
import {
  ApiError,
  deleteFormService,
  forceDeleteFormService,
  getFormsService,
} from '@/app/_services/forms.services'
import type { FormSchema } from '@/types/form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function FormsListPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<FormSchema | null>(null)
  const [forceDeleteTarget, setForceDeleteTarget] = useState<FormSchema | null>(
    null,
  )

  // Fetch forms
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: () => getFormsService(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Normal delete — backend 409 dönerse force-delete modalını aç
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFormService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      setDeleteTarget(null)
      toast.success('Form silindi')
    },
    onError: (error: Error) => {
      setDeleteTarget(null)
      if (error instanceof ApiError && error.isConflict) {
        // İlişkili submission var → force-delete modalına geç
        setForceDeleteTarget(deleteTarget)
        return
      }
      toast.error(error.message || 'Form silinemedi')
    },
  })

  // Force delete — submission'larla birlikte kalıcı sil
  const forceDeleteMutation = useMutation({
    mutationFn: (id: string) => forceDeleteFormService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      setForceDeleteTarget(null)
      toast.success('Form ve tüm gönderimler silindi')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Form zorla silinemedi')
    },
  })

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Filter forms based on search
  const filteredForms =
    data?.data
      ?.filter(form =>
        form.title.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
      .sort((a, b) => a.title.localeCompare(b.title, 'tr')) || []

  const columns: Column<FormSchema>[] = [
    {
      key: 'title',
      header: 'Form Adı',
      render: form => (
        <p
          className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {form.title}
        </p>
      ),
    },
    {
      key: 'version',
      header: 'Versiyon',
      render: form => (
        <span
          className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          v{form.version}
        </span>
      ),
    },
    {
      key: 'senderMailAccountName',
      header: 'Gönderici',
      render: form => (
        <span
          className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
        >
          {form.senderMailAccountName || '—'}
        </span>
      ),
    },
    {
      key: 'recipientEmail',
      header: 'Alıcı',
      render: form => (
        <span
          className={`font-mono text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          {form.recipientEmail || '—'}
        </span>
      ),
    },
    {
      key: 'notificationEnabled',
      header: 'Bildirim',
      render: form => (
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            form.notificationEnabled
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-500/20 text-slate-400'
          }`}
        >
          {form.notificationEnabled ? 'Açık' : 'Kapalı'}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Durum',
      render: form => <StatusBadge status={form.active} />,
    },
    {
      key: 'submissions',
      header: 'Yanıtlar',
      render: form => (
        <Link
          href={`/forms/${form.id}/submissions`}
          onClick={e => e.stopPropagation()}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            isDarkMode
              ? 'text-violet-300 hover:bg-violet-500/10'
              : 'text-violet-600 hover:bg-violet-50'
          }`}
        >
          Görüntüle
        </Link>
      ),
    },
  ]

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(String(deleteTarget.id))
  }

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Formlar
            </h1>
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
              Tüm formları ve anketleri yönetin
            </p>
          </div>

          <Link
            href="/forms/new"
            className="bg-linear-to-r inline-flex items-center gap-2 rounded-xl from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40"
          >
            <span className="text-lg">+</span>
            <span>Yeni Form</span>
          </Link>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Form ara..."
          />
        </div>

        {/* Data Table */}
        {isError ? (
          <div
            className={`rounded-xl p-4 ${
              isDarkMode
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            Hata: {error?.message || 'Formlar yüklenirken bir hata oluştu'}
          </div>
        ) : (
          <DataTable
            data={filteredForms as FormSchema[]}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={form => String(form.id)}
            emptyMessage="Form bulunamadı"
            actions={{
              onEdit: form => router.push(`/forms/${form.id}`),
              onDelete: form => setDeleteTarget(form),
            }}
          />
        )}
      </div>

      {/* Normal delete onayı */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Formu Sil"
        message={`"${deleteTarget?.title}" formunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Force delete onayı — 409 Conflict sonrası gösterilir */}
      <ForceDeleteFormModal
        open={!!forceDeleteTarget}
        formTitle={forceDeleteTarget?.title ?? ''}
        onClose={() => setForceDeleteTarget(null)}
        onConfirm={() => {
          if (forceDeleteTarget) {
            forceDeleteMutation.mutate(String(forceDeleteTarget.id))
          }
        }}
        isLoading={forceDeleteMutation.isPending}
      />
    </>
  )
}
