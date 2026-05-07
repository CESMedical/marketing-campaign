import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { postExistsData } from '@/lib/post-data'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

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
    comments.map((comment) => publicComment(comment, sessionEmail, session.user.role === 'admin')),
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

  return NextResponse.json(
    publicComment(comment, (session.user.email ?? '').toLowerCase(), session.user.role === 'admin'),
    { status: 201 },
  )
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
  const isAdmin = session.user.role === 'admin'
  const isOwner = comment.authorEmail.toLowerCase() === userEmail
  if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.comment.delete({ where: { id: comment.id } })
  return NextResponse.json({ ok: true })
}
