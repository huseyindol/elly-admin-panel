'use server'

import { CookieEnum } from '@/utils/constant/cookieConstant'
import { cookies } from 'next/headers'

export type TemplateOption = {
  value: string
  label: string
}

/**
 * Cookie'deki tenantId'yi kullanarak env'den {TENANT_ID}_SITE_URL değerini bulur,
 * ardından o site'ın /api/templates?type={dirName} endpoint'ine istek atar.
 */
async function getTemplatesFromDir(dirName: string): Promise<TemplateOption[]> {
  const cookieStore = await cookies()
  const tenantId = cookieStore.get(CookieEnum.TENANT_ID)?.value

  if (!tenantId) return []

  // env'de {TENANT_ID}_SITE_URL anahtarını ara (ör: TENANT1_SITE_URL)
  const siteUrl = process.env[`${tenantId.toUpperCase()}_SITE_URL`]
  if (!siteUrl) return []

  try {
    console.log(`${siteUrl}/api/templates?type=${dirName}`)
    const res = await fetch(`${siteUrl}/api/templates?type=${dirName}`, {
      next: { revalidate: 3600 },
    })

    if (!res.ok) return []

    const data: TemplateOption[] = await res.json()
    return data
  } catch {
    return []
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
