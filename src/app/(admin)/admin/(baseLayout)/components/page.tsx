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
  deleteComponentService,
  getComponentService,
} from '@/app/(admin)/admin/_services/components.services'
import { Component, ComponentTypeEnum } from '@/types/BaseResponse'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ComponentsListPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Component | null>(null)

  console.log('ComponentsListPage')
  // Fetch components - 5 dakika cache
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ['components'],
    queryFn: () => getComponentService(),
    staleTime: 5 * 60 * 1000, // 5 dakika boyunca veri "fresh" kabul edilir
    gcTime: 10 * 60 * 1000, // 10 dakika boyunca cache'de tutulur
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteComponentService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] })
      setDeleteTarget(null)
    },
    onError: error => {
      console.error('Delete error:', error)
    },
  })

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Filter components based on search
  const filteredComponents =
    data?.data
      ?.filter(
        component =>
          component.name
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          component.description
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase()),
      )
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)) || []

  const columns: Column<Component>[] = [
    {
      key: 'name',
      header: 'İsim',
      render: component => (
        <div>
          <p
            className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {component.name}
          </p>
          <p
            className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
          >
            {component.description || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tip',
      render: component => {
        let badgeClass: string
        if (component.type === ComponentTypeEnum.BANNER) {
          badgeClass = 'bg-blue-500/20 text-blue-400'
        } else if (component.type === ComponentTypeEnum.FORM) {
          badgeClass = 'bg-emerald-500/20 text-emerald-400'
        } else {
          badgeClass = 'bg-purple-500/20 text-purple-400'
        }
        return (
          <span
            className={`rounded px-2 py-1 text-xs font-medium ${badgeClass}`}
          >
            {component.type}
          </span>
        )
      },
    },
    {
      key: 'orderIndex',
      header: 'Sıra',
      render: component => (
        <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          {component.orderIndex}
        </span>
      ),
    },
    {
      key: 'connections',
      header: 'Bağlantılar',
      render: component => (
        <div className="flex gap-2">
          <span
            className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            {component.banners?.length || 0} banner
          </span>
          <span
            className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            {component.widgets?.length || 0} widget
          </span>
          <span
            className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            {component.forms?.length || 0} form
          </span>
          <span
            className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            {component.pageIds?.length || 0} sayfa
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      render: component => <StatusBadge status={component.status} />,
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
              Componentler
            </h1>
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
              Sayfa componentlerini yönetin
            </p>
          </div>

          <Link
            href="/admin/components/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40"
          >
            <span className="text-lg">+</span>
            <span>Yeni Component</span>
          </Link>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Component ara..."
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
            Hata: {error?.message || 'Componentler yüklenirken bir hata oluştu'}
          </div>
        ) : (
          <DataTable
            data={filteredComponents as Component[]}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={component => component.id}
            emptyMessage="Component bulunamadı"
            actions={{
              onEdit: component =>
                router.push(`/admin/components/${component.id}/edit`),
              onDelete: component => setDeleteTarget(component),
            }}
          />
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Component'i Sil"
        message={`"${deleteTarget?.name}" component'ini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
