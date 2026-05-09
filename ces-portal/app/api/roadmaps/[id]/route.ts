import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canEditPost } from '@/lib/roles'
import { updateRoadmapData, deleteRoadmapData } from '@/lib/roadmap-data'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canEditPost(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { title } = await request.json()
  if (typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 })
  }

  try {
    const roadmap = await updateRoadmapData(id, title.trim())
    return NextResponse.json(roadmap)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  try {
    await deleteRoadmapData(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
