import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hasDb = Boolean(process.env.DATABASE_URL)

  let dbOk = false
  let dbError = ''
  if (hasDb) {
    try {
      const { prisma } = await import('@/lib/prisma')
      await prisma.$queryRaw`SELECT 1`
      dbOk = true
    } catch (e) {
      dbError = String(e)
    }
  }

  return NextResponse.json({
    databaseUrl: hasDb ? 'set' : 'NOT SET — saves will fail',
    databasePing: dbOk ? 'ok' : `FAILED: ${dbError}`,
    env: process.env.NODE_ENV,
  })
}
