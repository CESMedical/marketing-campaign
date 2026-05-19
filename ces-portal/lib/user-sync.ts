import { prisma } from './prisma'
import { resolveRole } from './roles'

export async function syncUserOnSignIn(email: string, displayName: string): Promise<void> {
  if (!process.env.DATABASE_URL) return
  const firstName = (displayName ?? email).split(/[\s@]/)[0]
  const role = resolveRole(email)

  const existing = await prisma.user.findUnique({ where: { email } })

  if (!existing) {
    await prisma.user.create({ data: { email, firstName, role, welcomeSent: false } })
    // Send welcome email after record is created. Fire-and-forget — never blocks sign-in.
    sendWelcome(email, firstName).catch(err =>
      console.error('[user-sync] welcome email failed:', err)
    )
  } else {
    await prisma.user.update({ where: { email }, data: { firstName, role } })
  }
}

async function sendWelcome(email: string, firstName: string): Promise<void> {
  const { sendPortalWelcomeEmail } = await import('@/lib/emails/sendPortalWelcome')
  await sendPortalWelcomeEmail({ email, firstName })
  // Mark sent so retries on subsequent sign-ins do not re-send
  await prisma.user.update({ where: { email }, data: { welcomeSent: true } })
}
