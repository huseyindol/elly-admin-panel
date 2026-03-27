'use client'

import { useAdminTheme } from '@/app/(admin)/admin/_hooks'

interface AssetSearchFormProps {
  searchType: 'id' | 'name'
  searchValue: string
  loading: boolean
  hasActiveSearch: boolean
  subFolders: string[]
  selectedSubFolder: string
  onSearchTypeChange: (type: 'id' | 'name') => void
  onSearchValueChange: (value: string) => void
  onSubFolderChange: (subFolder: string) => void
  onSearch: (e: React.FormEvent) => void
  onClear: () => void
}

export function AssetSearchForm({
  searchType,
  searchValue,
  loading,
  hasActiveSearch,
  subFolders,
  selectedSubFolder,
  onSearchTypeChange,
  onSearchValueChange,
  onSubFolderChange,
  onSearch,
  onClear,
}: Readonly<AssetSearchFormProps>) {
  const { isDarkMode } = useAdminTheme()

  const selectClasses = `rounded-lg border px-3 py-2 outline-none focus:ring-2 ${
    isDarkMode
      ? 'border-slate-700 bg-slate-900 text-white focus:ring-violet-500'
      : 'border-gray-300 bg-white text-gray-900 focus:ring-violet-500'
  }`

  return (
    <form onSubmit={onSearch} className="space-y-4">
      {/* Search Type Selection */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            checked={searchType === 'id'}
            onChange={() => onSearchTypeChange('id')}
            className="h-4 w-4 text-violet-600"
          />
          <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
            ID ile Ara
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            checked={searchType === 'name'}
            onChange={() => onSearchTypeChange('name')}
            className="h-4 w-4 text-violet-600"
          />
          <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
            İsim ile Ara
          </span>
        </label>

        {/* SubFolder Select - only show when subFolders exist and searching by name */}
        {subFolders.length > 0 && searchType === 'name' && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="subFolderSelect"
              className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}
            >
              Alt Klasör:
            </label>
            <select
              id="subFolderSelect"
              value={selectedSubFolder}
              onChange={e => onSubFolderChange(e.target.value)}
              className={selectClasses}
            >
              <option value="">Tümü</option>
              {subFolders.map(folder => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchValue}
          onChange={e => onSearchValueChange(e.target.value)}
          placeholder={searchType === 'id' ? 'Asset ID' : 'Dosya Adı'}
          className={`flex-1 rounded-lg border px-4 py-2 outline-none focus:ring-2 ${
            isDarkMode
              ? 'border-slate-700 bg-slate-900 text-white focus:ring-violet-500'
              : 'border-gray-300 bg-white text-gray-900 focus:ring-violet-500'
          }`}
        />
        <button
          type="submit"
          disabled={loading || !searchValue.trim()}
          className="rounded-lg bg-violet-600 px-6 py-2 text-white hover:bg-violet-700 disabled:opacity-50"
        >
          Ara
        </button>
        {hasActiveSearch && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg bg-slate-500 px-4 py-2 text-white hover:bg-slate-600"
          >
            Temizle
          </button>
        )}
      </div>
    </form>
  )
}
