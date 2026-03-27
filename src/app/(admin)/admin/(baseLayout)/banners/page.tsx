'use client'

import {
  Column,
  ConfirmDialog,
  CopyButton,
  DataTable,
  SearchInput,
  StatusBadge,
} from '@/app/(admin)/admin/_components'
import { useAdminTheme, useDebounce } from '@/app/(admin)/admin/_hooks'
import {
  deleteBannerService,
  getBannersBySubFolderService,
  getSubFoldersService,
} from '@/app/(admin)/admin/_services/banners.services'
import { getImageUrl } from '@/app/(admin)/admin/_utils/urlUtils'
import { Banner } from '@/types/BaseResponse'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function BannersListPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null)

  // Selected sub-folder state (default: 'all')
  const [selectedSubFolder, setSelectedSubFolder] = useState<string>('all')

  // Fetch sub-folders
  const { data: subFoldersData } = useQuery({
    queryKey: ['banner-sub-folders'],
    queryFn: () => getSubFoldersService(),
    staleTime: 5 * 60 * 1000, // 5 dakika
  })

  // Fetch banners based on selected sub-folder - 5 dakika cache
  // queryKey includes selectedSubFolder to refetch when it changes
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ['banners', selectedSubFolder],
    queryFn: () => getBannersBySubFolderService(selectedSubFolder),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBannerService(id),
    onSuccess: () => {
      // Invalidate current view queries
      queryClient.invalidateQueries({ queryKey: ['banners'] })
      queryClient.invalidateQueries({ queryKey: ['banner-sub-folders'] }) // Klasör listesi değişmiş olabilir (örneğin son item silindiyse)
      setDeleteTarget(null)
    },
    onError: error => {
      console.error('Delete error:', error)
    },
  })

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Filter banners based on search
  const filteredBanners =
    data?.data
      ?.filter(
        banner =>
          banner.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          banner.altText?.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)) || []

  // Ensure 'Tümü' is always first option
  const subFoldersList = subFoldersData?.data || []

  const columns: Column<Banner>[] = [
    {
      key: 'image',
      header: 'Görsel',
      render: banner => (
        <div className="relative h-12 w-20 overflow-hidden rounded-lg">
          {Object.keys(banner.images).length > 0 ? (
            <Image
              src={getImageUrl(banner.images.desktop)}
              alt={banner.altText || banner.title}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center ${
                isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
              }`}
            >
              <span className="text-xs text-slate-400">Yok</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Başlık',
      render: banner => (
        <div>
          <p
            className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {banner.title}
          </p>
          <p
            className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
          >
            {banner.altText || '-'}
          </p>
        </div>
      ),
    },
    // SubFolder kolonunu eklemek iyi olabilir, görsel olarak nerede olduğunu görmek için
    {
      key: 'subFolder',
      header: 'Klasör',
      render: banner => (
        <span
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            isDarkMode
              ? 'bg-slate-800 text-slate-300'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {banner.subFolder || '-'}
        </span>
      ),
    },
    {
      key: 'link',
      header: 'Link',
      render: banner => (
        <div className="flex max-w-[200px] items-center gap-2">
          <div className="flex">
            <span
              className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
            >
              {banner.link || '-'}
            </span>
            {banner.target && (
              <span
                className={`ml-2 rounded px-1.5 py-0.5 text-xs ${
                  isDarkMode
                    ? 'bg-slate-700 text-slate-400'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {banner.target}
              </span>
            )}
          </div>
          {banner.link && <CopyButton text={banner.link} />}
        </div>
      ),
    },
    {
      key: 'orderIndex',
      header: 'Sıra',
      render: banner => (
        <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          {banner.orderIndex}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      render: banner => <StatusBadge status={banner.status} />,
    },
  ]

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
  }

  function getFilterButtonClass(isActive: boolean) {
    if (isActive)
      return 'bg-violet-500 text-white shadow-lg shadow-violet-500/25 ring-2 ring-violet-500/20'
    return isDarkMode
      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
      : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
              Bannerlar
            </h1>
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
              Tüm bannerları yönetin
            </p>
          </div>

          <Link
            href="/admin/banners/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40"
          >
            <span className="text-lg">+</span>
            <span>Yeni Banner</span>
          </Link>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Banner ara..."
          />
        </div>

        {/* Sub-Folder Filter (Breadcrumb-like) */}
        {subFoldersList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedSubFolder('all')}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${getFilterButtonClass(selectedSubFolder === 'all')}`}
            >
              Tümü
            </button>

            {subFoldersList.map(folder => (
              <button
                key={folder}
                onClick={() => setSelectedSubFolder(folder)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${getFilterButtonClass(selectedSubFolder === folder)}`}
              >
                {folder}
              </button>
            ))}
          </div>
        )}

        {/* Data Table */}
        {isError ? (
          <div
            className={`rounded-xl p-4 ${
              isDarkMode
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            Hata: {error?.message || 'Bannerlar yüklenirken bir hata oluştu'}
          </div>
        ) : (
          <DataTable
            data={filteredBanners as Banner[]}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={banner => banner.id}
            emptyMessage={
              selectedSubFolder !== 'all'
                ? `"${selectedSubFolder}" klasöründe banner bulunamadı`
                : 'Henüz hiç banner eklenmemiş'
            }
            actions={{
              onEdit: banner => router.push(`/admin/banners/${banner.id}/edit`),
              onDelete: banner => setDeleteTarget(banner),
            }}
          />
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Banner'ı Sil"
        message={`"${deleteTarget?.title}" banner'ını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
