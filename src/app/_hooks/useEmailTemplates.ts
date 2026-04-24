'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/api-error'
import type {
  EmailTemplateCreateRequest,
  EmailTemplatePreviewRequest,
  EmailTemplateUpdateRequest,
} from '@/types/cms'
import {
  createEmailTemplateService,
  deleteEmailTemplateService,
  getEmailClasspathTemplatesService,
  getEmailTemplateService,
  getEmailTemplatesService,
  previewEmailTemplateService,
  updateEmailTemplateService,
} from '../_services/email-templates.services'

export const emailTemplatesKeys = {
  all: ['email-templates'] as const,
  list: (params?: { page?: number; size?: number }) =>
    [...emailTemplatesKeys.all, 'list', params] as const,
  detail: (key: string) => [...emailTemplatesKeys.all, 'detail', key] as const,
  classpath: () => [...emailTemplatesKeys.all, 'classpath'] as const,
}

export function useEmailTemplates(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: emailTemplatesKeys.list({ page, size }),
    queryFn: () => getEmailTemplatesService(page, size),
    staleTime: 30_000,
  })
}

export function useEmailTemplate(key: string | null) {
  return useQuery({
    queryKey: emailTemplatesKeys.detail(key ?? ''),
    queryFn: () => getEmailTemplateService(key as string),
    enabled: !!key,
    staleTime: 30_000,
  })
}

export function useEmailClasspathTemplates() {
  return useQuery({
    queryKey: emailTemplatesKeys.classpath(),
    queryFn: getEmailClasspathTemplatesService,
    staleTime: 60_000,
  })
}

export function useCreateEmailTemplate() {
  const qc = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: (data: EmailTemplateCreateRequest) =>
      createEmailTemplateService(data),
    onSuccess: result => {
      qc.invalidateQueries({ queryKey: emailTemplatesKeys.all })
      toast.success('Template oluşturuldu')
      router.push(`/email-templates/${result.templateKey}`)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Template oluşturulamadı')
    },
  })
}

export function useUpdateEmailTemplate(key: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: EmailTemplateUpdateRequest) =>
      updateEmailTemplateService(key, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: emailTemplatesKeys.all })
      toast.success('Template güncellendi')
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.isConflict) {
        toast.error(
          "Başka biri bu template'i güncellemiş. Sayfayı yenileyip tekrar dene.",
        )
        return
      }
      toast.error(err.message || 'Template güncellenemedi')
    },
  })
}

export function useDeleteEmailTemplate() {
  const qc = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: (key: string) => deleteEmailTemplateService(key),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: emailTemplatesKeys.all })
      toast.success('Template silindi')
      router.push('/email-templates')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Template silinemedi')
    },
  })
}

export function usePreviewEmailTemplate(key: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EmailTemplatePreviewRequest) => {
      if (!key) throw new Error('Template key gerekli')
      return previewEmailTemplateService(key, body)
    },
    mutationKey: ['preview', key],
    onSuccess: data => {
      qc.setQueryData(['email-templates', 'preview', key], data)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Önizleme alınamadı')
    },
  })
}
