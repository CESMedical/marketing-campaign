import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canEditPost } from '@/lib/roles'
import { getRoadmapData, updateStrategyData } from '@/lib/roadmap-data'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const roadmap = await getRoadmapData(id)
  if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    title: roadmap.strategyTitle ?? 'Strategy Document',
    fileUrl: roadmap.strategyFileUrl ?? null,
    fileName: roadmap.strategyFileName ?? null,
    uploadedAt: roadmap.strategyUploadedAt ?? null,
    uploadedBy: roadmap.strategyUploadedBy ?? null,
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canEditPost(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  const data: Parameters<typeof updateStrategyData>[1] = {}
  if (typeof body.strategyTitle === 'string') data.strategyTitle = body.strategyTitle.trim()
  if (typeof body.strategyFileUrl === 'string') data.strategyFileUrl = body.strategyFileUrl
  if (typeof body.strategyFileName === 'string') data.strategyFileName = body.strategyFileName
  data.strategyUploadedBy = session.user.email ?? undefined

  const roadmap = await updateStrategyData(id, data)
  return NextResponse.json({
    title: roadmap.strategyTitle ?? 'Strategy Document',
    fileUrl: roadmap.strategyFileUrl ?? null,
    fileName: roadmap.strategyFileName ?? null,
    uploadedAt: roadmap.strategyUploadedAt ?? null,
    uploadedBy: roadmap.strategyUploadedBy ?? null,
  })
}
