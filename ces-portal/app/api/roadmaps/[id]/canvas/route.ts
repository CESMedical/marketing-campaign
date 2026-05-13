import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { canUpdateCanvas } from '@/lib/roles'
import { rateLimit } from '@/lib/rate-limit'

const MAX_CANVAS_BYTES = 200_000

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const roadmap = await prisma.roadmap.findUnique({ where: { id }, select: { canvasLayout: true } })
  if (!roadmap) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(roadmap.canvasLayout ?? {})
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canUpdateCanvas(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!rateLimit({ key: `canvas:${session.user.email ?? 'unknown'}`, limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Too many updates' }, { status: 429 })
  }

  const { id } = await params
  const contentLength = Number(req.headers.get('content-length') ?? '0')
  if (contentLength > MAX_CANVAS_BYTES) {
    return NextResponse.json({ error: 'Canvas payload too large' }, { status: 413 })
  }

  const body = await req.json()
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid canvas payload' }, { status: 400 })
  }
  if (JSON.stringify(body).length > MAX_CANVAS_BYTES) {
    return NextResponse.json({ error: 'Canvas payload too large' }, { status: 413 })
  }

  await prisma.roadmap.update({ where: { id }, data: { canvasLayout: body } })
  return NextResponse.json({ ok: true })
}
