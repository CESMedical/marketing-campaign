import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sendPortalWelcomeEmail } from '@/lib/emails/sendPortalWelcome'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, firstName, role } = await request.json()
  if (!email || !firstName) {
    return NextResponse.json({ error: 'email and firstName required' }, { status: 400 })
  }

  try {
    await sendPortalWelcomeEmail({ email, firstName, role: role ?? 'viewer' })
    return NextResponse.json({ ok: true, sent: email })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[send-welcome] failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
