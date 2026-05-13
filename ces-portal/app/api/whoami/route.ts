import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const session = await auth()
  if (!session) return NextResponse.json({ role: 'anonymous' })

  const sessionEmail = (session.user.email ?? '').toLowerCase()

  return NextResponse.json({
    role: session.user.role,
    email: sessionEmail,
  })
}
