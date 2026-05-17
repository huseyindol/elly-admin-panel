'use client'

import { useEffect, useRef, useState } from 'react'
import { useChatWsStore } from '@/stores/chat-ws-store'
import { uploadChatFileService } from '@/app/_services/chat.services'
import { useAdminTheme } from '@/app/_hooks'
import { Send, Paperclip, Loader2 } from 'lucide-react'

interface Props {
  groupId: string
}

export function ChatInput({ groupId }: Props) {
  const { isDarkMode } = useAdminTheme()
  const [content, setContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const { sendMessage, sendTyping } = useChatWsStore()
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Textarea otomatik yükseklik
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '0px'
    const next = Math.min(el.scrollHeight, 120)
    el.style.height = `${next}px`
  }, [content])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => sendTyping(groupId), 300)
  }

  const submit = () => {
    const trimmed = content.trim()
    if (!trimmed) return
    sendMessage(groupId, trimmed)
    setContent('')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fileUrl = await uploadChatFileService(file)
      sendMessage(groupId, fileUrl, 'FILE')
    } catch {
      // hata sessizce geçilir
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

  return (
    <div className="flex items-end gap-2">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
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
      />

      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Mesaj yaz..."
        rows={1}
        className={`flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm leading-5 outline-none transition-colors focus:ring-2 focus:ring-violet-500/30 ${
          isDarkMode
            ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-violet-500/50'
            : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-violet-300'
        }`}
        style={{ minHeight: '40px', maxHeight: '120px' }}
      />

      <button
        type="button"
        onClick={submit}
        disabled={!content.trim()}
        aria-label="Gönder"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  )
}
