import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWeeklyDigestEmail } from '@/lib/email'
import { logEmail } from '@/lib/email-log'

function splitEnvEmails(...vars: string[]): string[] {
  return vars.flatMap(v =>
    (process.env[v] ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  )
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  // Find Monday–Sunday of this week (UTC)
  const now = new Date()
  const dayOfWeek = now.getUTCDay() || 7
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOfWeek + 1))
  const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6))
  const from = monday.toISOString().slice(0, 10)
  const to   = sunday.toISOString().slice(0, 10)

  const posts = await prisma.post.findMany({
    where: { scheduledDate: { gte: from, lte: to } },
    orderBy: [{ scheduledDate: 'asc' }, { sortOrder: 'asc' }],
    select: { title: true, scheduledDate: true, status: true, slug: true },
  })

  if (posts.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No posts this week' })
  }

  const weekLabel = `${monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })} – ${sunday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })}`
  const recipients = splitEnvEmails('ADMIN_EMAILS', 'EDITOR_EMAILS')

  const users = await prisma.user.findMany({
    where: { email: { in: recipients } },
    select: { email: true, firstName: true },
  })
  const nameMap = new Map(users.map(u => [u.email, u.firstName]))

  await Promise.all(recipients.map(async email => {
    const firstName = nameMap.get(email) ?? email.split('@')[0]
    const subject = `CES Medical — Posts scheduled for ${weekLabel}`
    await sendWeeklyDigestEmail({ to: email, toFirstName: firstName, weekLabel, posts }).catch(console.error)
    await logEmail({ type: 'weekly_digest', to: email, subject })
  }))

  return NextResponse.json({ sent: recipients.length, week: weekLabel, posts: posts.length })
}
