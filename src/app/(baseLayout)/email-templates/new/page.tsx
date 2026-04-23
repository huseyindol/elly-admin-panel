'use client'

import Link from 'next/link'
import { useAdminTheme } from '@/app/_hooks'
import { useCreateEmailTemplate } from '@/app/_hooks/useEmailTemplates'
import type { EmailTemplateFormValues } from '@/schemas/emailTemplateSchema'
import { TemplateForm } from '../_components/TemplateForm'

export default function NewEmailTemplatePage() {
  const { isDarkMode } = useAdminTheme()
  const createTemplate = useCreateEmailTemplate()

  const handleSubmit = (values: EmailTemplateFormValues) => {
    createTemplate.mutate({
      templateKey: values.templateKey,
      subject: values.subject,
      htmlBody: values.htmlBody,
      description: values.description ?? null,
      active: values.active,
    })
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Yeni Template Oluştur
          </h1>
        </div>
      </header>

      <TemplateForm
        onSubmit={handleSubmit}
        isLoading={createTemplate.isPending}
      />
    </div>
  )
}
