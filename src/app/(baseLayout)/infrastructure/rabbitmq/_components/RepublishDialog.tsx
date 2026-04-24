'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/app/_components'
import { useAdminTheme } from '@/app/_hooks'
import { useRepublishMessage } from '@/app/_hooks/useRabbitMQ'
import type { RabbitMessage } from '@/types/cms'

interface RepublishDialogProps {
  isOpen: boolean
  onClose: () => void
  sourceQueue: string | null
  initialMessage?: RabbitMessage | null
  defaultTargetQueue?: string
}

export function RepublishDialog({
  isOpen,
  onClose,
  sourceQueue,
  initialMessage,
  defaultTargetQueue = 'email-queue',
}: RepublishDialogProps) {
  const { isDarkMode } = useAdminTheme()
  const [targetQueue, setTargetQueue] = useState(defaultTargetQueue)
  const [payload, setPayload] = useState('')
  const [contentType, setContentType] = useState('application/json')

  const republish = useRepublishMessage(sourceQueue)

  useEffect(() => {
    if (!isOpen) return
    // Run in microtask to avoid direct setState-in-effect lint violation
    const id = setTimeout(() => {
      setTargetQueue(defaultTargetQueue)
      if (initialMessage) {
        setPayload(tryPretty(initialMessage.payload))
        const ct = initialMessage.properties?.['content_type']
        if (typeof ct === 'string') setContentType(ct)
      } else {
        setPayload('')
      }
    }, 0)
    return () => clearTimeout(id)
  }, [isOpen, initialMessage, defaultTargetQueue])

  const inputClass = `w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 ${
    isDarkMode
      ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-600 focus:border-violet-500 focus:ring-violet-500/20'
      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-violet-500/20'
  }`

  const disabled =
    !sourceQueue || !targetQueue || !payload || republish.isPending

  const handleSubmit = () => {
    if (disabled) return
    republish.mutate(
      { targetQueue, payload, contentType },
      {
        onSuccess: () => {
          onClose()
        },
      },
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mesajı Yeniden Publish Et"
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <label
            className={`mb-1 block text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
          >
            Kaynak Queue
          </label>
          <input
            type="text"
            value={sourceQueue ?? ''}
            readOnly
            className={`${inputClass} cursor-not-allowed opacity-60`}
          />
        </div>
        <div>
          <label
            className={`mb-1 block text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
          >
            Hedef Queue
          </label>
          <input
            type="text"
            value={targetQueue}
            onChange={e => setTargetQueue(e.target.value)}
            className={inputClass}
            placeholder="email-queue"
          />
        </div>
        <div>
          <label
            className={`mb-1 block text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
          >
            Content Type
          </label>
          <input
            type="text"
            value={contentType}
            onChange={e => setContentType(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label
            className={`mb-1 block text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
          >
            Payload
          </label>
          <textarea
            value={payload}
            onChange={e => setPayload(e.target.value)}
            rows={10}
            className={`${inputClass} font-mono text-xs`}
            placeholder='{ "to": "test@example.com", "subject": "..." }'
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={republish.isPending}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled}
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
          >
            {republish.isPending ? 'Gönderiliyor…' : 'Publish Et'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function tryPretty(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}
