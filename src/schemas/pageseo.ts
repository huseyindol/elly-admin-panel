import { z } from 'zod'

// Create a new page SEO
export const CreatePageSEOBody = z.object({
  title: z.string().describe('Page SEO title'),
  description: z.string().describe('Page SEO description'),
  keywords: z.array(z.string()).describe('Page SEO keywords'),
  canonical: z.string().describe('Page SEO canonical'),
  noIndex: z.boolean().describe('Page SEO noIndex'),
  noFollow: z.boolean().describe('Page SEO noFollow'),
})

// Update a new page SEO
export const UpdatePageSEOBody = z.object({
  title: z.string().describe('Page SEO title'),
  description: z.string().describe('Page SEO description'),
  keywords: z.array(z.string()).describe('Page SEO keywords'),
  canonical: z.string().describe('Page SEO canonical'),
  noIndex: z.boolean().describe('Page SEO noIndex'),
  noFollow: z.boolean().describe('Page SEO noFollow'),
})

// Path Parameters for PageSEO by ID
export const PageSEOParams = z.object({
  id: z.string().describe('PageSEO ID'),
})
