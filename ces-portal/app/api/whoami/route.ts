import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const ADMIN_EMAILS = ['kush@cesmedical.co.uk', 'miran@alastralabs.com']

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ isAdmin: false })

  const u = session.user as Record<string, unknown>

  // Collect every possible identifier the session might carry
  const candidates: string[] = [
    u.email, u.displayName, u.name, u.role,
  ].filter((v): v is string => typeof v === 'string' && v.length > 0)
    .map(s => s.toLowerCase())

  // Match on exact email, email prefix, or role
  const isAdmin =
    candidates.includes('admin') ||
    ADMIN_EMAILS.some(a =>
      candidates.includes(a) ||
      candidates.some(c => c.startsWith(a.split('@')[0] + '@') || c === a)
    )

  return NextResponse.json({
    isAdmin,
    candidates,    // ← tells us exactly what fields arrived
    email:       u.email,
    name:        u.name,
    displayName: u.displayName,
    role:        u.role,
  })
}
