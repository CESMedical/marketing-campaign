import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { Resend } from 'resend'
import { sendPortalWelcomeEmail } from '@/lib/emails/sendPortalWelcome'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, firstName, role } = await request.json()
  if (!email || !firstName) {
    return NextResponse.json({ error: 'email and firstName required' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set on server' }, { status: 500 })
  }

  try {
    await sendPortalWelcomeEmail({ email, firstName, role: role ?? 'viewer' })
    return NextResponse.json({ ok: true, sent: email, resendKeyPresent: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[send-welcome] failed:', message)
    return NextResponse.json({ error: message, resendKeyPresent: true }, { status: 500 })
  }
}
