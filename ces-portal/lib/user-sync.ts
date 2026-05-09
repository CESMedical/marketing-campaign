import { prisma } from './prisma'
import { resolveRole } from './roles'

export async function syncUserOnSignIn(email: string, displayName: string): Promise<void> {
  if (!process.env.DATABASE_URL) return
  const firstName = (displayName ?? email).split(/[\s@]/)[0]
  const role = resolveRole(email)

  const existing = await prisma.user.findUnique({ where: { email } })

  if (!existing) {
    await prisma.user.create({ data: { email, firstName, role, welcomeSent: false } })
  } else {
    await prisma.user.update({ where: { email }, data: { firstName, role } })
  }
}
