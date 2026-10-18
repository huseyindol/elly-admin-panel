'use client'

import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Monitor,
  Moon,
  Smartphone,
  Sun,
  X,
} from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'

export interface PostPreviewData {
  title?: string | null
  slug?: string | null
  content?: string | null
  description?: string | null
  category?: string | null
  coverImage?: string | null
  publishedAt?: string | null
  author?: string | null
  readingTime?: string | null
}

interface PostPreviewModalProps {
  open: boolean
  onClose: () => void
  post: PostPreviewData
  defaultDark?: boolean
}

type ViewportMode = 'desktop' | 'mobile'

const CATEGORY_COLORS_LIGHT: Record<string, string> = {
  Frontend: 'bg-blue-100 text-blue-700',
  Backend: 'bg-emerald-100 text-emerald-700',
  DevOps: 'bg-orange-100 text-orange-700',
  AI: 'bg-violet-100 text-violet-700',
  'Yapay Zeka': 'bg-violet-100 text-violet-700',
  Mobile: 'bg-pink-100 text-pink-700',
  Mobil: 'bg-pink-100 text-pink-700',
}

const CATEGORY_COLORS_DARK: Record<string, string> = {
  Frontend: 'bg-blue-900/30 text-blue-300',
  Backend: 'bg-emerald-900/30 text-emerald-300',
  DevOps: 'bg-orange-900/30 text-orange-300',
  AI: 'bg-violet-900/30 text-violet-300',
  'Yapay Zeka': 'bg-violet-900/30 text-violet-300',
  Mobile: 'bg-pink-900/30 text-pink-300',
  Mobil: 'bg-pink-900/30 text-pink-300',
}

function isSafeUrl(url: string, allowMailTel = false): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true
  try {
    const parsed = new URL(trimmed)
    const allowed = ['http:', 'https:']
    if (allowMailTel) allowed.push('mailto:', 'tel:')
    return allowed.includes(parsed.protocol)
  } catch {
    return false
  }
}

export function estimateReadingTimeLabel(
  readingTime?: string | null,
  htmlContent?: string | null,
): string {
  const raw = readingTime?.trim()
  if (raw) {
    const lower = raw.toLowerCase()
    if (lower.includes('okuma')) return raw
    if (lower.includes('dk')) return `${raw} okuma`
    return `${raw} dk okuma`
  }
  const plain = (htmlContent ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!plain) return '1 dk okuma'
  const words = plain.split(' ').length
  return `${Math.max(1, Math.ceil(words / 200))} dk okuma`
}

export function formatPreviewDate(publishedAt?: string | null): string {
  const raw = publishedAt?.trim()
  const date = raw ? new Date(raw) : new Date()
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Converts HTML string into React elements styled identically to
 * `elly-tenant/src/components/html-content.tsx` without using dangerouslySetInnerHTML.
 */
function renderTenantHtml(
  html: string,
  isDark: boolean,
  isMobile: boolean,
): React.ReactNode {
  if (typeof window === 'undefined' || !html.trim()) {
    return null
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const headingColor = isDark ? 'text-white' : 'text-slate-900'
  const bodyColor = isDark ? 'text-slate-300' : 'text-slate-700'

  const convertNode = (node: ChildNode, key: string): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null
    }

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    const children = Array.from(el.childNodes).map((child, idx) =>
      convertNode(child, `${key}-${idx}`),
    )

    switch (tag) {
      case 'h1':
        return (
          <h1
            key={key}
            className={`mb-4 mt-8 font-extrabold tracking-tight ${
              isMobile ? 'text-2xl' : 'text-4xl'
            } ${headingColor}`}
          >
            {children}
          </h1>
        )
      case 'h2':
        return (
          <h2
            key={key}
            className={`mb-4 mt-8 font-bold tracking-tight ${
              isMobile ? 'text-xl' : 'text-3xl'
            } ${headingColor}`}
          >
            {children}
          </h2>
        )
      case 'h3':
        return (
          <h3
            key={key}
            className={`mb-3 mt-6 font-semibold tracking-tight ${
              isMobile ? 'text-lg' : 'text-2xl'
            } ${headingColor}`}
          >
            {children}
          </h3>
        )
      case 'h4':
      case 'h5':
      case 'h6':
        return (
          <h4
            key={key}
            className={`mb-2 mt-5 text-lg font-semibold ${headingColor}`}
          >
            {children}
          </h4>
        )
      case 'p':
        return (
          <p
            key={key}
            className={`mb-6 leading-relaxed ${
              isMobile ? 'text-base' : 'text-lg'
            } ${bodyColor}`}
          >
            {children}
          </p>
        )
      case 'strong':
      case 'b':
        return (
          <strong key={key} className={`font-semibold ${headingColor}`}>
            {children}
          </strong>
        )
      case 'em':
      case 'i':
        return (
          <em key={key} className="italic">
            {children}
          </em>
        )
      case 'u':
        return (
          <u key={key} className="underline underline-offset-4">
            {children}
          </u>
        )
      case 's':
      case 'del':
      case 'strike':
        return <del key={key}>{children}</del>
      case 'a': {
        const rawHref = el.getAttribute('href') ?? ''
        const safeHref = isSafeUrl(rawHref, true) ? rawHref : '#'
        return (
          <a
            key={key}
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-emerald-600 underline underline-offset-4 hover:text-emerald-500"
          >
            {children}
          </a>
        )
      }
      case 'ul':
        return (
          <ul
            key={key}
            className={`my-6 ml-6 list-disc space-y-2 ${
              isMobile ? 'text-base' : 'text-lg'
            } ${bodyColor}`}
          >
            {children}
          </ul>
        )
      case 'ol':
        return (
          <ol
            key={key}
            className={`my-6 ml-6 list-decimal space-y-2 ${
              isMobile ? 'text-base' : 'text-lg'
            } ${bodyColor}`}
          >
            {children}
          </ol>
        )
      case 'li':
        return (
          <li key={key} className="leading-relaxed [&>p]:mb-1">
            {children}
          </li>
        )
      case 'blockquote':
        return (
          <blockquote
            key={key}
            className={`my-6 border-l-4 border-emerald-500 pl-6 italic ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}
          >
            {children}
          </blockquote>
        )
      case 'pre':
        return (
          <pre
            key={key}
            className={`my-6 overflow-x-auto rounded-lg border p-4 font-mono text-sm text-slate-100 shadow-lg ${
              isDark
                ? 'border-slate-800 bg-slate-950'
                : 'border-slate-200 bg-slate-950'
            }`}
          >
            {children}
          </pre>
        )
      case 'code': {
        const isInsidePre = el.parentElement?.tagName.toLowerCase() === 'pre'
        if (isInsidePre) {
          return (
            <code key={key} className="font-mono text-sm text-slate-100">
              {children}
            </code>
          )
        }
        return (
          <code
            key={key}
            className={`rounded px-1.5 py-0.5 font-mono text-sm ${
              isDark
                ? 'bg-slate-800 text-emerald-400'
                : 'bg-slate-100 text-emerald-600'
            }`}
          >
            {children}
          </code>
        )
      }
      case 'img': {
        const src = el.getAttribute('src') ?? ''
        const alt = el.getAttribute('alt') || 'Makale görseli'
        if (!isSafeUrl(src)) return null
        return (
          <figure key={key} className="my-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-h-[480px] w-full rounded-xl object-cover shadow-md"
              loading="lazy"
            />
            {alt && alt !== 'Makale görseli' && (
              <figcaption
                className={`mt-2 text-center text-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {alt}
              </figcaption>
            )}
          </figure>
        )
      }
      case 'hr':
        return (
          <hr
            key={key}
            className={`my-8 border-t ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          />
        )
      case 'br':
        return <br key={key} />
      case 'table':
        return (
          <div
            key={key}
            className={`my-6 w-full overflow-x-auto rounded-lg border ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        )
      case 'thead':
        return (
          <thead
            key={key}
            className={isDark ? 'bg-slate-800/60' : 'bg-slate-100'}
          >
            {children}
          </thead>
        )
      case 'tbody':
        return <tbody key={key}>{children}</tbody>
      case 'tr':
        return (
          <tr
            key={key}
            className={`border-b last:border-0 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            {children}
          </tr>
        )
      case 'th':
        return (
          <th
            key={key}
            className={`px-4 py-3 text-left font-semibold ${headingColor}`}
          >
            {children}
          </th>
        )
      case 'td':
        return (
          <td key={key} className={`px-4 py-3 ${bodyColor}`}>
            {children}
          </td>
        )
      case 'script':
      case 'style':
      case 'iframe':
      case 'object':
      case 'embed':
        return null
      default:
        return <React.Fragment key={key}>{children}</React.Fragment>
    }
  }

  return Array.from(doc.body.childNodes).map((node, idx) =>
    convertNode(node, `node-${idx}`),
  )
}

export default function PostPreviewModal({
  open,
  onClose,
  post,
  defaultDark = true,
}: Readonly<PostPreviewModalProps>) {
  const [viewport, setViewport] = useState<ViewportMode>('desktop')
  const [themeOverride, setThemeOverride] = useState<boolean | null>(null)
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null)

  const previewDark = themeOverride ?? defaultDark

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const isMobile = viewport === 'mobile'
  const displayTitle = post.title?.trim() || 'Başlıksız Makale'
  const displaySlug = post.slug?.trim() || 'ornek-makale'
  const displayAuthor = post.author?.trim() || 'Hüseyin DOL'
  const displayCategory = post.category?.trim() || ''
  const displayDescription = post.description?.trim() || ''
  const rawCover = post.coverImage?.trim() ?? ''
  const imgFailed = failedCoverUrl !== null && failedCoverUrl === rawCover
  const displayCover =
    rawCover && isSafeUrl(rawCover) && !imgFailed ? rawCover : ''

  const formattedDate = useMemo(
    () => formatPreviewDate(post.publishedAt),
    [post.publishedAt],
  )
  const readingTimeLabel = useMemo(
    () => estimateReadingTimeLabel(post.readingTime, post.content),
    [post.readingTime, post.content],
  )

  const renderedHtml = useMemo(
    () => renderTenantHtml(post.content ?? '', previewDark, isMobile),
    [post.content, previewDark, isMobile],
  )

  const hasBody = useMemo(() => {
    const plain = (post.content ?? '').replace(/<[^>]+>/g, '').trim()
    return plain.length > 0
  }, [post.content])

  if (!open) return null

  const categoryBadgeClass = displayCategory
    ? previewDark
      ? (CATEGORY_COLORS_DARK[displayCategory] ?? 'bg-slate-800 text-slate-300')
      : (CATEGORY_COLORS_LIGHT[displayCategory] ??
        'bg-slate-100 text-slate-700')
    : ''

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Makale Canlı Önizleme"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-sm"
    >
      {/* Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3 text-white sm:px-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">
              Canlı Site Önizlemesi (elly-tenant)
            </h2>
            <p className="text-xs text-slate-400">
              Makalenin yayına alındığında masaüstü ve mobil web’de nasıl
              görüneceğini birebir inceleyin
            </p>
          </div>
        </div>

        {/* Viewport & Theme Controls */}
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Görünüm modu"
            className="inline-flex rounded-xl border border-slate-700 bg-slate-800/90 p-1"
          >
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                viewport === 'desktop'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Masaüstü</span>
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                viewport === 'mobile'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobil Web (390px)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setThemeOverride(!previewDark)}
            title={
              previewDark
                ? 'Açık site temasında görüntüle'
                : 'Koyu site temasında görüntüle'
            }
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
          >
            {previewDark ? (
              <>
                <Moon className="h-3.5 w-3.5 text-violet-400" />
                <span className="hidden sm:inline">Koyu Tema</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Açık Tema</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Önizlemeyi kapat"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <X className="h-4 w-4" />
            <span>Kapat</span>
          </button>
        </div>
      </div>

      {/* Preview Stage */}
      <div
        className="flex-1 overflow-y-auto p-3 sm:p-6"
        onClick={e => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          data-testid="post-preview-frame"
          data-viewport={viewport}
          className={`mx-auto transition-all duration-200 ${
            isMobile
              ? 'max-w-[390px] rounded-[36px] border-[8px] border-slate-800 shadow-2xl ring-1 ring-white/10'
              : 'max-w-5xl rounded-2xl border border-slate-800 shadow-2xl'
          } overflow-hidden ${
            previewDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'
          }`}
        >
          {/* Simulated Browser / Phone Address Bar */}
          <div
            className={`flex items-center justify-between border-b px-4 py-2 text-xs ${
              previewDark
                ? 'border-slate-800 bg-slate-900 text-slate-400'
                : 'border-slate-200 bg-slate-100 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div
              className={`flex max-w-[70%] items-center gap-1.5 truncate rounded-md px-3 py-1 font-mono text-[11px] ${
                previewDark
                  ? 'bg-slate-950/70 text-slate-300'
                  : 'bg-white text-slate-700'
              }`}
            >
              <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
              <span className="truncate">
                huseyindol.com/makaleler/{displaySlug}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider opacity-60">
              {isMobile ? '390px' : 'Desktop'}
            </span>
          </div>

          {/* Exact elly-tenant /makaleler/[slug] Layout */}
          <div
            className={
              previewDark
                ? 'min-h-[70vh] bg-slate-950 text-white'
                : 'min-h-[70vh] bg-white text-slate-900'
            }
          >
            {/* Cover Image Hero */}
            {displayCover ? (
              <div
                className={`relative w-full overflow-hidden ${
                  isMobile ? 'h-56' : 'h-72 md:h-96'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayCover}
                  alt={displayTitle}
                  onError={() => setFailedCoverUrl(rawCover)}
                  className="h-full w-full object-cover"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t to-transparent ${
                    previewDark
                      ? 'from-slate-950 via-slate-950/40'
                      : 'from-white via-white/40'
                  }`}
                />
              </div>
            ) : (
              <div className="h-24 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
            )}

            {/* Article Container */}
            <div
              className={`mx-auto pb-20 ${
                isMobile ? 'px-5' : 'container px-6'
              }`}
            >
              <article className="mx-auto max-w-3xl">
                {/* Back link */}
                <div className={isMobile ? 'mb-6 pt-6' : 'mb-8 pt-8'}>
                  <span
                    className={`inline-flex items-center gap-2 text-sm font-medium ${
                      previewDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Makalelere Dön
                  </span>
                </div>

                {/* Article Header */}
                <header
                  className={`${isMobile ? 'mb-8 space-y-4' : 'mb-12 space-y-5'}`}
                >
                  {displayCategory && (
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${categoryBadgeClass}`}
                    >
                      {displayCategory}
                    </span>
                  )}

                  <h1
                    className={`font-extrabold tracking-tight ${
                      isMobile
                        ? 'text-2xl leading-snug'
                        : 'text-3xl md:text-5xl'
                    } ${previewDark ? 'text-white' : 'text-slate-900'}`}
                  >
                    {displayTitle}
                  </h1>

                  {displayDescription && (
                    <p
                      className={`${
                        isMobile ? 'text-base' : 'text-lg'
                      } ${previewDark ? 'text-slate-400' : 'text-slate-600'}`}
                    >
                      {displayDescription}
                    </p>
                  )}

                  <div
                    className={`flex flex-wrap items-center gap-4 border-t pt-5 text-sm ${
                      previewDark
                        ? 'border-slate-800 text-slate-400'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-xs font-bold ring-2 ${
                          previewDark
                            ? 'bg-emerald-900/50 text-emerald-300 ring-slate-800'
                            : 'bg-emerald-100 text-emerald-700 ring-slate-200'
                        }`}
                      >
                        {displayAuthor.slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className={`font-semibold ${
                          previewDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {displayAuthor}
                      </span>
                    </div>

                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <time>{formattedDate}</time>
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{readingTimeLabel}</span>
                    </span>
                  </div>
                </header>

                {/* Article Body */}
                <div className="w-full max-w-none">
                  {hasBody ? (
                    renderedHtml
                  ) : (
                    <div
                      className={`rounded-xl border border-dashed p-8 text-center text-sm ${
                        previewDark
                          ? 'border-slate-800 text-slate-500'
                          : 'border-slate-300 text-slate-400'
                      }`}
                    >
                      Henüz makale içeriği girilmedi. İçerik alanına yazdığınız
                      veya AI ile oluşturduğunuz metin burada gerçek site
                      görünümüyle yer alacak.
                    </div>
                  )}
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
