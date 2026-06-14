'use client'

import { useEffect, useRef, useState } from 'react'
import {
  sendMessageService,
  uploadChatFileService,
} from '@/app/_services/chat.services'
import { useChatWsStore } from '@/stores/chat-ws-store'
import { useAdminTheme } from '@/app/_hooks'
import { ApiError } from '@/lib/api/api-error'
import { Send, Paperclip, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ChatMessageType } from '@/types/chat'

interface Props {
  groupId: string
  tenantId?: string | null
  canWrite: boolean
  banner?: string | null
  onWriteForbidden?: (message: string) => void
}

export function ChatInput({
  groupId,
  tenantId,
  canWrite,
  banner,
  onWriteForbidden,
}: Props) {
  const { isDarkMode } = useAdminTheme()
  const [content, setContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const { sendTyping, addMessage } = useChatWsStore()
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const disabled = !canWrite || sending || uploading

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '0px'
    const next = Math.min(el.scrollHeight, 120)
    el.style.height = `${next}px`
  }, [content])

  const handleSendError = (err: unknown) => {
    if (err instanceof ApiError && err.isForbidden) {
      const message = err.rawMessage ?? err.message ?? 'Mesaj gönderemezsiniz.'
      onWriteForbidden?.(message)
      toast.error(message)
      return
    }
    toast.error('Mesaj gönderilemedi.')
  }

  const sendPayload = async (
    payloadContent: string,
    contentType: ChatMessageType = 'TEXT',
  ) => {
    if (!canWrite) return
    // Bekleyen typing event'ini iptal et — gönderimden sonra geç bir
    // "typing:true" sızıp karşı tarafta "yazıyor"u yeniden tetiklemesin.
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current)
      typingTimeout.current = null
    }
    setSending(true)
    try {
      // REST yanıtı dolu içerikli mesajı döner → hemen ekle (optimistic).
      // WS echo'su aynı id ile gelirse dedup edilir (boş echo'yu da eler).
      const created = await sendMessageService(
        groupId,
        { content: payloadContent, contentType },
        tenantId,
      )
      addMessage(groupId, created)
    } catch (err) {
      handleSendError(err)
      throw err
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!canWrite) return
    setContent(e.target.value)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => sendTyping(groupId), 300)
  }

  const submit = async () => {
    const trimmed = content.trim()
    if (!trimmed || !canWrite || sending) return
    try {
      await sendPayload(trimmed)
      setContent('')
    } catch {
      // toast already shown
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !canWrite) return
    setUploading(true)
    try {
      const fileUrl = await uploadChatFileService(file, tenantId)
      await sendPayload(fileUrl, 'FILE')
    } catch (err) {
      if (!(err instanceof ApiError)) {
        toast.error('Dosya gönderilemedi.')
      }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const iconBtnClass = `inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
    isDarkMode
      ? 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
  } disabled:cursor-not-allowed disabled:opacity-50`

  const bannerText = banner?.trim() || null

  return (
    <div className="space-y-2">
      {bannerText && (
        <p
          className={`rounded-lg border px-3 py-2 text-xs ${
            isDarkMode
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
          role="status"
        >
          {bannerText}
        </p>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className={iconBtnClass}
          aria-label="Dosya ekle"
          title="Dosya ekle"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled}
        />

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={canWrite ? 'Mesaj yaz...' : 'Mesaj gönderemezsiniz'}
          rows={1}
          disabled={disabled}
          className={`flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm leading-5 outline-none transition-colors focus:ring-2 focus:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60 ${
            isDarkMode
              ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500/50'
              : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-violet-300'
          }`}
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />

        <button
          type="button"
          onClick={() => void submit()}
          disabled={disabled || !content.trim()}
          aria-label="Gönder"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}
