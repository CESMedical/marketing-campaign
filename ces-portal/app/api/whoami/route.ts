import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const ADMIN_EMAILS = ['kush@cesmedical.co.uk', 'miran@alastralabs.com']

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ isAdmin: false })

  const u = session.user as Record<string, unknown>
  const email = ((u.email ?? u.displayName ?? u.name ?? '') as string).toLowerCase()
  const role = u.role as string | undefined
  const isAdmin = role === 'admin' || ADMIN_EMAILS.some(a => email === a || email.startsWith(a.split('@')[0] + '@'))

  return NextResponse.json({
    isAdmin,
    email,
    role,
    name: u.name,
    displayName: u.displayName,
  })
}
