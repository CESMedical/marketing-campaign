import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canEditPost } from '@/lib/roles'
import { rateLimit } from '@/lib/rate-limit'
import { createPostData, loadPostsData } from '@/lib/post-data'
import { loadCampaign } from '@/lib/posts'
import { Pillar, Platform, Format } from '@/types/post'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roadmapId = request.nextUrl.searchParams.get('r') ?? undefined
  const posts = await loadPostsData({ roadmapId })
  return NextResponse.json(posts)
}

const ALLOWED_PILLARS: Pillar[] = ['educational', 'business', 'premises', 'employee', 'leadership', 'events', 'tech']
const ALLOWED_PLATFORMS: Platform[] = ['instagram', 'facebook', 'linkedin', 'youtube', 'x']
const ALLOWED_FORMATS: Format[] = ['single-image', 'carousel', 'reel', 'story', 'video', 'text']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function weekNumberFor(date: string): number {
  const campaign = loadCampaign()
  const start = new Date(`${campaign.startDate}T00:00:00Z`).getTime()
  const current = new Date(`${date}T00:00:00Z`).getTime()
  return Math.max(1, Math.ceil((current - start + 1) / (1000 * 60 * 60 * 24 * 7)))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canEditPost(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!rateLimit({ key: `create:${session.user.email ?? 'unknown'}`, limit: 20, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await request.json()
  const { title, pillar, platforms, format, scheduledDate, roadmapId } = body

  if (typeof title !== 'string' || title.trim().length === 0 || title.length > 180) {
    return NextResponse.json({ error: 'Invalid title' }, { status: 400 })
  }
  if (!ALLOWED_PILLARS.includes(pillar)) {
    return NextResponse.json({ error: 'Invalid pillar' }, { status: 400 })
  }
  if (!Array.isArray(platforms) || platforms.length === 0 || !platforms.every((p: string) => ALLOWED_PLATFORMS.includes(p as Platform))) {
    return NextResponse.json({ error: 'Invalid platforms' }, { status: 400 })
  }
  if (!ALLOWED_FORMATS.includes(format)) {
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  }
  if (typeof scheduledDate !== 'string' || !ISO_DATE.test(scheduledDate)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  const post = await createPostData({
    title: title.trim(),
    pillar,
    platforms,
    format,
    scheduledDate,
    weekNumber: weekNumberFor(scheduledDate),
    roadmapId: typeof roadmapId === 'string' ? roadmapId : undefined,
  })

  if (!post) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  return NextResponse.json(post, { status: 201 })
}
