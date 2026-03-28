'use server'

import fs from 'node:fs'
import path from 'node:path'

export type TemplateOption = {
  value: string
  label: string
}

const DYNAMIC_COMPONENTS_PATH = path.join(
  process.cwd(),
  'src/components/dynamic',
)

async function getTemplatesFromDir(dirName: string): Promise<TemplateOption[]> {
  const dirPath = path.join(DYNAMIC_COMPONENTS_PATH, dirName)

  if (!fs.existsSync(dirPath)) {
    return [{ value: '', label: 'Template Seçin' }]
  }

  try {
    const files = fs.readdirSync(dirPath)
    const templates: TemplateOption[] = [{ value: '', label: 'Template Seçin' }]

    files
      .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'))
      .filter(file => !file.startsWith('index'))
      .forEach(file => {
        const name = file.replace(/\.(tsx|ts)$/, '')
        templates.push({ value: name, label: name })
      })

    return templates
  } catch {
    return [{ value: '', label: 'Template Seçin' }]
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
