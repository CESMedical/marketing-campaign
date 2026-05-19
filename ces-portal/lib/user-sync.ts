import { prisma } from './prisma'
import { resolveRole } from './roles'

export async function syncUserOnSignIn(email: string, displayName: string): Promise<void> {
  if (!process.env.DATABASE_URL) return
  const firstName = (displayName ?? email).split(/[\s@]/)[0]
  const role = resolveRole(email)

  const existing = await prisma.user.findUnique({ where: { email } })

  if (!existing) {
    await prisma.user.create({ data: { email, firstName, role, welcomeSent: false } })
    // Welcome email wired but not yet activated — enable when ready:
    // sendWelcome(email, firstName).catch(err =>
    //   console.error('[user-sync] welcome email failed:', err)
    // )
  } else {
    await prisma.user.update({ where: { email }, data: { firstName, role } })
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function sendWelcome(email: string, firstName: string): Promise<void> {
  const { sendPortalWelcomeEmail } = await import('@/lib/emails/sendPortalWelcome')
  await sendPortalWelcomeEmail({ email, firstName })
  await prisma.user.update({ where: { email }, data: { welcomeSent: true } })
}
