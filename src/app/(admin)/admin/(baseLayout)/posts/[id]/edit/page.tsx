'use client'

import { useAdminTheme } from '@/app/(admin)/admin/_hooks'
import { useTemplates } from '@/app/(admin)/admin/_hooks/useTemplates'
import {
  getPostByIdService,
  updatePostService,
} from '@/app/(admin)/admin/_services/posts.services'
import { UpdatePostInput, UpdatePostSchema } from '@/schemas/post.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export default function EditPostPage() {
  const params = useParams()
  const postId = params.id as string
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()
  const [showSeo, setShowSeo] = useState(false)
  const { templates: postTemplates } = useTemplates('posts')

  // Fetch post data
  const {
    data: postData,
    isLoading: isPostLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostByIdService(postId),
    enabled: !!postId,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdatePostInput>({
    resolver: zodResolver(UpdatePostSchema),
    defaultValues: {
      title: '',
      content: '',
      slug: '',
      status: true,
      orderIndex: 0,
      template: '',
    },
  })

  // Populate form when data is loaded
  useEffect(() => {
    if (postData?.data) {
      const post = postData.data
      reset({
        title: post.title,
        content: post.content || '',
        slug: post.slug,
        status: post.status,
        orderIndex: post.orderIndex,
        template: post.template || '',
        seoInfo: post.seoInfo
          ? {
              title: post.seoInfo.title,
              description: post.seoInfo.description,
              keywords: post.seoInfo.keywords,
              canonicalUrl: post.seoInfo.canonicalUrl,
              noIndex: post.seoInfo.noIndex,
              noFollow: post.seoInfo.noFollow,
            }
          : undefined,
      })
    }
  }, [postData, reset])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdatePostInput) => updatePostService(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      toast.success('Post başarıyla güncellendi')
    },
    onError: error => {
      console.error('Update error:', error)
      toast.error('Güncelleme sırasında bir hata oluştu')
    },
  })

  const onSubmit = (data: UpdatePostInput) => {
    if (!isDirty) {
      toast.info('Herhangi bir değişiklik yapılmadı')
      return
    }
    updateMutation.mutate(data)
  }

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500'
  }`

  const labelClass = `block text-sm font-medium mb-2 ${
    isDarkMode ? 'text-slate-300' : 'text-gray-700'
  }`

  const errorClass = 'mt-1 text-xs text-rose-400'

  // Loading state
  if (isPostLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
            Post yükleniyor...
          </span>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div
          className={`rounded-xl p-4 ${
            isDarkMode
              ? 'bg-rose-500/20 text-rose-300'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          Hata: {error?.message || 'Post yüklenirken bir hata oluştu'}
        </div>
        <Link
          href="/admin/posts"
          className={`inline-flex items-center gap-2 text-sm ${
            isDarkMode ? 'text-violet-400' : 'text-violet-600'
          }`}
        >
          ← Postlara Dön
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/posts"
          className={`transition-colors hover:text-violet-400 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          Postlar
        </Link>
        <span className={isDarkMode ? 'text-slate-600' : 'text-gray-400'}>
          /
        </span>
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
          Düzenle: {postData?.data?.title}
        </span>
      </div>

      {/* Page Header */}
      <div>
        <h1
          className={`text-2xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Post Düzenle
        </h1>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          Post bilgilerini güncelleyin
        </p>
      </div>

      {/* Error Message */}
      {updateMutation.isError && (
        <div
          className={`rounded-xl p-4 ${
            isDarkMode
              ? 'bg-rose-500/20 text-rose-300'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          Hata:{' '}
          {updateMutation.error?.message ||
            'Post güncellenirken bir hata oluştu'}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div
          className={`rounded-2xl p-6 ${
            isDarkMode
              ? 'border border-slate-800/50 bg-slate-900/60'
              : 'border border-gray-200 bg-white'
          } backdrop-blur-sm`}
        >
          <h2
            className={`mb-4 text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Post Bilgileri
          </h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className={labelClass}>
                Başlık *
              </label>
              <input
                id="title"
                type="text"
                {...register('title')}
                className={inputClass}
                placeholder="Post başlığı"
              />
              {errors.title && (
                <p className={errorClass}>{errors.title.message}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className={labelClass}>
                Slug *
              </label>
              <input
                id="slug"
                type="text"
                {...register('slug')}
                className={inputClass}
                placeholder="post-slug"
              />
              {errors.slug && (
                <p className={errorClass}>{errors.slug.message}</p>
              )}
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className={labelClass}>
                İçerik
              </label>
              <textarea
                id="content"
                {...register('content')}
                rows={6}
                className={inputClass}
                placeholder="Post içeriği..."
              />
            </div>

            {/* Order Index */}
            <div>
              <label htmlFor="orderIndex" className={labelClass}>
                Sıra
              </label>
              <input
                id="orderIndex"
                type="number"
                {...register('orderIndex', { valueAsNumber: true })}
                className={inputClass}
                placeholder="0"
              />
            </div>

            {/* Template */}
            <div>
              <label htmlFor="template" className={labelClass}>
                Template
              </label>
              <select
                id="template"
                {...register('template')}
                className={inputClass}
              >
                <option value="">Template Seçin</option>
                {postTemplates
                  .filter(t => t.value !== '')
                  .map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
              </select>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <input
                id="status"
                type="checkbox"
                {...register('status')}
                className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
              />
              <label
                htmlFor="status"
                className={`text-sm ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-700'
                }`}
              >
                Aktif
              </label>
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div
          className={`rounded-2xl p-6 ${
            isDarkMode
              ? 'border border-slate-800/50 bg-slate-900/60'
              : 'border border-gray-200 bg-white'
          } backdrop-blur-sm`}
        >
          <button
            type="button"
            onClick={() => setShowSeo(!showSeo)}
            className="flex w-full items-center justify-between"
          >
            <h2
              className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              SEO Ayarları
            </h2>
            <span
              className={`transition-transform ${showSeo ? 'rotate-90' : ''}`}
            >
              →
            </span>
          </button>

          {showSeo && (
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="seoInfo.title" className={labelClass}>
                  SEO Başlığı
                </label>
                <input
                  id="seoInfo.title"
                  type="text"
                  {...register('seoInfo.title')}
                  className={inputClass}
                  placeholder="SEO başlığı"
                />
              </div>
              <div>
                <label htmlFor="seoInfo.description" className={labelClass}>
                  SEO Açıklaması
                </label>
                <textarea
                  id="seoInfo.description"
                  {...register('seoInfo.description')}
                  rows={2}
                  className={inputClass}
                  placeholder="SEO açıklaması"
                />
              </div>
              <div>
                <label htmlFor="seoInfo.keywords" className={labelClass}>
                  SEO Anahtar Kelimeleri
                </label>
                <input
                  id="seoInfo.keywords"
                  type="text"
                  {...register('seoInfo.keywords')}
                  className={inputClass}
                  placeholder="SEO anahtar kelimeleri"
                />
              </div>
              <div>
                <label htmlFor="seoInfo.canonicalUrl" className={labelClass}>
                  Canonical URL
                </label>
                <input
                  id="seoInfo.canonicalUrl"
                  type="text"
                  {...register('seoInfo.canonicalUrl')}
                  className={inputClass}
                  placeholder="Canonical URL"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    id="seoInfo.noIndex"
                    type="checkbox"
                    {...register('seoInfo.noIndex')}
                    className="h-4 w-4 rounded"
                  />
                  <label htmlFor="seoInfo.noIndex" className="text-sm">
                    noIndex
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="seoInfo.noFollow"
                    type="checkbox"
                    {...register('seoInfo.noFollow')}
                    className="h-4 w-4 rounded"
                  />
                  <label htmlFor="seoInfo.noFollow" className="text-sm">
                    noFollow
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/admin/posts"
            className={`flex-1 rounded-xl px-4 py-3 text-center text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Kaydediliyor...</span>
              </span>
            ) : (
              'Değişiklikleri Kaydet'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
