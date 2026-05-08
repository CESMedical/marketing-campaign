import { prisma } from './prisma'

export async function logEmail(opts: {
  type: string
  to: string
  subject: string
  postSlug?: string
  triggeredBy?: string
}): Promise<void> {
  if (!process.env.DATABASE_URL) return
  await prisma.emailLog.create({ data: opts }).catch(console.error)
}
