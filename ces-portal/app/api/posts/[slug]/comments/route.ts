import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import { getPostBySlug } from '@/lib/posts'
import { rateLimit } from '@/lib/rate-limit'

interface Comment {
  id: string
  postSlug: string
  authorName: string
  authorEmail: string
  text: string
  createdAt: string
}

const FILE = join(process.cwd(), 'content', 'comments.json')
const MAX_COMMENT_LENGTH = 1000
function readComments(): Comment[] {
  try { return JSON.parse(readFileSync(FILE, 'utf-8')) }
  catch { return [] }
}
function save(comments: Comment[]) {
  writeFileSync(FILE, JSON.stringify(comments, null, 2))
}
function publicComment(c: Comment, sessionEmail: string, isAdmin: boolean) {
  return {
    id: c.id,
    authorName: c.authorName,
    text: c.text,
    createdAt: c.createdAt,
    canDelete: isAdmin || c.authorEmail.toLowerCase() === sessionEmail,
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit({ key: `comment:${session.user.email ?? 'unknown'}`, limit: 20, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many comments' }, { status: 429 })
  }
  const { slug } = await params
  if (!getPostBySlug(slug)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const email = (session.user.email ?? '').toLowerCase()
  return NextResponse.json(
    readComments()
      .filter(c => c.postSlug === slug)
      .map(c => publicComment(c, email, session.user.role === 'admin')),
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { slug } = await params
  if (!getPostBySlug(slug)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { text } = await request.json()
  const trimmed = typeof text === 'string' ? text.trim() : ''
  if (!trimmed) return NextResponse.json({ error: 'Empty comment' }, { status: 400 })
  if (trimmed.length > MAX_COMMENT_LENGTH) return NextResponse.json({ error: 'Comment too long' }, { status: 400 })

  const comment: Comment = {
    id: randomUUID(),
    postSlug: slug,
    authorName: (session.user.displayName ?? session.user.name ?? session.user.email ?? 'Unknown').split(' ')[0],
    authorEmail: session.user.email ?? '',
    text: trimmed,
    createdAt: new Date().toISOString(),
  }

  const all = readComments()
  all.push(comment)
  save(all)
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
  if (!rateLimit({ key: `comment-delete:${session.user.email ?? 'unknown'}`, limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many deletes' }, { status: 429 })
  }

  const { slug } = await params
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing comment id' }, { status: 400 })

  const all = readComments()
  const comment = all.find(c => c.id === id && c.postSlug === slug)
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const userEmail = (session.user.email ?? '').toLowerCase()
  const isAdmin = session.user.role === 'admin'
  const isOwner = comment.authorEmail.toLowerCase() === userEmail

  if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  save(all.filter(c => c.id !== id))
  return NextResponse.json({ ok: true })
}
