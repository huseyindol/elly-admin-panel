import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

type RevalidateBody = {
  tag?: string
  path?: string
  type?: 'page' | 'layout'
}

/**
 * Timing-safe comparison: fixed iteration count and no early exit, so the
 * response time does not leak the secret's length or content.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length)
  let diff = a.length === b.length ? 0 : 1
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}

function isAuthorized(request: Request): boolean {
  const configuredSecret = process.env.REVALIDATE_SECRET
  // Fail-closed: without a configured server-only secret, never authorize.
  if (!configuredSecret) return false

  const authHeader = request.headers.get('authorization') || ''
  if (!authHeader.startsWith('Bearer ')) return false
  return timingSafeEqual(authHeader.slice(7), configuredSecret)
}

/**
 * Revalidate cache by tag or path
 * @description Revalidates Next.js cache using revalidateTag or revalidatePath. Requires REVALIDATE_SECRET env and Authorization: Bearer <secret> header.
 * @body RevalidateRequest
 * @response RevalidateResponse:Successfully revalidated
 * @add 400:RevalidateErrorResponse:No tag or path provided
 * @add 401:RevalidateErrorResponse:Unauthorized
 * @add 500:RevalidateErrorResponse:Internal server error
 * @openapi
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RevalidateBody

    if (!isAuthorized(request)) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const actions: string[] = []

    if (body.tag) {
      revalidateTag(body.tag, { expire: 60 })
      actions.push(`tag:${body.tag}`)
    }

    if (body.path) {
      revalidatePath(body.path, body.type === 'layout' ? 'layout' : 'page')
      actions.push(`path:${body.path}`)
    }

    if (actions.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Provide at least one of: { tag, path }' },
        { status: 400 },
      )
    }

    return NextResponse.json({ ok: true, revalidated: actions })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message ?? 'Unexpected error' },
      { status: 500 },
    )
  }
}

/**
 * Revalidate cache via query parameters
 * @description Simple GET endpoint for debugging - revalidates cache using query parameters. Requires REVALIDATE_SECRET env and Authorization: Bearer <secret> header.
 * @params { tag?: string, path?: string, type?: string }
 * @response RevalidateResponse:Successfully revalidated
 * @add 400:RevalidateErrorResponse:Bad request
 * @add 401:RevalidateErrorResponse:Unauthorized
 * @openapi
 */
export async function GET(request: Request) {
  // Simple GET for debugging: /api/revalidate?path=/ or /api/revalidate?tag=mytag
  const url = new URL(request.url)
  const tag = url.searchParams.get('tag') || undefined
  const path = url.searchParams.get('path') || undefined
  const type =
    (url.searchParams.get('type') as 'page' | 'layout' | null) || undefined

  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const actions: string[] = []
  if (tag) {
    revalidateTag(tag, { expire: 60 })
    actions.push(`tag:${tag}`)
  }
  if (path) {
    revalidatePath(path, type === 'layout' ? 'layout' : 'page')
    actions.push(`path:${path}`)
  }

  if (actions.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Provide at least one of: { tag, path }' },
      { status: 400 },
    )
  }

  return NextResponse.json({ ok: true, revalidated: actions })
}
