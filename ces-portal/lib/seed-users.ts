import { prisma } from './prisma'
import { resolveRole } from './roles'
import { sendPortalWelcomeEmail } from './emails/sendPortalWelcome'

/**
 * Canonical user list for the CES portal.
 * These are upserted into the DB on every sync so they appear in @mentions
 * and email dropdowns even before a user has signed in for the first time.
 * Roles here are fallback defaults — resolveRole() will override from env vars
 * on the user's first actual sign-in.
 */
const PORTAL_USERS: { email: string; firstName: string; defaultRole: string }[] = [
  // CES Medical — clinical team
  { email: 'elion@cesmedical.co.uk',    firstName: 'Elion',    defaultRole: 'admin' },
  { email: 'kash@cesmedical.co.uk',     firstName: 'Kashif',   defaultRole: 'clinical_reviewer' },
  { email: 'nick@cesmedical.co.uk',     firstName: 'Nick',     defaultRole: 'clinical_reviewer' },
  { email: 'syed@cesmedical.co.uk',     firstName: 'Syed',     defaultRole: 'clinical_reviewer' },
  // CES Medical — operations & marketing
  { email: 'tanya@cesmedical.co.uk',    firstName: 'Tanya',    defaultRole: 'viewer' },
  { email: 'leonna@cesmedical.co.uk',   firstName: 'Leonna',   defaultRole: 'viewer' },
  { email: 'ana@cesmedical.co.uk',      firstName: 'Ana',      defaultRole: 'viewer' },
  { email: 'lucy@cesmedical.co.uk',     firstName: 'Lucy',     defaultRole: 'viewer' },
  { email: 'karolina@cesmedical.co.uk', firstName: 'Karolina', defaultRole: 'viewer' },
  // Alastra (agency)
  { email: 'miran@alastralabs.com',     firstName: 'Miran',    defaultRole: 'admin' },
  { email: 'kush@alastralabs.com',      firstName: 'Kush',     defaultRole: 'admin' },
]

export async function syncUsers(): Promise<void> {
  if (!process.env.DATABASE_URL) return

  let welcomed = 0

  for (const u of PORTAL_USERS) {
    const role = resolveRole(u.email) || u.defaultRole

    const existing = await prisma.user.findUnique({ where: { email: u.email } })

    if (!existing) {
      await prisma.user.create({ data: { email: u.email, firstName: u.firstName, role, welcomeSent: false } })
    } else {
      await prisma.user.update({ where: { email: u.email }, data: { firstName: u.firstName, role } })
    }

    // Send welcome email to anyone who hasn't received one yet.
    const needsWelcome = !existing || !existing.welcomeSent
    if (needsWelcome) {
      try {
        await sendPortalWelcomeEmail({ email: u.email, firstName: u.firstName, role })
        await prisma.user.update({ where: { email: u.email }, data: { welcomeSent: true } })
        welcomed++
        console.log(`[seed-users] welcome email sent to ${u.email}`)
      } catch (err) {
        console.error(`[seed-users] welcome email failed for ${u.email}:`, err)
      }
    }
  }

  console.log(`[seed-users] ${PORTAL_USERS.length} users synced, ${welcomed} welcome emails sent`)
}
