'use client'

import Link from 'next/link'
import { use } from 'react'
import { useAdminTheme } from '@/app/_hooks'
import {
  useDeleteEmailTemplate,
  useEmailTemplate,
  useUpdateEmailTemplate,
} from '@/app/_hooks/useEmailTemplates'
import type { EmailTemplateUpdateValues } from '@/schemas/emailTemplateSchema'
import { PreviewPanel } from '../_components/PreviewPanel'
import { TemplateForm } from '../_components/TemplateForm'

export default function EmailTemplateDetailPage({
  params,
}: {
  params: Promise<{ key: string }>
}) {
  const { key } = use(params)
  const { isDarkMode } = useAdminTheme()

  const { data: template, isLoading, isError } = useEmailTemplate(key)
  const updateTemplate = useUpdateEmailTemplate(key)
  const deleteTemplate = useDeleteEmailTemplate()

  const handleUpdate = (values: EmailTemplateUpdateValues) => {
    updateTemplate.mutate(values)
  }

  const handleDelete = () => {
    if (
      confirm(
        `"${key}" template'ini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      )
    ) {
      deleteTemplate.mutate(key)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`h-12 animate-pulse rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}
          />
        ))}
      </div>
    )
  }

  if (isError || !template) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-400">
          Template yüklenemedi.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Breadcrumb + Delete */}
      <div className="flex items-center justify-between">
        <nav
          className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          <Link href="/email-templates" className="hover:underline">
            Email Templates
          </Link>
          <span>/</span>
          <span
            className={`font-mono ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}
          >
            {key}
          </span>
        </nav>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteTemplate.isPending}
          className="rounded-xl bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-500/20 disabled:opacity-60"
        >
          {deleteTemplate.isPending ? 'Siliniyor…' : 'Sil'}
        </button>
      </div>

      {/* Edit form */}
      <div
        className={`rounded-2xl border p-6 ${
          isDarkMode
            ? 'border-slate-700/50 bg-slate-900/50'
            : 'border-gray-200 bg-white'
        }`}
      >
        <h2
          className={`mb-6 text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Template Düzenle
        </h2>
        <TemplateForm
          mode="update"
          defaultValues={{
            templateKey: template.templateKey,
            subject: template.subject,
            description: template.description ?? null,
            active: template.active,
            htmlBody: template.htmlBody,
            optimisticLockVersion: template.optimisticLockVersion,
          }}
          onSubmit={handleUpdate}
          isLoading={updateTemplate.isPending}
        />
      </div>

      {/* Preview */}
      <div
        className={`rounded-2xl border p-6 ${
          isDarkMode
            ? 'border-slate-700/50 bg-slate-900/50'
            : 'border-gray-200 bg-white'
        }`}
      >
        <PreviewPanel templateKey={key} />
      </div>
    </div>
  )
}
