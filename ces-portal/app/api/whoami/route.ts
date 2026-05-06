import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const ADMIN_EMAILS = ['kush@alastralabs.com', 'miran@alastralabs.com']

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ isAdmin: false })

  const u = session.user as Record<string, unknown>

  const ADMIN_FIRST_NAMES = ['kush', 'miran']

  // Collect every possible identifier the session might carry
  const candidates: string[] = [
    u.email, u.displayName, u.name, u.role,
  ].filter((v): v is string => typeof v === 'string' && v.length > 0)
    .map(s => s.toLowerCase())

  const firstName = ((u.displayName ?? u.name ?? '') as string).split(' ')[0].toLowerCase()

  // Match on exact email, email prefix, role=admin, or known first name
  const isAdmin =
    candidates.includes('admin') ||
    ADMIN_FIRST_NAMES.includes(firstName) ||
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
