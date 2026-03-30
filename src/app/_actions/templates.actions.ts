'use server'

import { CookieEnum } from '@/utils/constant/cookieConstant'
import { cookies } from 'next/headers'

export type TemplateOption = {
  value: string
  label: string
}

const FALLBACK: TemplateOption[] = [{ value: '', label: 'Template Seçin' }]

async function getTemplatesFromDir(dirName: string): Promise<TemplateOption[]> {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get(CookieEnum.TENANT_ID)?.value

  if (!tenantId) return FALLBACK

  const siteUrl = process.env[`${tenantId.toUpperCase()}_SITE_URL`]
  if (!siteUrl) return FALLBACK

  try {
    const res = await fetch(`${siteUrl}/api/templates?type=${dirName}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return FALLBACK
    const data: TemplateOption[] = await res.json()
    return data
  } catch {
    return FALLBACK
  }
}

export async function getPageTemplates() {
  return getTemplatesFromDir('pages')
}

export async function getComponentTemplates() {
  return getTemplatesFromDir('components')
}

export async function getPostTemplates() {
  return getTemplatesFromDir('posts')
}

export async function getWidgetTemplates() {
  return getTemplatesFromDir('widgets')
}
