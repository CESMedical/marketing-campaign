import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { Format, Platform, Post, Status } from '@/types/post'
import { loadCampaign } from '@/lib/posts'
import { rateLimit } from '@/lib/rate-limit'
import { updatePostData, getPostBySlugData, deletePostData } from '@/lib/post-data'
import { canEditPost, canTransitionStatus } from '@/lib/roles'
import { notifyStatusChange, notifyScheduledThisWeek, isThisWeek } from '@/lib/notify'
import { logAudit, ipFromRequest } from '@/lib/audit'

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
    if (typeof input.imageUrl !== 'string' || input.imageUrl.length > 2000) return null
    const allowedPrefixes = [
      '/uploads/',
      'https://res.cloudinary.com/',
      '/api/onedrive-image?',
      process.env.R2_PUBLIC_URL ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/` : undefined,
    ].filter((prefix): prefix is string => Boolean(prefix))
    if (input.imageUrl && !allowedPrefixes.some(p => (input.imageUrl as string).startsWith(p))) return null
    updates.imageUrl = input.imageUrl
  }

  if ('images' in input) {
    if (!Array.isArray(input.images) || input.images.length > 10) return null
    const allowedPrefixes = [
      '/uploads/',
      'https://res.cloudinary.com/',
      '/api/onedrive-image?',
      process.env.R2_PUBLIC_URL ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/` : undefined,
    ].filter((p): p is string => Boolean(p))
    const valid = (input.images as unknown[]).every(
      u => typeof u === 'string' && u.length <= 2000 && (!u || allowedPrefixes.some(p => u.startsWith(p)))
    )
    if (!valid) return null
    updates.images = input.images as string[]
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

  if ('sortOrder' in input) {
    if (typeof input.sortOrder !== 'number' || !Number.isInteger(input.sortOrder)) return null
    updates.sortOrder = input.sortOrder
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

function reviewerName(session: { user: { email?: string | null; displayName?: string } }): string {
  return session?.user.email ?? session?.user.displayName ?? 'Unknown'
}

function applyWorkflowAudit(
  updates: Partial<Post>,
  before: Post,
  session: { user: { email?: string | null; displayName?: string } },
): Partial<Post> {
  if (!updates.status || updates.status === before.status) return updates

  if (updates.status === 'brand-review') {
    updates.clinicalReviewer = reviewerName(session)
  }

  if (updates.status === 'approved') {
    updates.brandReviewer = reviewerName(session)
    updates.approvedAt = new Date().toISOString()
  }

  if (updates.status === 'draft' || updates.status === 'clinical-review' || updates.status === 'brand-review') {
    updates.approvedAt = undefined
  }

  return updates
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { slug } = await params
  const deleted = await deletePostData(slug)
  if (!deleted) return NextResponse.json({ error: 'Not found or database unavailable' }, { status: 404 })
  logAudit({ userEmail: session.user.email ?? '', userName: session.user.displayName, action: 'post.delete', resource: slug, ipAddress: ipFromRequest(_request) })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit({ key: `post:${session.user.email ?? 'unknown'}`, limit: 60, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many updates' }, { status: 429 })
  }

  const { slug } = await params
  const updates = pickPostUpdates(await request.json())
  if (!updates) return NextResponse.json({ error: 'Invalid update' }, { status: 400 })
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No update supplied' }, { status: 400 })

  try {
    const before = await getPostBySlugData(slug)
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const changedFields = Object.keys(updates)
    const contentFields = changedFields.filter((field) => field !== 'status')
    if (contentFields.length > 0 && !canEditPost(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (
      updates.status &&
      !canTransitionStatus(session.user.role, before.status, updates.status)
    ) {
      return NextResponse.json({ error: 'Forbidden status transition' }, { status: 403 })
    }

    const finalUpdates = applyWorkflowAudit(updates, before, session)
    const updated = await updatePostData(slug, finalUpdates)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isStatusChange = updates.status && before.status !== updates.status
    logAudit({
      userEmail:  session.user.email ?? '',
      userName:   session.user.displayName,
      action:     isStatusChange ? 'post.status_change' : 'post.update',
      resource:   slug,
      detail:     {
        fields:   Object.keys(finalUpdates),
        ...(isStatusChange ? { from: before.status, to: updates.status } : {}),
        ...(updates.scheduledDate && updates.scheduledDate !== before.scheduledDate
          ? { dateMoved: { from: before.scheduledDate, to: updates.scheduledDate } }
          : {}),
      },
      ipAddress:  ipFromRequest(request),
    })

    if (before && updates.status && before.status !== updates.status) {
      notifyStatusChange({
        oldStatus: before.status,
        newStatus: updates.status,
        postTitle: updated.title,
        postSlug: slug,
        changedBy: session.user.email ?? '',
      }).catch(console.error)
    }

    if (before && updates.scheduledDate && updates.scheduledDate !== before.scheduledDate && isThisWeek(updates.scheduledDate)) {
      notifyScheduledThisWeek({
        postTitle: updated.title,
        postSlug: slug,
        scheduledDate: updates.scheduledDate,
        movedBy: session.user.email ?? '',
      }).catch(console.error)
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
