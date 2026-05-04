import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import { getPostBySlug } from '@/lib/posts'

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
  try {
    return JSON.parse(readFileSync(FILE, 'utf-8'))
  } catch {
    return []
  }
}

function publicComment(comment: Comment) {
  return {
    id: comment.id,
    authorName: comment.authorName,
    text: comment.text,
    createdAt: comment.createdAt,
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  if (!getPostBySlug(slug)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const comments = readComments().filter(c => c.postSlug === slug).map(publicComment)
  return NextResponse.json(comments)
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
  const trimmedText = typeof text === 'string' ? text.trim() : ''
  if (!trimmedText) return NextResponse.json({ error: 'Empty comment' }, { status: 400 })
  if (trimmedText.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json({ error: 'Comment too long' }, { status: 400 })
  }

  const comment: Comment = {
    id: randomUUID(),
    postSlug: slug,
    authorName: (session.user.displayName ?? session.user.name ?? session.user.email ?? 'Unknown').split(' ')[0],
    authorEmail: session.user.email ?? '',
    text: trimmedText,
    createdAt: new Date().toISOString(),
  }

  const all = readComments()
  all.push(comment)
  writeFileSync(FILE, JSON.stringify(all, null, 2))

  return NextResponse.json(publicComment(comment), { status: 201 })
}
