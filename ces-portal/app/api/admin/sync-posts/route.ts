import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { syncPostContent } from '@/lib/sync-post-content'
import { syncUsers } from '@/lib/seed-users'

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await syncPostContent()
  await syncUsers()
  return NextResponse.json({ ok: true })
}
