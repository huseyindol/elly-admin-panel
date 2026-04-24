'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Column, DataTable, DestructiveConfirmDialog } from '@/app/_components'
import { useAdminTheme, usePermission } from '@/app/_hooks'
import {
  useDeleteEmailTemplate,
  useEmailTemplates,
} from '@/app/_hooks/useEmailTemplates'
import { formatAbsoluteTime } from '@/app/_utils/dateUtils'
import { Permissions, type EmailTemplate } from '@/types/cms'

export function TemplateListTable() {
  const { isDarkMode } = useAdminTheme()
  const canManage = usePermission(Permissions.EMAIL_TEMPLATES_MANAGE)
  const { data, isLoading, isError, error } = useEmailTemplates()
  const deleteTemplate = useDeleteEmailTemplate()

  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null)

  const templates = useMemo(() => data?.content ?? [], [data])

  const columns = useMemo<Column<EmailTemplate>[]>(
    () => [
      {
        key: 'templateKey',
        header: 'Template Key',
        render: t => <span className="font-mono text-sm">{t.templateKey}</span>,
      },
      {
        key: 'subject',
        header: 'Konu',
        render: t => (
          <span className="block max-w-xs truncate text-sm">{t.subject}</span>
        ),
      },
      {
        key: 'active',
        header: 'Durum',
        width: '90px',
        render: t => (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              t.active
                ? isDarkMode
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-emerald-50 text-emerald-700'
                : isDarkMode
                  ? 'bg-slate-700 text-slate-400'
                  : 'bg-gray-100 text-gray-500'
            }`}
          >
            {t.active ? 'Aktif' : 'Pasif'}
          </span>
        ),
      },
      {
        key: 'updatedAt',
        header: 'Güncelleme',
        width: '160px',
        render: t => (
          <span
            className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
          >
            {formatAbsoluteTime(t.updatedAt ?? t.createdAt ?? null)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        width: '130px',
        render: t => (
          <div
            className="flex justify-end gap-1"
            onClick={e => e.stopPropagation()}
          >
            <Link
              href={`/email-templates/${t.templateKey}`}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                isDarkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Düzenle
            </Link>
            {canManage && (
              <button
                type="button"
                onClick={() => setDeleteTarget(t)}
                className="rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-500/20"
              >
                Sil
              </button>
            )}
          </div>
        ),
      },
    ],
    [isDarkMode, canManage],
  )

  if (isError) {
    return (
      <div
        className={`rounded-xl p-4 text-sm ${
          isDarkMode
            ? 'border border-rose-500/40 bg-rose-500/10 text-rose-300'
            : 'border border-rose-200 bg-rose-50 text-rose-700'
        }`}
      >
        Template listesi alınamadı: {(error as Error)?.message}
      </div>
    )
  }

  return (
    <>
      <DataTable
        data={templates}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={t => t.templateKey}
        emptyMessage="Henüz email template yok"
      />

      <DestructiveConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteTemplate.mutate(deleteTarget.templateKey, {
              onSuccess: () => setDeleteTarget(null),
            })
          }
        }}
        title="Template Sil"
        description={
          deleteTarget ? (
            <>
              <strong className="font-mono">{deleteTarget.templateKey}</strong>{' '}
              template&apos;i kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </>
          ) : null
        }
        expectedText={deleteTarget?.templateKey ?? ''}
        confirmText="Template'i Sil"
        isLoading={deleteTemplate.isPending}
      />
    </>
  )
}
