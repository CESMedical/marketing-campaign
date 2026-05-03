import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { auth } from '@/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const body = await request.json()
  const filePath = join(process.cwd(), 'content', 'posts.json')

  try {
    const posts: unknown[] = JSON.parse(readFileSync(filePath, 'utf-8'))
    const index = posts.findIndex((p: unknown) => (p as { slug: string }).slug === slug)
    if (index === -1)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    posts[index] = { ...(posts[index] as object), ...body }
    writeFileSync(filePath, JSON.stringify(posts, null, 2))

    return NextResponse.json(posts[index])
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
