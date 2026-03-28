'use client'

import { useQuery } from '@tanstack/react-query'
import {
  TemplateOption,
  getComponentTemplates,
  getPageTemplates,
  getPostTemplates,
  getWidgetTemplates,
} from '../_actions/templates.actions'

type TemplateType = 'pages' | 'components' | 'posts' | 'widgets'

const templateActions = {
  pages: getPageTemplates,
  components: getComponentTemplates,
  posts: getPostTemplates,
  widgets: getWidgetTemplates,
}

export function useTemplates(type: TemplateType) {
  const { data: templates = [], isLoading } = useQuery<TemplateOption[]>({
    queryKey: ['templates', type],
    queryFn: () => templateActions[type](),
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    gcTime: 10 * 60 * 1000, // 10 dakika garbage collection
  })

  return { templates, isLoading }
}
