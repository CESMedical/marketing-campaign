import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canEditPost } from '@/lib/roles'
import { loadRoadmapsData, createRoadmapData } from '@/lib/roadmap-data'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roadmaps = await loadRoadmapsData()
  return NextResponse.json(roadmaps)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canEditPost(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title } = await request.json()
  if (typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 })
  }

  const roadmap = await createRoadmapData(title.trim())
  return NextResponse.json(roadmap, { status: 201 })
}
