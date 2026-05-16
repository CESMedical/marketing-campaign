import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = request.nextUrl
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit    = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') ?? '50')))
  const user     = searchParams.get('user')  ?? undefined
  const action   = searchParams.get('action') ?? undefined

  const where = {
    ...(user   ? { userEmail: { contains: user } }   : {}),
    ...(action ? { action: { startsWith: action } }  : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, limit })
}
