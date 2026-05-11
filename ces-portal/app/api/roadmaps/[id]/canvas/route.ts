import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

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

  const { id } = await params
  const body = await req.json()

  await prisma.roadmap.update({ where: { id }, data: { canvasLayout: body } })
  return NextResponse.json({ ok: true })
}
