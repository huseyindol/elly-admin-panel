'use client'

import { ConfirmDialog } from '@/app/(admin)/admin/_components'
import {
  AssetSearchForm,
  AssetTable,
  AssetUploadModal,
} from '@/app/(admin)/admin/_components/assets'
import { useAdminTheme } from '@/app/(admin)/admin/_hooks'
import {
  AssetResponse,
  deleteAssetService,
  getAssetByIdService,
  getAssetsPagedService,
  getSubFoldersService,
  searchAssetsByNamePagedService,
  searchAssetsBySubFolderAndNameService,
} from '@/app/(admin)/admin/_services/assets.services'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

export default function AssetsPage() {
  const { isDarkMode } = useAdminTheme()
  const queryClient = useQueryClient()

  // State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [searchType, setSearchType] = useState<'id' | 'name'>('name')
  const [searchValue, setSearchValue] = useState('')
  const [selectedSubFolder, setSelectedSubFolder] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState<{
    type: 'id' | 'name'
    value: string
    subFolder: string
  } | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [deleteTarget, setDeleteTarget] = useState<AssetResponse | null>(null)

  // Fetch sub-folders
  const subFoldersQuery = useQuery({
    queryKey: ['assets', 'sub-folders'],
    queryFn: getSubFoldersService,
  })

  const subFolders = subFoldersQuery.data?.data ?? []

  // Determine query state based on SUBMITTED search (not input value)
  const isSearchingById =
    submittedSearch?.type === 'id' && submittedSearch.value.trim().length > 0
  const isSearchingByName =
    submittedSearch?.type === 'name' && submittedSearch.value.trim().length > 0
  const hasSubFolderFilter =
    isSearchingByName && submittedSearch?.subFolder.trim().length > 0

  // Main paged list query
  // Runs on initial load (when submittedSearch is null)
  // Runs when searching by name (with or without subFolder filter)
  // Disabled when searching by ID
  const assetsQuery = useQuery({
    queryKey: ['assets', 'paged', page, pageSize, submittedSearch],
    queryFn: async () => {
      if (isSearchingByName && submittedSearch) {
        // If subFolder is selected, use the subFolder+name endpoint
        if (hasSubFolderFilter) {
          return searchAssetsBySubFolderAndNameService(
            submittedSearch.subFolder,
            submittedSearch.value,
            page,
            pageSize,
          )
        }
        // Otherwise use regular name search
        return searchAssetsByNamePagedService(
          submittedSearch.value,
          page,
          pageSize,
        )
      }
      return getAssetsPagedService(page, pageSize)
    },
    enabled: !isSearchingById, // Run when not searching by ID
  })

  // ID search query (only when searching by ID)
  const assetByIdQuery = useQuery({
    queryKey: ['assets', 'byId', submittedSearch?.value],
    queryFn: async () => {
      return getAssetByIdService(submittedSearch!.value)
    },
    enabled: isSearchingById,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAssetService(id),
    onSuccess: () => {
      toast.success('Asset başarıyla silindi.')
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      setDeleteTarget(null)
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Silme sırasında bir hata oluştu.'
      toast.error(errorMessage)
    },
  })

  // Prepare data for table
  const getTableData = (): AssetResponse[] => {
    if (isSearchingById && assetByIdQuery.data?.data) {
      return [assetByIdQuery.data.data]
    }
    return assetsQuery.data?.data?.content ?? []
  }

  const getPaginationInfo = () => {
    if (isSearchingById) {
      return {
        page: 0,
        totalPages: assetByIdQuery.data?.data ? 1 : 0,
        totalElements: assetByIdQuery.data?.data ? 1 : 0,
      }
    }
    return {
      page: assetsQuery.data?.data?.page ?? 0,
      totalPages: assetsQuery.data?.data?.totalPages ?? 0,
      totalElements: assetsQuery.data?.data?.totalElements ?? 0,
    }
  }

  const isLoading =
    (isSearchingById ? assetByIdQuery.isLoading : assetsQuery.isLoading) ||
    deleteMutation.isPending

  // Only trigger search when form is submitted
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchValue.trim()) {
      toast.error('Lütfen bir değer girin.')
      return
    }
    setSubmittedSearch({
      type: searchType,
      value: searchValue.trim(),
      subFolder: selectedSubFolder,
    })
    setPage(0)
  }

  const handleSearchValueChange = (value: string) => {
    setSearchValue(value)
  }

  const handleClearSearch = () => {
    setSearchValue('')
    setSelectedSubFolder('')
    setSubmittedSearch(null)
    setPage(0)
  }

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id)
    }
  }

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['assets'] })
  }

  const paginationInfo = getPaginationInfo()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1
          className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
        >
          Asset Yönetimi
        </h1>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="rounded-lg bg-violet-600 px-4 py-2 text-white transition hover:bg-violet-700"
        >
          + Yeni Ekle
        </button>
      </div>

      {/* Search Section */}
      <div
        className={`rounded-xl p-6 shadow-sm ${
          isDarkMode ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        <h2
          className={`mb-4 text-xl font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}
        >
          Asset Ara
        </h2>
        <AssetSearchForm
          searchType={searchType}
          searchValue={searchValue}
          loading={isLoading}
          onSearchTypeChange={setSearchType}
          onSearchValueChange={handleSearchValueChange}
          onSearch={handleSearch}
          onClear={handleClearSearch}
          hasActiveSearch={!!submittedSearch}
          subFolders={subFolders}
          selectedSubFolder={selectedSubFolder}
          onSubFolderChange={setSelectedSubFolder}
        />
      </div>

      {/* Assets Table */}
      <div
        className={`rounded-xl p-6 shadow-sm ${
          isDarkMode ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        <h2
          className={`mb-4 text-xl font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}
        >
          Asset Listesi
        </h2>
        <AssetTable
          data={getTableData()}
          isLoading={isLoading}
          onDelete={setDeleteTarget}
          page={paginationInfo.page}
          pageSize={pageSize}
          totalPages={paginationInfo.totalPages}
          totalElements={paginationInfo.totalElements}
          onPageChange={setPage}
          onPageSizeChange={size => {
            setPageSize(size)
            setPage(0)
          }}
        />
      </div>

      {/* Upload Modal */}
      <AssetUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Asset Sil"
        message={`"${deleteTarget?.name}" adlı asseti silmek istediğinize emin misiniz?`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
      />
    </div>
  )
}
