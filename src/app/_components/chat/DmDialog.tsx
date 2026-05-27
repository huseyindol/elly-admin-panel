'use client'

import { useState } from 'react'
import { Modal } from '@/app/_components'
import { getOrCreateDmService } from '@/app/_services/chat.services'
import { useChatWsStore } from '@/stores/chat-ws-store'
import { useAdminTheme } from '@/app/_hooks'
import type { ChatGroup } from '@/types/chat'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated: (group: ChatGroup) => void
}

export function DmDialog({ isOpen, onClose, onCreated }: Props) {
  const { isDarkMode } = useAdminTheme()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const subscribeToGroup = useChatWsStore(s => s.subscribeToGroup)

  const inputClass = `w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500/30 ${
    isDarkMode
      ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500/50'
      : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-violet-300'
  }`

  const handleSubmit = async () => {
    const id = Number(userId.trim())
    if (!id) {
      setError('Geçerli bir kullanıcı ID girin')
      return
    }
    setError('')
    setLoading(true)
    try {
      const group = await getOrCreateDmService(id)
      onCreated(group)
      // DM her zaman Admin Chat kapsamında (tenantId=null)
      subscribeToGroup(group.id, null)
      onClose()
      setUserId('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'DM açılamadı')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setUserId('')
    setError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Direkt Mesaj Başlat">
      <div className="space-y-4">
        <div>
          <label
            className={`mb-1.5 block text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
          >
            Kullanıcı ID
          </label>
          <input
            type="number"
            placeholder="Kullanıcı ID girin"
            value={userId}
            onChange={e => {
              setUserId(e.target.value)
              setError('')
            }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className={inputClass}
            autoFocus
          />
          {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
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
            disabled={loading || !userId.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Açılıyor...
              </>
            ) : (
              'Başlat'
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
