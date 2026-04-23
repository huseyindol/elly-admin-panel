'use client'

import { useQuery } from '@tanstack/react-query'
import { getEmailClasspathTemplatesService } from '../_services/email-templates.services'

export const emailTemplatesKeys = {
  all: ['email-templates'] as const,
  classpath: () => [...emailTemplatesKeys.all, 'classpath'] as const,
}

/**
 * Classpath'teki Thymeleaf template isimlerini döndürür.
 * GET /api/v1/emails/templates → string[]
 */
export function useEmailClasspathTemplates() {
  return useQuery({
    queryKey: emailTemplatesKeys.classpath(),
    queryFn: getEmailClasspathTemplatesService,
    staleTime: 60_000,
  })
}
