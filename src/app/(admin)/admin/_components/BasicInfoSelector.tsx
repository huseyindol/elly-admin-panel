'use client'

import React, { useMemo, useState } from 'react'
import { useAdminTheme } from '../_hooks'
import { useBasicInfos } from '../_hooks/useBasicInfos'
import { SearchInput } from './SearchInput'

interface BasicInfoSelectorProps {
  mode: 'select' | 'create'
  onModeChange: (mode: 'select' | 'create') => void
  selectedBasicInfoId: string
  onSelectBasicInfo: (id: string) => void
  children: React.ReactNode // Fields for 'create' mode
}

export function BasicInfoSelector({
  mode,
  onModeChange,
  selectedBasicInfoId,
  onSelectBasicInfo,
  children,
}: BasicInfoSelectorProps) {
  const { isDarkMode } = useAdminTheme()
  const { data: basicInfos, isLoading, isError } = useBasicInfos()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBasicInfos = useMemo(() => {
    if (!basicInfos) return []
    if (!searchQuery) return basicInfos

    const lowerQuery = searchQuery.toLowerCase()
    return basicInfos.filter(
      info =>
        info.title.toLowerCase().includes(lowerQuery) ||
        info.sectionKey.toLowerCase().includes(lowerQuery) ||
        (info.description &&
          info.description.toLowerCase().includes(lowerQuery)),
    )
  }, [basicInfos, searchQuery])

  const selectedCardClass = `rounded-2xl p-6 ${
    isDarkMode
      ? 'border border-slate-800/50 bg-slate-900/60'
      : 'border border-gray-200 bg-white'
  } backdrop-blur-sm`

  return (
    <div className={selectedCardClass}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2
          className={`text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Temel Bilgiler (Basic Info)
        </h2>

        {/* Mode Toggle */}
        <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => onModeChange('select')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              mode === 'select'
                ? 'bg-white text-violet-600 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Mevcut Seç
          </button>
          <button
            type="button"
            onClick={() => onModeChange('create')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              mode === 'create'
                ? 'bg-white text-violet-600 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Yeni Oluştur
          </button>
        </div>
      </div>

      {mode === 'select' ? (
        <div className="space-y-4">
          <p
            className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            Mevcut bir içerik grubuna (section) eleman eklemek için sistemdeki
            kayıtlı temel bilgileri arayıp seçin.
          </p>

          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Başlık, section key veya açıklama ara..."
          />

          {isLoading ? (
            <div
              className={`py-8 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
            >
              Temel bilgiler yükleniyor...
            </div>
          ) : isError ? (
            <div className={`py-8 text-center text-sm text-rose-500`}>
              Bilgiler yüklenirken hata oluştu!
            </div>
          ) : (
            <div className="mt-4 grid max-h-96 gap-3 overflow-y-auto pr-2">
              {filteredBasicInfos.length === 0 ? (
                <div
                  className={`py-8 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
                >
                  Eşleşen temel bilgi bulunamadı.
                </div>
              ) : (
                filteredBasicInfos.map(info => (
                  <div
                    key={info.id}
                    onClick={() => onSelectBasicInfo(info.id)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      selectedBasicInfoId === info.id
                        ? isDarkMode
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-violet-500 bg-violet-50'
                        : isDarkMode
                          ? 'border-slate-700 hover:border-slate-500'
                          : 'border-gray-200 hover:border-violet-300'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <h4
                        className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {info.title}
                      </h4>
                      <span
                        className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'}`}
                      >
                        Section: {info.sectionKey}
                      </span>
                    </div>
                    {info.description && (
                      <p
                        className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} line-clamp-1`}
                      >
                        {info.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">{children}</div>
      )}
    </div>
  )
}
