import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { postExistsData } from '@/lib/post-data'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { canEditPost } from '@/lib/roles'
import { sendMentionEmail } from '@/lib/email'
import { getPostBySlugData } from '@/lib/post-data'
import { notifyNewComment } from '@/lib/notify'
import { logEmail } from '@/lib/email-log'

const MAX_COMMENT_LENGTH = 1000

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

function publicComment(
  comment: { id: string; authorName: string; authorEmail: string; text: string; createdAt: Date },
  sessionEmail: string,
  isAdmin: boolean,
) {
  return {
    id: comment.id,
    authorName: comment.authorName,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
    canDelete: isAdmin || comment.authorEmail.toLowerCase() === sessionEmail,
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasDatabase()) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

  const { slug } = await params
  if (!(await postExistsData(slug))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const sessionEmail = (session.user.email ?? '').toLowerCase()
  const comments = await prisma.comment.findMany({
    where: { postSlug: slug },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(
    comments.map((comment) => publicComment(comment, sessionEmail, canEditPost(session.user.role))),
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasDatabase()) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  if (!rateLimit({ key: `comment:${session.user.email ?? 'unknown'}`, limit: 20, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many comments' }, { status: 429 })
  }

  const { slug } = await params
  if (!(await postExistsData(slug))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { text } = await request.json()
  const trimmed = typeof text === 'string' ? text.trim() : ''
  if (!trimmed) return NextResponse.json({ error: 'Empty comment' }, { status: 400 })
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json({ error: 'Comment too long' }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: {
      postSlug: slug,
      authorName: (session.user.displayName ?? session.user.name ?? session.user.email ?? 'Unknown').split(' ')[0],
      authorEmail: session.user.email ?? '',
      text: trimmed,
    },
  })

  const response = publicComment(comment, (session.user.email ?? '').toLowerCase(), canEditPost(session.user.role))

  // Fire notifications in the background
  const authorFirstName = comment.authorName
  const mentions = [...new Set((trimmed.match(/@(\w+)/g) ?? []).map(m => m.slice(1)))]
  const post = await getPostBySlugData(slug)
  if (post) {
    // @mention emails
    let mentionedEmails: string[] = []
    if (mentions.length > 0) {
      prisma.user.findMany({
        where: { firstName: { in: mentions }, NOT: { email: comment.authorEmail } },
      }).then(users => {
        mentionedEmails = users.map(u => u.email)
        return Promise.all(users.map(u =>
          sendMentionEmail({
            to: u.email, toFirstName: u.firstName,
            byFirstName: authorFirstName,
            postTitle: post.title, postSlug: slug, commentText: trimmed,
          }).then(() => logEmail({ type: 'mention', to: u.email, subject: `${authorFirstName} mentioned you on "${post.title}"`, postSlug: slug, triggeredBy: comment.authorEmail }))
          .catch(console.error)
        ))
      }).catch(console.error)
    }
    // New comment notification to admins
    notifyNewComment({
      postTitle: post.title, postSlug: slug,
      commentAuthor: authorFirstName,
      commentText: trimmed,
      commenterEmail: comment.authorEmail,
      mentionedEmails,
    }).catch(console.error)
  }

  return NextResponse.json(response, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasDatabase()) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  if (!rateLimit({ key: `comment-delete:${session.user.email ?? 'unknown'}`, limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many deletes' }, { status: 429 })
  }

  const { slug } = await params
  const { id } = await request.json()
  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'Missing comment id' }, { status: 400 })
  }

  const comment = await prisma.comment.findFirst({ where: { id, postSlug: slug } })
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const userEmail = (session.user.email ?? '').toLowerCase()
  const isAdmin = canEditPost(session.user.role)
  const isOwner = comment.authorEmail.toLowerCase() === userEmail
  if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.comment.delete({ where: { id: comment.id } })
  return NextResponse.json({ ok: true })
}
