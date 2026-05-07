import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, database: 'not configured (json fallback)' })
  }
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, database: 'connected' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ ok: false, database: 'error', detail: message }, { status: 503 })
  }
}
