'use client'

import { useAdminTheme } from '@/app/(admin)/admin/_hooks'
import { X } from 'lucide-react'
import { KeyboardEvent, useCallback, useState } from 'react'

interface TagsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  helpText?: string
  disabled?: boolean
  className?: string
}

/**
 * TagsInput - Array alanları için tag bazlı input komponenti
 * Virgül veya Enter ile yeni tag ekler, X ile siler
 */
export function TagsInput({
  value = [],
  onChange,
  placeholder = 'Virgül ile ayırarak ekleyin...',
  helpText,
  disabled = false,
  className,
}: TagsInputProps) {
  const { isDarkMode } = useAdminTheme()
  const [inputValue, setInputValue] = useState('')

  const addTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim()
      if (trimmedTag && !value.includes(trimmedTag)) {
        onChange([...value, trimmedTag])
      }
      setInputValue('')
    },
    [value, onChange],
  )

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onChange(value.filter(tag => tag !== tagToRemove))
    },
    [value, onChange],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (inputValue.trim()) {
          addTag(inputValue)
        }
      } else if (e.key === ',' && inputValue.trim()) {
        e.preventDefault()
        addTag(inputValue)
      } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
        removeTag(value[value.length - 1])
      }
    },
    [inputValue, value, addTag, removeTag],
  )

  const handleBlur = useCallback(() => {
    if (inputValue.trim()) {
      // Virgülle ayrılmış birden fazla değer olabilir
      const tags = inputValue
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
      tags.forEach(tag => {
        if (!value.includes(tag)) {
          value.push(tag)
        }
      })
      onChange([...value])
      setInputValue('')
    }
  }, [inputValue, value, onChange])

  const containerClass = `flex flex-wrap gap-2 rounded-xl px-3 py-2 min-h-[48px] ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50'
      : 'border border-gray-200 bg-white'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`

  const tagClass = `inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${
    isDarkMode
      ? 'bg-violet-500/20 text-violet-300'
      : 'bg-violet-100 text-violet-700'
  }`

  const inputClass = `flex-1 min-w-[120px] bg-transparent outline-none text-sm ${
    isDarkMode
      ? 'text-white placeholder-slate-500'
      : 'text-gray-900 placeholder-gray-400'
  }`

  const helpTextClass = `mt-1 text-xs ${
    isDarkMode ? 'text-slate-500' : 'text-gray-400'
  }`

  return (
    <div>
      <div className={containerClass}>
        {value.map((tag, index) => (
          <span key={`${tag}-${index}`} className={tagClass}>
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="transition-opacity hover:opacity-70"
              >
                <X size={14} />
              </button>
            )}
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className={inputClass}
        />
      </div>
      {helpText && <p className={helpTextClass}>{helpText}</p>}
    </div>
  )
}

export default TagsInput
