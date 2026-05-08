import { sendStatusChangeEmail, sendNewCommentEmail } from './email'
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
