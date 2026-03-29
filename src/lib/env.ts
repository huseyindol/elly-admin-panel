import { z } from 'zod'

/**
 * Environment Variables Schema
 * Define and validate all environment variables used in the application
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Next.js Configuration
  NEXT_PUBLIC_HOST: z
    .string()
    .url()
    .optional()
    .default('http://localhost:3000'),

  // API Configuration
  NEXT_PUBLIC_API: z.string().optional(),

  // Revalidation
  NEXT_PUBLIC_REVALIDATE_SECRET: z
    .string()
    .optional()
    .refine(val => !val || val === '' || val.length >= 6, {
      message: 'Secret must be at least 6 characters or empty',
    }),

  // Gemini AI
  GEMINI_API_KEY: z.string().optional(),

  // Vercel
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
})

/**
 * Type inference for environment variables
 */
export type Env = z.infer<typeof envSchema>

/**
 * Validate environment variables
 * Throws an error if validation fails
 */
function validateEnv(): Env {
  try {
    const parsed = envSchema.safeParse(process.env)

    if (!parsed.success) {
      console.error('❌ Invalid environment variables:')
      console.error(JSON.stringify(parsed.error.format(), null, 2))

      // In development, show detailed errors
      if (process.env.NODE_ENV === 'development') {
        const missingVars = parsed.error.issues
          .map(err => `  - ${err.path.join('.')}: ${err.message}`)
          .join('\n')

        throw new Error(
          `\n\n❌ Environment validation failed:\n\n${missingVars}\n\nPlease check your .env file.\n`,
        )
      }

      throw new Error('❌ Invalid environment variables. Check server logs.')
    }

    return parsed.data
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation error:', error.issues)
    }
    throw error
  }
}

/**
 * Validated environment variables
 * Use this throughout your application instead of process.env
 */
export const env = validateEnv()

/**
 * Check if a required environment variable is set
 */
export function requireEnv(key: keyof Env, errorMessage?: string): string {
  const value = env[key]

  if (!value) {
    throw new Error(
      errorMessage || `Required environment variable ${key} is not set`,
    )
  }

  return String(value)
}

/**
 * Get environment variable with fallback
 */
export function getEnv(key: keyof Env, fallback: string): string {
  const value = env[key]
  return value ? String(value) : fallback
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development'
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return env.NODE_ENV === 'test'
}

/**
 * Get base URL for the application
 */
export function getBaseUrl(): string {
  // In Vercel, use VERCEL_URL
  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`
  }

  // Otherwise use NEXT_PUBLIC_HOST
  return env.NEXT_PUBLIC_HOST || 'http://localhost:3000'
}

/**
 * Print environment info (development only)
 */
export function printEnvInfo(): void {
  if (!isDevelopment()) return

  console.log('\n=================================')
  console.log('Environment Configuration')
  console.log('=================================')
  console.log(`NODE_ENV: ${env.NODE_ENV}`)
  console.log(`Base URL: ${getBaseUrl()}`)
  console.log(
    `Revalidation: ${env.NEXT_PUBLIC_REVALIDATE_SECRET ? 'OK' : 'NOT SET'}`,
  )
  console.log('=================================\n')
}

// Print info on module load in development
if (isDevelopment() && typeof window === 'undefined') {
  printEnvInfo()
}
