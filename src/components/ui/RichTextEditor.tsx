'use client'

import { useAdminTheme } from '@/app/_hooks'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
  isDarkMode: boolean
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
  isDarkMode,
}: ToolbarButtonProps) {
  const base =
    'rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-40'
  const active = isDarkMode
    ? 'bg-violet-600 text-white'
    : 'bg-violet-500 text-white'
  const inactive = isDarkMode
    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={e => {
        e.preventDefault()
        onClick()
      }}
      className={`${base} ${isActive ? active : inactive}`}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'İçerik yazın...',
  minHeight = '200px',
}: RichTextEditorProps) {
  const { isDarkMode } = useAdminTheme()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'outline-none prose max-w-none',
        style: `min-height: ${minHeight}; padding: 12px 16px;`,
        'data-placeholder': placeholder,
      },
    },
    onUpdate({ editor: ed }: { editor: Editor }) {
      const html = ed.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    },
    immediatelyRender: false,
  })

  // Sync external value changes (e.g., AI-generated content)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const incoming = value || ''
    if (current !== incoming) {
      editor.commands.setContent(incoming)
    }
  }, [value, editor])

  const editorWrapClass = isDarkMode
    ? 'border border-slate-700/50 bg-slate-800/50 text-white rounded-xl overflow-hidden focus-within:border-violet-500 transition-colors'
    : 'border border-gray-200 bg-white text-gray-900 rounded-xl overflow-hidden focus-within:border-violet-500 transition-colors'

  const toolbarClass = isDarkMode
    ? 'flex flex-wrap gap-1 border-b border-slate-700/50 bg-slate-900/60 px-3 py-2'
    : 'flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 px-3 py-2'

  if (!editor) return null

  return (
    <div className={editorWrapClass}>
      {/* Toolbar */}
      <div className={toolbarClass}>
        {/* Headings */}
        <ToolbarButton
          isDarkMode={isDarkMode}
          title="Başlık 1"
          isActive={editor.isActive('heading', { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          isDarkMode={isDarkMode}
          title="Başlık 2"
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          isDarkMode={isDarkMode}
          title="Başlık 3"
          isActive={editor.isActive('heading', { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          H3
        </ToolbarButton>

        <span
          className={`mx-1 w-px self-stretch ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`}
        />

        {/* Text formatting */}
        <ToolbarButton
          isDarkMode={isDarkMode}
          title="Kalın"
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          isDarkMode={isDarkMode}
          title="İtalik"
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          isDarkMode={isDarkMode}
          title="Üstü çizili"
          isActive={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <s>S</s>
        </ToolbarButton>
        <ToolbarButton
          isDarkMode={isDarkMode}
          title="Kod"
          isActive={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          {'</>'}
        </ToolbarButton>

        <span
          className={`mx-1 w-px self-stretch ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`}
        />

        {/* Lists */}
        <ToolbarButton
          isDarkMode={isDarkMode}
          title="Madde listesi"
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          isDarkMode={isDarkMode}
          title="Numaralı liste"
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolbarButton>
        <ToolbarButton
          isDarkMode={isDarkMode}
          title="Alıntı"
          isActive={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          ❝
        </ToolbarButton>

        <span
          className={`mx-1 w-px self-stretch ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`}
        />

        {/* History */}
        <ToolbarButton
          isDarkMode={isDarkMode}
          title="Geri al"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          ↩
        </ToolbarButton>
        <ToolbarButton
          isDarkMode={isDarkMode}
          title="Yinele"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          ↪
        </ToolbarButton>
      </div>

      {/* Editor area with prose styles */}
      <style>{`
        .tiptap-editor [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: ${isDarkMode ? '#64748b' : '#9ca3af'};
          pointer-events: none;
          position: absolute;
        }
        .tiptap-editor .ProseMirror { position: relative; }
        .tiptap-editor h1 { font-size: 1.75rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
        .tiptap-editor h2 { font-size: 1.4rem; font-weight: 600; margin: 0.65rem 0 0.4rem; }
        .tiptap-editor h3 { font-size: 1.15rem; font-weight: 600; margin: 0.5rem 0 0.3rem; }
        .tiptap-editor p { margin: 0.4rem 0; line-height: 1.7; }
        .tiptap-editor ul { list-style: disc; padding-left: 1.5rem; margin: 0.4rem 0; }
        .tiptap-editor ol { list-style: decimal; padding-left: 1.5rem; margin: 0.4rem 0; }
        .tiptap-editor li { margin: 0.2rem 0; }
        .tiptap-editor blockquote { border-left: 3px solid #7c3aed; padding-left: 1rem; margin: 0.5rem 0; opacity: 0.85; }
        .tiptap-editor code { background: ${isDarkMode ? '#1e293b' : '#f1f5f9'}; border-radius: 4px; padding: 2px 5px; font-size: 0.875em; }
        .tiptap-editor strong { font-weight: 700; }
        .tiptap-editor em { font-style: italic; }
      `}</style>
      <div className="tiptap-editor text-sm">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
