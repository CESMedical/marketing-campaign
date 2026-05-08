import { sendStatusChangeEmail, sendNewCommentEmail, sendScheduledThisWeekEmail } from './email'
import { logEmail } from './email-log'
import { prisma } from './prisma'

function splitEnvEmails(...vars: string[]): string[] {
  return vars.flatMap(v =>
    (process.env[v] ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  )
}

async function firstNameFor(email: string): Promise<string> {
  if (!process.env.DATABASE_URL) return email.split('@')[0]
  const user = await prisma.user.findUnique({ where: { email } }).catch(() => null)
  return user?.firstName ?? email.split('@')[0]
}

export async function notifyStatusChange(opts: {
  oldStatus: string
  newStatus: string
  postTitle: string
  postSlug: string
  changedBy: string
}): Promise<void> {
  if (opts.oldStatus === opts.newStatus) return

  let recipients: string[] = []
  if (opts.newStatus === 'clinical-review') recipients = splitEnvEmails('CLINICAL_REVIEWER_EMAILS')
  else if (opts.newStatus === 'brand-review')    recipients = splitEnvEmails('BRAND_REVIEWER_EMAILS')
  else if (opts.newStatus === 'approved')         recipients = splitEnvEmails('ADMIN_EMAILS', 'EDITOR_EMAILS')

  // Exclude the person who made the change
  recipients = recipients.filter(e => e !== opts.changedBy.toLowerCase())
  if (recipients.length === 0) return

  const statusLabel = opts.newStatus.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const subject = `Post moved to ${statusLabel}: "${opts.postTitle}"`

  await Promise.all(recipients.map(async to => {
    const toFirstName = await firstNameFor(to)
    await sendStatusChangeEmail({ to, toFirstName, ...opts, changedBy: opts.changedBy.split('@')[0] }).catch(console.error)
    await logEmail({ type: 'status_change', to, subject, postSlug: opts.postSlug, triggeredBy: opts.changedBy })
  }))
}

function currentWeekRange(): { from: string; to: string } {
  const now = new Date()
  const day = now.getUTCDay() || 7
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day + 1))
  const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6))
  return { from: monday.toISOString().slice(0, 10), to: sunday.toISOString().slice(0, 10) }
}

export function isThisWeek(date: string): boolean {
  const { from, to } = currentWeekRange()
  return date >= from && date <= to
}

export async function notifyScheduledThisWeek(opts: {
  postTitle: string
  postSlug: string
  scheduledDate: string
  movedBy: string
}): Promise<void> {
  const recipients = splitEnvEmails('ADMIN_EMAILS', 'EDITOR_EMAILS').filter(
    e => e !== opts.movedBy.toLowerCase()
  )
  if (recipients.length === 0) return

  const dateLabel = new Date(opts.scheduledDate + 'T00:00:00Z')
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  const subject = `Post scheduled for this week: "${opts.postTitle}"`

  await Promise.all(recipients.map(async to => {
    const firstName = await firstNameFor(to)
    await sendScheduledThisWeekEmail({ to, toFirstName: firstName, ...opts, dateLabel }).catch(console.error)
    await logEmail({ type: 'scheduled_this_week', to, subject, postSlug: opts.postSlug, triggeredBy: opts.movedBy })
  }))
}

export async function notifyNewComment(opts: {
  postTitle: string
  postSlug: string
  commentAuthor: string
  commentText: string
  commenterEmail: string
  mentionedEmails?: string[]
}): Promise<void> {
  // Email admins, excluding the commenter and anyone already @mentioned (they get a mention email)
  const mentioned = new Set((opts.mentionedEmails ?? []).map(e => e.toLowerCase()))
  const admins = splitEnvEmails('ADMIN_EMAILS').filter(
    e => e !== opts.commenterEmail.toLowerCase() && !mentioned.has(e)
  )
  if (admins.length === 0) return

  const subject = `New comment on "${opts.postTitle}"`
  await Promise.all(admins.map(async to => {
    const toFirstName = await firstNameFor(to)
    await sendNewCommentEmail({ to, toFirstName, ...opts }).catch(console.error)
    await logEmail({ type: 'new_comment', to, subject, postSlug: opts.postSlug, triggeredBy: opts.commenterEmail })
  }))
}
