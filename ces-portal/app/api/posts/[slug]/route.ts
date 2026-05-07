import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { auth } from '@/auth'
import { Format, Platform, Post, Status } from '@/types/post'
import { loadCampaign } from '@/lib/posts'
import { rateLimit } from '@/lib/rate-limit'

const ALLOWED_STATUSES: Status[] = [
  'draft',
  'clinical-review',
  'brand-review',
  'approved',
  'scheduled',
  'live',
]

const ALLOWED_PLATFORMS: Platform[] = ['instagram', 'facebook', 'linkedin', 'youtube', 'x']
const ALLOWED_FORMATS: Format[] = ['single-image', 'carousel', 'reel', 'story', 'video', 'text']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function weekNumberFor(date: string): number {
  const campaign = loadCampaign()
  const start = new Date(`${campaign.startDate}T00:00:00Z`).getTime()
  const current = new Date(`${date}T00:00:00Z`).getTime()
  return Math.max(1, Math.ceil((current - start + 1) / (1000 * 60 * 60 * 24 * 7)))
}

function pickPostUpdates(body: unknown): Partial<Post> | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const input = body as Record<string, unknown>
  const updates: Partial<Post> = {}

  if ('title' in input) {
    if (typeof input.title !== 'string' || input.title.trim().length === 0 || input.title.length > 180) {
      return null
    }
    updates.title = input.title.trim()
  }

  if ('caption' in input) {
    if (typeof input.caption !== 'string' || input.caption.length > 5000) return null
    updates.caption = input.caption
  }

  if ('notes' in input) {
    if (typeof input.notes !== 'string' || input.notes.length > 2000) return null
    updates.notes = input.notes
  }

  if ('imageUrl' in input) {
    if (typeof input.imageUrl !== 'string' || input.imageUrl.length > 500) return null
    if (input.imageUrl && !input.imageUrl.startsWith('/uploads/')) return null
    updates.imageUrl = input.imageUrl
  }

  if ('scheduledDate' in input) {
    if (typeof input.scheduledDate !== 'string' || !ISO_DATE.test(input.scheduledDate)) return null
    updates.scheduledDate = input.scheduledDate
    updates.weekNumber = weekNumberFor(input.scheduledDate)
  }

  if ('format' in input) {
    if (typeof input.format !== 'string' || !ALLOWED_FORMATS.includes(input.format as Format)) {
      return null
    }
    updates.format = input.format as Format
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
  if (!rateLimit({ key: `post:${session.user.email ?? 'unknown'}`, limit: 60, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many updates' }, { status: 429 })
  }

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
