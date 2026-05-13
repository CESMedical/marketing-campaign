import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, database: 'not configured (json fallback)' })
  }
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, database: 'connected' })
  } catch {
    return NextResponse.json({ ok: false, database: 'error' }, { status: 503 })
  }
}
