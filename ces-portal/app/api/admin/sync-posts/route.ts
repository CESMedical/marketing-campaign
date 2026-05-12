import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { syncPostContent } from '@/lib/sync-post-content'

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await syncPostContent()
  return NextResponse.json({ ok: true })
}
