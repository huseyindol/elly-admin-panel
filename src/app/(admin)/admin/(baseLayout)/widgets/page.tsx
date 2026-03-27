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
  deleteWidgetService,
  getWidgetService,
} from '@/app/(admin)/admin/_services/widgets.services'
import { Widget, WidgetTypeEnum } from '@/types/BaseResponse'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function WidgetsListPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Widget | null>(null)

  // Fetch widgets - 5 dakika cache
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ['widgets'],
    queryFn: () => getWidgetService(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWidgetService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets'] })
      setDeleteTarget(null)
    },
    onError: error => {
      console.error('Delete error:', error)
    },
  })

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Filter widgets based on search
  const filteredWidgets =
    data?.data
      ?.filter(
        widget =>
          widget.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          widget.description
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase()),
      )
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)) || []

  const columns: Column<Widget>[] = [
    {
      key: 'name',
      header: 'İsim',
      render: widget => (
        <div>
          <p
            className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {widget.name}
          </p>
          <p
            className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
          >
            {widget.description || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tip',
      render: widget => (
        <span
          className={`rounded px-2 py-1 text-xs font-medium ${
            widget.type === WidgetTypeEnum.BANNER
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          {widget.type}
        </span>
      ),
    },
    {
      key: 'orderIndex',
      header: 'Sıra',
      render: widget => (
        <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          {widget.orderIndex}
        </span>
      ),
    },
    {
      key: 'banners',
      header: 'Bağlantılar',
      render: widget => (
        <div className="flex gap-2">
          <span
            className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            {widget.banners?.length || 0} banner
          </span>
          <span
            className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            {widget.posts?.length || 0} post
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      render: widget => <StatusBadge status={widget.status} />,
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
              Widgetlar
            </h1>
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
              Tüm widgetları yönetin
            </p>
          </div>

          <Link
            href="/admin/widgets/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40"
          >
            <span className="text-lg">+</span>
            <span>Yeni Widget</span>
          </Link>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Widget ara..."
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
            Hata: {error?.message || 'Widgetlar yüklenirken bir hata oluştu'}
          </div>
        ) : (
          <DataTable
            data={filteredWidgets as Widget[]}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={widget => widget.id}
            emptyMessage="Widget bulunamadı"
            actions={{
              onEdit: widget => router.push(`/admin/widgets/${widget.id}/edit`),
              onDelete: widget => setDeleteTarget(widget),
            }}
          />
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Widget'ı Sil"
        message={`"${deleteTarget?.name}" widget'ını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
