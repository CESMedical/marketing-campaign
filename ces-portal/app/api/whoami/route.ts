import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ role: 'anonymous' })

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  const sessionEmail = (session.user.email ?? '').toLowerCase()

  return NextResponse.json({
    role: session.user.role,
    email: sessionEmail,
    adminEmailsConfigured: adminEmails.length,
    emailIsInAdminList: adminEmails.includes(sessionEmail),
  })
}
