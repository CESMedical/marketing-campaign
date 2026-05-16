import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { canEditPost } from '@/lib/roles'
import { logAudit, ipFromRequest } from '@/lib/audit'
import { loadCampaign } from '@/lib/posts'

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr.slice(0, 10) + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

function weekNumberFor(date: string): number {
  const campaign = loadCampaign()
  const start = new Date(`${campaign.startDate}T00:00:00Z`).getTime()
  const current = new Date(`${date}T00:00:00Z`).getTime()
  return Math.max(1, Math.ceil((current - start + 1) / (1000 * 60 * 60 * 24 * 7)))
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canEditPost(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!rateLimit({ key: `bulk-shift:${session.user.email ?? 'unknown'}`, limit: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const days = (body as Record<string, unknown>)?.days
  if (typeof days !== 'number' || !Number.isInteger(days) || days === 0 || Math.abs(days) > 365) {
    return NextResponse.json({ error: 'days must be a non-zero integer between -365 and 365' }, { status: 400 })
  }

  const all = await prisma.post.findMany({ select: { slug: true, scheduledDate: true } })

  await prisma.$transaction(
    all.map(p => {
      const newDate = addDays(p.scheduledDate, days)
      return prisma.post.update({
        where: { slug: p.slug },
        data: { scheduledDate: newDate, weekNumber: weekNumberFor(newDate) },
      })
    })
  )

  logAudit({
    userEmail:  session.user.email ?? '',
    userName:   session.user.displayName,
    action:     'canvas.update',
    resource:   'all-posts',
    detail:     { type: 'bulk-shift', days, count: all.length },
    ipAddress:  ipFromRequest(request),
  })

  return NextResponse.json({ ok: true, count: all.length })
}
