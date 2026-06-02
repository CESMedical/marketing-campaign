import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sendPortalWelcomeEmail } from '@/lib/emails/sendPortalWelcome'
import { resolveRole } from '@/lib/roles'

const PORTAL_USERS = [
  { email: 'elion@cesmedical.co.uk',    firstName: 'Elion',    defaultRole: 'admin' },
  { email: 'kash@cesmedical.co.uk',     firstName: 'Kashif',   defaultRole: 'clinical_reviewer' },
  { email: 'nick@cesmedical.co.uk',     firstName: 'Nick',     defaultRole: 'clinical_reviewer' },
  { email: 'syed@cesmedical.co.uk',     firstName: 'Syed',     defaultRole: 'clinical_reviewer' },
  { email: 'tanya@cesmedical.co.uk',    firstName: 'Tanya',    defaultRole: 'viewer' },
  { email: 'leonna@cesmedical.co.uk',   firstName: 'Leonna',   defaultRole: 'viewer' },
  { email: 'ana@cesmedical.co.uk',      firstName: 'Ana',      defaultRole: 'viewer' },
  { email: 'lucy@cesmedical.co.uk',     firstName: 'Lucy',     defaultRole: 'viewer' },
  { email: 'karolina@cesmedical.co.uk', firstName: 'Karolina', defaultRole: 'viewer' },
  { email: 'miran@alastralabs.com',     firstName: 'Miran',    defaultRole: 'admin' },
  { email: 'kush@alastralabs.com',      firstName: 'Kush',     defaultRole: 'admin' },
  { email: 'anick@alastralabs.com',     firstName: 'Anick',    defaultRole: 'admin' },
]

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })
  }

  const results: { email: string; ok: boolean; error?: string }[] = []

  for (const u of PORTAL_USERS) {
    const role = resolveRole(u.email) || u.defaultRole
    try {
      await sendPortalWelcomeEmail({ email: u.email, firstName: u.firstName, role })
      results.push({ email: u.email, ok: true })
    } catch (err) {
      results.push({ email: u.email, ok: false, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return NextResponse.json({ results })
}
