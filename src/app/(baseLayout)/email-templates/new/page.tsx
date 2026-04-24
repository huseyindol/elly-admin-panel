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
      {/* Breadcrumb */}
      <nav
        className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
      >
        <Link href="/email-templates" className="hover:underline">
          Email Templates
        </Link>
        <span>/</span>
        <span className={isDarkMode ? 'text-slate-200' : 'text-gray-900'}>
          Yeni Template
        </span>
      </nav>

      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Yeni Email Template
        </h1>
      </header>

      <div
        className={`rounded-2xl border p-6 ${
          isDarkMode
            ? 'border-slate-700/50 bg-slate-900/50'
            : 'border-gray-200 bg-white'
        }`}
      >
        <TemplateForm
          mode="create"
          onSubmit={handleSubmit}
          isLoading={createTemplate.isPending}
        />
      </div>
    </div>
  )
}
