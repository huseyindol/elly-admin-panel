'use client'

import { ReactNode, useMemo, useState } from 'react'
import { useAdminTheme } from '../_hooks'
import { Icons } from './Icons'
import { StatusBadge } from './StatusBadge'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T, index: number) => ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  keyExtractor: (item: T) => string
  groupBy?: (item: T) => string
  // Actions
  actions?: {
    onEdit?: (item: T) => void
    onDelete?: (item: T) => void
    onView?: (item: T) => void
  }
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'Kayıt bulunamadı',
  onRowClick,
  keyExtractor,
  groupBy,
  actions,
}: DataTableProps<T>) {
  const { isDarkMode } = useAdminTheme()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  )

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }))
  }

  // Memoize rendering for performance
  const tableRows = useMemo(() => {
    const renderRow = (item: T, rowIndex: number) => (
      <tr
        key={keyExtractor(item)}
        onClick={() => onRowClick?.(item)}
        className={`transition-colors ${
          onRowClick ? 'cursor-pointer' : ''
        } ${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-gray-50'}`}
      >
        {columns.map(column => (
          <td
            key={column.key}
            className={`px-6 py-4 ${
              isDarkMode ? 'text-slate-300' : 'text-gray-700'
            }`}
            style={{ width: column.width }}
          >
            {column.render
              ? column.render(item, rowIndex)
              : ((item as Record<string, unknown>)[column.key]?.toString() ??
                '-')}
          </td>
        ))}
        {actions && (
          <td className="px-6 py-4">
            <div className="flex items-center gap-2">
              {actions.onView && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    actions.onView?.(item)
                  }}
                  className={`rounded-lg p-2 transition-colors ${
                    isDarkMode
                      ? 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title="Görüntüle"
                >
                  <Icons.Eye />
                </button>
              )}
              {actions.onEdit && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    actions.onEdit?.(item)
                  }}
                  className={`rounded-lg p-2 transition-colors ${
                    isDarkMode
                      ? 'text-slate-400 hover:bg-slate-700 hover:text-violet-400'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-violet-600'
                  }`}
                  title="Düzenle"
                >
                  <Icons.Settings />
                </button>
              )}
              {actions.onDelete && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    actions.onDelete?.(item)
                  }}
                  className={`rounded-lg p-2 transition-colors ${
                    isDarkMode
                      ? 'text-slate-400 hover:bg-rose-500/20 hover:text-rose-400'
                      : 'text-gray-500 hover:bg-rose-50 hover:text-rose-600'
                  }`}
                  title="Sil"
                >
                  <Icons.X />
                </button>
              )}
            </div>
          </td>
        )}
      </tr>
    )

    if (groupBy) {
      const groups = data.reduce(
        (acc, item) => {
          const key = groupBy(item) || 'Diğer'
          if (!acc[key]) acc[key] = []
          acc[key].push(item)
          return acc
        },
        {} as Record<string, T[]>,
      )

      return Object.entries(groups).flatMap(([groupKey, groupItems]) => {
        const isExpanded = expandedGroups[groupKey] ?? true // Default to expanded

        const groupHeader = (
          <tr
            key={`group-${groupKey}`}
            onClick={() => toggleGroup(groupKey)}
            className={`cursor-pointer transition-colors ${
              isDarkMode
                ? 'border-y border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/40'
                : 'border-y border-gray-200 bg-gray-100/80 hover:bg-gray-200/80'
            }`}
          >
            <td
              colSpan={columns.length + (actions ? 1 : 0)}
              className={`px-6 py-3 text-sm font-semibold tracking-wider ${
                isDarkMode ? 'text-slate-200' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`transition-transform duration-200 ${
                    !isExpanded ? '-rotate-90' : ''
                  }`}
                >
                  <Icons.ChevronDown className="h-4 w-4" />
                </span>
                {groupKey}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-normal ${
                    isDarkMode
                      ? 'bg-slate-700 text-slate-400'
                      : 'shadow-xs bg-white text-gray-500'
                  }`}
                >
                  {groupItems.length} kayıt
                </span>
              </div>
            </td>
          </tr>
        )

        const rows = isExpanded
          ? groupItems.map((item, index) => renderRow(item, index))
          : []

        return [groupHeader, ...rows]
      })
    }

    return data.map((item, rowIndex) => renderRow(item, rowIndex))
  }, [
    data,
    columns,
    isDarkMode,
    onRowClick,
    keyExtractor,
    actions,
    groupBy,
    expandedGroups,
  ])

  if (isLoading) {
    return (
      <div
        className={`flex h-64 items-center justify-center rounded-2xl ${
          isDarkMode
            ? 'border border-slate-800/50 bg-slate-900/60'
            : 'border border-gray-200 bg-white'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="border-3 h-8 w-8 animate-spin rounded-full border-violet-500 border-t-transparent" />
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
            Yükleniyor...
          </span>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div
        className={`flex h-64 items-center justify-center rounded-2xl ${
          isDarkMode
            ? 'border border-slate-800/50 bg-slate-900/60'
            : 'border border-gray-200 bg-white'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">📭</span>
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
            {emptyMessage}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl ${
        isDarkMode
          ? 'border border-slate-800/50 bg-slate-900/60'
          : 'border border-gray-200 bg-white'
      } backdrop-blur-sm`}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className={`text-left text-sm ${
                isDarkMode
                  ? 'border-b border-slate-800/50 text-slate-400'
                  : 'border-b border-gray-200 text-gray-500'
              }`}
            >
              {columns.map(column => (
                <th
                  key={column.key}
                  className="px-6 py-4 font-medium"
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th
                  className="px-6 py-4 font-medium"
                  style={{ width: '120px' }}
                >
                  İşlemler
                </th>
              )}
            </tr>
          </thead>
          <tbody>{tableRows}</tbody>
        </table>
      </div>
    </div>
  )
}

// Re-export StatusBadge for convenience
export { StatusBadge }
