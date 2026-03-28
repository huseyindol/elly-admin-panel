#!/usr/bin/env node
/**
 * Script to generate static template constants from components/dynamic directories
 *
 * Bu script artık opsiyoneldir. Template'ler Server Action ile dinamik olarak yükleniyor.
 * Ancak build-time statik liste oluşturmak isterseniz kullanabilirsiniz.
 *
 * Kullanım: bun scripts/generate-templates.ts
 */

import fs from 'node:fs'
import path from 'node:path'

const DYNAMIC_COMPONENTS_PATH = path.join(
  process.cwd(),
  'src/components/dynamic',
)

const OUTPUT_PATH = path.join(process.cwd(), 'src/app/_constants/templates.ts')

type TemplateOption = {
  value: string
  label: string
}

function getTemplatesFromDir(dirName: string): TemplateOption[] {
  const dirPath = path.join(DYNAMIC_COMPONENTS_PATH, dirName)

  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Directory not found: ${dirPath}`)
    return [{ value: '', label: 'Template Seçin' }]
  }

  try {
    const files = fs.readdirSync(dirPath)
    const templates: TemplateOption[] = [{ value: '', label: 'Template Seçin' }]

    files
      .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'))
      .filter(file => !file.startsWith('index'))
      .sort()
      .forEach(file => {
        const name = file.replace(/\.(tsx|ts)$/, '')
        templates.push({ value: name, label: name })
      })

    return templates
  } catch (err) {
    console.error(`❌ Error reading directory ${dirPath}:`, err)
    return [{ value: '', label: 'Template Seçin' }]
  }
}

function generateTemplatesFile() {
  console.log('🔄 Generating templates.ts...\n')

  const pageTemplates = getTemplatesFromDir('pages')
  const componentTemplates = getTemplatesFromDir('components')
  const postTemplates = getTemplatesFromDir('posts')
  const widgetTemplates = getTemplatesFromDir('widgets')

  const content = `// Auto-generated file - do not edit manually
// Generated at: ${new Date().toISOString()}
// Run: bun scripts/generate-templates.ts

export type TemplateOption = {
  value: string
  label: string
}

export const PAGE_TEMPLATES: TemplateOption[] = ${JSON.stringify(pageTemplates, null, 2)}

export const COMPONENT_TEMPLATES: TemplateOption[] = ${JSON.stringify(componentTemplates, null, 2)}

export const POST_TEMPLATES: TemplateOption[] = ${JSON.stringify(postTemplates, null, 2)}

export const WIDGET_TEMPLATES: TemplateOption[] = ${JSON.stringify(widgetTemplates, null, 2)}
`

  fs.writeFileSync(OUTPUT_PATH, content)

  console.log('✅ Generated templates.ts successfully!')
  console.log(`   📄 Pages:      ${pageTemplates.length - 1} templates`)
  console.log(`   🧩 Components: ${componentTemplates.length - 1} templates`)
  console.log(`   📝 Posts:      ${postTemplates.length - 1} templates`)
  console.log(`   📦 Widgets:    ${widgetTemplates.length - 1} templates`)
  console.log(`\n   Output: ${OUTPUT_PATH}`)
}

generateTemplatesFile()
