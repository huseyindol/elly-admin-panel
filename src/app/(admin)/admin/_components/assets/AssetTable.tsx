'use client'

import { CopyButton, DataTable } from '@/app/(admin)/admin/_components'
import type { Column } from '@/app/(admin)/admin/_components/DataTable'
import { Icons } from '@/app/(admin)/admin/_components/Icons'
import { useAdminTheme } from '@/app/(admin)/admin/_hooks'
import type { AssetResponse } from '@/app/(admin)/admin/_services/assets.services'

const PAGE_SIZE_OPTIONS = [10, 30, 50, 100]

interface AssetTableProps {
  data: AssetResponse[]
  isLoading: boolean
  onDelete: (asset: AssetResponse) => void
  // Pagination
  page: number
  pageSize: number
  totalPages: number
  totalElements: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function AssetTable({
  data,
  isLoading,
  onDelete,
  page,
  pageSize,
  totalPages,
  totalElements,
  onPageChange,
  onPageSizeChange,
}: AssetTableProps) {
  const { isDarkMode } = useAdminTheme()

  const columns: Column<AssetResponse>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '80px',
      render: item => (
        <div className="flex items-center gap-2">
          <span>{item.id}</span>
          <CopyButton text={String(item.id)} />
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Dosya Adı',
      render: item => <span className="font-medium">{item.name}</span>,
    },
    {
      key: 'path',
      header: 'Yol',
      render: item => (
        <div className="flex items-center gap-2">
          <span className="max-w-[200px] truncate" title={item.path}>
            {item.path}
          </span>
          <CopyButton text={String(item.path)} />
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tür',
      width: '120px',
    },
    {
      key: 'subFolder',
      header: 'Alt Klasör',
      width: '120px',
      render: item => item.subFolder || '-',
    },
  ]

  return (
    <div className="space-y-4">
      <DataTable<AssetResponse>
        data={data}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Asset bulunamadı"
        keyExtractor={item => String(item.id)}
        actions={{
          onDelete: onDelete,
        }}
      />

      {/* Pagination */}
      {totalPages > 0 && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 ${
            isDarkMode ? 'bg-slate-800' : 'bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-4">
            <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
              Toplam {totalElements} kayıt
            </span>
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="pageSize"
                className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}
              >
                Sayfa başına:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={e => onPageSizeChange(Number(e.target.value))}
                className={`rounded-lg border px-2 py-1 text-sm outline-none focus:ring-2 ${
                  isDarkMode
                    ? 'border-slate-600 bg-slate-700 text-white focus:ring-violet-500'
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-violet-500'
                }`}
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                isDarkMode
                  ? 'bg-slate-700 text-white hover:bg-slate-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Icons.ChevronsLeft />
            </button>
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                isDarkMode
                  ? 'bg-slate-700 text-white hover:bg-slate-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Icons.ChevronsRight />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
