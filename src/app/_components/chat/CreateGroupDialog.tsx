'use client'

import { Modal } from '@/app/_components'
import { useAdminTheme } from '@/app/_hooks'
import { createGroupService } from '@/app/_services/chat.services'
import type { ChatGroup, RoleLevel } from '@/types/chat'
import { getMyRoleLevel, visibilityLabel } from '@/utils/chat-role'
import { useEffect, useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated: (group: ChatGroup) => void
}

export function CreateGroupDialog({ isOpen, onClose, onCreated }: Props) {
  const { isDarkMode } = useAdminTheme()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [myLevel, setMyLevel] = useState<RoleLevel>(1)

  useEffect(() => {
    if (!isOpen) return
    getMyRoleLevel().then(setMyLevel)
  }, [isOpen])

  const inputClass = `w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500/30 ${
    isDarkMode
      ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500/50'
      : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-violet-300'
  }`

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const group = await createGroupService({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      onCreated(group)
      onClose()
      setName('')
      setDescription('')
    } catch {
      // hata sessizce geçilir — toast gerekirse eklenebilir
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Grup Oluştur">
      <div className="space-y-4">
        <div>
          <label
            className={`mb-1.5 block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
          >
            Grup Adı
          </label>
          <input
            type="text"
            placeholder="Grup adı girin"
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label
            className={`mb-1.5 block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
          >
            Açıklama{' '}
            <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>
              (isteğe bağlı)
            </span>
          </label>
          <textarea
            placeholder="Grup açıklaması"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <p
          className={`rounded-lg px-3 py-2 text-xs ${
            isDarkMode
              ? 'bg-slate-800 text-slate-400'
              : 'bg-gray-50 text-gray-500'
          }`}
        >
          Bu grup otomatik olarak <strong>{visibilityLabel(myLevel)}</strong>{' '}
          görünürlüğünde oluşturulacak.
          {myLevel === 1 && ' (VIEWER: herkes görebilir)'}
          {myLevel === 2 &&
            ' (EDITOR+: sadece EDITOR, ADMIN ve SUPER_ADMIN görebilir)'}
          {myLevel === 3 && ' (ADMIN+: sadece ADMIN ve SUPER_ADMIN görebilir)'}
          {myLevel === 4 &&
            ' (SUPER_ADMIN: kimse göremez, sadece davet edilenler)'}
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:bg-slate-800'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Oluşturuluyor...
              </>
            ) : (
              'Oluştur'
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
