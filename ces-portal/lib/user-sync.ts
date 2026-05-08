import { prisma } from './prisma'
import { resolveRole } from './roles'
import { sendWelcomeEmail } from './email'

export async function syncUserOnSignIn(email: string, displayName: string): Promise<void> {
  if (!process.env.DATABASE_URL) return
  const firstName = (displayName ?? email).split(/[\s@]/)[0]
  const role = resolveRole(email)

  const existing = await prisma.user.findUnique({ where: { email } })

  if (!existing) {
    await prisma.user.create({ data: { email, firstName, role, welcomeSent: false } })
    await sendWelcomeEmail(email, firstName).catch(console.error)
    await prisma.user.update({ where: { email }, data: { welcomeSent: true } })
  } else {
    if (!existing.welcomeSent) {
      await sendWelcomeEmail(email, firstName).catch(console.error)
    }
    await prisma.user.update({
      where: { email },
      data: { firstName, role, ...(existing.welcomeSent ? {} : { welcomeSent: true }) },
    })
  }
}
