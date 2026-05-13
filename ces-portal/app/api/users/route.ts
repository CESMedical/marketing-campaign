import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json([])

  const users = await prisma.user.findMany({
    select: { id: true, firstName: true },
    orderBy: { firstName: 'asc' },
  })

  return NextResponse.json(users)
}
