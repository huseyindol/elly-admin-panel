import { z } from 'zod'

// Request body for revalidate operations
export const RevalidateRequest = z.object({
  tag: z.string().optional().describe('Cache tag to revalidate'),
  path: z.string().optional().describe('Path to revalidate'),
  type: z.enum(['page', 'layout']).optional().describe('Type of revalidation'),
  secret: z.string().optional().describe('Authorization secret'),
})

// Revalidate success response
export const RevalidateResponse = z.object({
  ok: z.boolean().describe('Operation success status'),
  revalidated: z
    .array(z.string())
    .optional()
    .describe('List of revalidated items'),
})

// Revalidate error response
export const RevalidateErrorResponse = z.object({
  ok: z.boolean().describe('Operation success status'),
  error: z.string().describe('Error message'),
})

// Export types for use in components
export type RevalidateRequestType = z.infer<typeof RevalidateRequest>
export type RevalidateResponseType = z.infer<typeof RevalidateResponse>
export type RevalidateErrorResponseType = z.infer<
  typeof RevalidateErrorResponse
>
