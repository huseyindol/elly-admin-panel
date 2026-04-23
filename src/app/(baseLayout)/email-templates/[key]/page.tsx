'use client'

import Link from 'next/link'
import { use } from 'react'
import { useAdminTheme } from '@/app/_hooks'
import {
  useDeleteEmailTemplate,
  useEmailTemplate,
  useUpdateEmailTemplate,
} from '@/app/_hooks/useEmailTemplates'
import { DestructiveConfirmDialog } from '@/app/_components'
import type { EmailTemplateFormValues } from '@/schemas/emailTemplateSchema'
import { useState } from 'react'
import { TemplateForm } from '../_components/TemplateForm'

interface PageProps {
  params: Promise<{ key: string }>
}

export default function EditEmailTemplatePage({ params }: PageProps) {
  const { key } = use(params)
  const { isDarkMode } = useAdminTheme()
  const { data, isLoading } = useEmailTemplate(key)
  const updateTemplate = useUpdateEmailTemplate(key)
  const deleteTemplate = useDeleteEmailTemplate()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleSubmit = (values: EmailTemplateFormValues) => {
    if (!data) return
    updateTemplate.mutate({
      subject: values.subject,
      htmlBody: values.htmlBody,
      description: values.description ?? null,
      active: values.active,
      optimisticLockVersion: data.optimisticLockVersion,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-[600px] w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <p
          className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          Template bulunamadı.{' '}
          <Link
            href="/email-templates"
            className="text-violet-500 hover:underline"
          >
            Listeye dön
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center gap-3">
        <Link
          href="/email-templates"
          className={`rounded-lg p-2 transition-colors ${
            isDarkMode
              ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          ← Geri
        </Link>
        <div className="flex-1">
          <h1 className="font-mono text-xl font-bold text-gray-900 dark:text-white">
            {key}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            v{data.version}
            {data.tenantId && ` · tenant: ${data.tenantId}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-500/20"
        >
          Sil
        </button>
      </header>

      <TemplateForm
        defaultValues={{
          templateKey: data.templateKey,
          subject: data.subject,
          htmlBody: data.htmlBody,
          description: data.description,
          active: data.active,
        }}
        templateKey={key}
        isEdit
        onSubmit={handleSubmit}
        isLoading={updateTemplate.isPending}
      />

      <DestructiveConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteTemplate.mutate(key, {
            onSuccess: () => setDeleteOpen(false),
          })
        }}
        title="Template Sil"
        description={
          <>
            <strong className="font-mono">{key}</strong> template&apos;i kalıcı
            olarak silinecek.
          </>
        }
        expectedText={key}
        confirmText="Template'i Sil"
        isLoading={deleteTemplate.isPending}
      />
    </div>
  )
}
