import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'

interface Comment {
  id: string
  postSlug: string
  authorName: string
  authorEmail: string
  text: string
  createdAt: string
}

const FILE = join(process.cwd(), 'content', 'comments.json')

function readComments(): Comment[] {
  try {
    return JSON.parse(readFileSync(FILE, 'utf-8'))
  } catch {
    return []
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const comments = readComments().filter(c => c.postSlug === slug)
  return NextResponse.json(comments)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const { text } = await request.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Empty comment' }, { status: 400 })

  const comment: Comment = {
    id: randomUUID(),
    postSlug: slug,
    authorName: session.user.displayName ?? session.user.name ?? session.user.email ?? 'Unknown',
    authorEmail: session.user.email ?? '',
    text: text.trim(),
    createdAt: new Date().toISOString(),
  }

  const all = readComments()
  all.push(comment)
  writeFileSync(FILE, JSON.stringify(all, null, 2))

  return NextResponse.json(comment, { status: 201 })
}
