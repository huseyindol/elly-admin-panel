'use client'

import {
  Column,
  ConfirmDialog,
  DataTable,
  SearchInput,
  StatusBadge,
} from '@/app/(admin)/admin/_components'
import { useAdminTheme, useDebounce } from '@/app/(admin)/admin/_hooks'
import {
  deletePostService,
  getPostService,
} from '@/app/(admin)/admin/_services/posts.services'
import { Post } from '@/types/BaseResponse'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PostsListPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isDarkMode } = useAdminTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null)

  // Fetch posts - 5 dakika cache
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => getPostService(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePostService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      setDeleteTarget(null)
    },
    onError: error => {
      console.error('Delete error:', error)
    },
  })

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Filter posts based on search
  const filteredPosts =
    data?.data
      ?.filter(
        post =>
          post.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          post.slug.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)) || []

  const columns: Column<Post>[] = [
    {
      key: 'title',
      header: 'Başlık',
      render: post => (
        <div>
          <p
            className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {post.title}
          </p>
          <p
            className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
          >
            /{post.slug}
          </p>
        </div>
      ),
    },
    {
      key: 'orderIndex',
      header: 'Sıra',
      render: post => (
        <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          {post.orderIndex}
        </span>
      ),
    },
    {
      key: 'seoInfo',
      header: 'SEO',
      render: post => (
        <div className="flex items-center gap-2">
          {post.seoInfo?.noIndex ? (
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
              noindex
            </span>
          ) : (
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
              index
            </span>
          )}
          {post.seoInfo?.noFollow ? (
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
              nofollow
            </span>
          ) : (
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
              follow
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      render: post => <StatusBadge status={post.status} />,
    },
  ]

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id)
  }

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Postlar
            </h1>
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
              Tüm postları yönetin
            </p>
          </div>

          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40"
          >
            <span className="text-lg">+</span>
            <span>Yeni Post</span>
          </Link>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Post ara..."
          />
        </div>

        {/* Data Table */}
        {isError ? (
          <div
            className={`rounded-xl p-4 ${
              isDarkMode
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            Hata: {error?.message || 'Postlar yüklenirken bir hata oluştu'}
          </div>
        ) : (
          <DataTable
            data={filteredPosts as Post[]}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={post => post.id}
            emptyMessage="Post bulunamadı"
            actions={{
              onEdit: post => router.push(`/admin/posts/${post.id}/edit`),
              onDelete: post => setDeleteTarget(post),
            }}
          />
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Postu Sil"
        message={`"${deleteTarget?.title}" postunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
