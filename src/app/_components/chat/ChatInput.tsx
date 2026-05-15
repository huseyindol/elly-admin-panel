'use client'

import { useRef, useState } from 'react'
import { useChatWsStore } from '@/stores/chat-ws-store'
import { uploadChatFileService } from '@/app/_services/chat.services'
import { useAdminTheme } from '@/app/_hooks'
import { Send, Paperclip } from 'lucide-react'

interface Props {
  groupId: string
}

export function ChatInput({ groupId }: Props) {
  const { isDarkMode } = useAdminTheme()
  const [content, setContent] = useState('')
  const { sendMessage, sendTyping } = useChatWsStore()
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    const fileUrl = await uploadChatFileService(file)
    sendMessage(groupId, fileUrl, 'FILE')
    e.target.value = ''
  }

  return (
    <div className="flex items-end gap-2">
      <label className="cursor-pointer">
        <Paperclip
          className={`h-5 w-5 transition-colors ${
            isDarkMode
              ? 'text-slate-500 hover:text-slate-300'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        />
        <input type="file" className="hidden" onChange={handleFileChange} />
      </label>

      <textarea
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Mesaj yaz... (Enter: gönder, Shift+Enter: yeni satır)"
        rows={1}
        className={`flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-500/30 ${
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
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  )
}
