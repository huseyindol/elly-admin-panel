'use client'

import {
  Column,
  ConfirmDialog,
  DataTable,
  SearchInput,
  StatusBadge,
} from '@/app/(admin)/admin/_components'
import { useAdminTheme, useDebounce } from '@/app/(admin)/admin/_hooks'
import {
  deletePageService,
  getPageService,
} from '@/app/(admin)/admin/_services/pages.services'
import { Page } from '@/types/BaseResponse'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PagesListPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null)

  // Fetch pages - 5 dakika cache
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ['pages'],
    queryFn: () => getPageService(),
    staleTime: 5 * 60 * 1000, // 5 dakika boyunca veri "fresh" kabul edilir
    gcTime: 10 * 60 * 1000, // 10 dakika boyunca cache'de tutulur
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePageService(id),
    onSuccess: () => {
      // Invalidate and refetch pages list
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      setDeleteTarget(null)
    },
    onError: error => {
      console.error('Delete error:', error)
      // TODO: Show error toast
    },
  })

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Filter pages based on search
  const filteredPages =
    data?.data
      ?.filter(
        page =>
          page.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          page.slug.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
      .sort((a, b) => a.title.localeCompare(b.title, 'tr')) || []

  const columns: Column<Page>[] = [
    {
      key: 'title',
      header: 'Başlık',
      render: page => (
        <div>
          <p
            className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {page.title}
          </p>
          <p
            className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
          >
            /{page.slug}
          </p>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Açıklama',
      render: page => (
        <span
          className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          {page.description || '-'}
        </span>
      ),
    },
    {
      key: 'seoInfo',
      header: 'SEO',
      render: page => (
        <div className="flex items-center gap-2">
          {page.seoInfo?.noIndex ? (
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
              noindex
            </span>
          ) : (
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
              index
            </span>
          )}
          {page.seoInfo?.noFollow ? (
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
              nofollow
            </span>
          ) : (
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
              follow
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      render: page => <StatusBadge status={page.status} />,
    },
  ]

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
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
              Sayfalar
            </h1>
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
              Tüm sayfaları yönetin
            </p>
          </div>

          <Link
            href="/admin/pages/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40"
          >
            <span className="text-lg">+</span>
            <span>Yeni Sayfa</span>
          </Link>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Sayfa ara..."
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
            Hata: {error?.message || 'Sayfalar yüklenirken bir hata oluştu'}
          </div>
        ) : (
          <DataTable
            data={filteredPages as Page[]}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={page => page.id}
            emptyMessage="Sayfa bulunamadı"
            actions={{
              onEdit: page => router.push(`/admin/pages/${page.slug}/edit`),
              onDelete: page => setDeleteTarget(page),
            }}
          />
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Sayfayı Sil"
        message={`"${deleteTarget?.title}" sayfasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
