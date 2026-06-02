import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getRoadmapData } from '@/lib/roadmap-data'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const mode   = request.nextUrl.searchParams.get('mode') ?? 'view'

  const roadmap = await getRoadmapData(id)
  if (!roadmap?.strategyFileUrl) {
    return NextResponse.json({ error: 'No strategy document' }, { status: 404 })
  }

  if (mode !== 'view' && mode !== 'download') {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  // Local dev fallback
  if (process.env.NODE_ENV !== 'production' && roadmap.strategyFileUrl.startsWith('/uploads/docs/')) {
    return NextResponse.redirect(roadmap.strategyFileUrl)
  }

  let strategyUrl: URL
  try {
    strategyUrl = new URL(roadmap.strategyFileUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid strategy document URL' }, { status: 400 })
  }
  if (strategyUrl.protocol !== 'https:') {
    return NextResponse.json({ error: 'Invalid strategy document URL' }, { status: 400 })
  }

  // All public HTTPS documents (R2 or any CDN) — redirect directly.
  return NextResponse.redirect(roadmap.strategyFileUrl, { status: 302 })
}
