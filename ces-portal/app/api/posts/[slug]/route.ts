import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { auth } from '@/auth'
import { Platform, Post, Status } from '@/types/post'

const ALLOWED_STATUSES: Status[] = [
  'draft',
  'clinical-review',
  'brand-review',
  'approved',
  'scheduled',
  'live',
]

const ALLOWED_PLATFORMS: Platform[] = ['instagram', 'facebook', 'linkedin', 'youtube', 'x']

function pickPostUpdates(body: unknown): Partial<Post> | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const input = body as Record<string, unknown>
  const updates: Partial<Post> = {}

  if ('caption' in input) {
    if (typeof input.caption !== 'string' || input.caption.length > 5000) return null
    updates.caption = input.caption
  }

  if ('notes' in input) {
    if (typeof input.notes !== 'string' || input.notes.length > 2000) return null
    updates.notes = input.notes
  }

  if ('status' in input) {
    if (typeof input.status !== 'string' || !ALLOWED_STATUSES.includes(input.status as Status)) {
      return null
    }
    updates.status = input.status as Status
  }

  if ('platforms' in input) {
    if (
      !Array.isArray(input.platforms) ||
      input.platforms.length === 0 ||
      !input.platforms.every(
        (platform): platform is Platform =>
          typeof platform === 'string' && ALLOWED_PLATFORMS.includes(platform as Platform),
      )
    ) {
      return null
    }
    updates.platforms = Array.from(new Set(input.platforms))
  }

  return updates
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { slug } = await params
  const updates = pickPostUpdates(await request.json())
  if (!updates) return NextResponse.json({ error: 'Invalid update' }, { status: 400 })

  const filePath = join(process.cwd(), 'content', 'posts.json')

  try {
    const posts: Post[] = JSON.parse(readFileSync(filePath, 'utf-8'))
    const index = posts.findIndex((p) => p.slug === slug)
    if (index === -1)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    posts[index] = { ...posts[index], ...updates }
    writeFileSync(filePath, JSON.stringify(posts, null, 2))

    return NextResponse.json(posts[index])
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
