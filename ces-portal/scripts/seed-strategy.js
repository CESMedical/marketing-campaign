const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('seed-strategy: no DATABASE_URL, skipping')
    return
  }

  const fileUrl   = process.env.STRATEGY_PDF_URL
  const fileName  = process.env.STRATEGY_PDF_NAME  ?? 'CES Medical Social Planner (Updated-April).pdf'
  const title     = process.env.STRATEGY_PDF_TITLE ?? 'CES Medical Social Planner'

  if (!fileUrl) {
    console.log('seed-strategy: STRATEGY_PDF_URL not set, skipping')
    return
  }

  try {
    // Find the first (default) roadmap
    const roadmap = await prisma.roadmap.findFirst({ orderBy: { createdAt: 'asc' } })

    if (!roadmap) {
      console.log('seed-strategy: no roadmap found, skipping')
      return
    }

    // Only seed if not already set — never overwrite user changes
    if (roadmap.strategyFileUrl) {
      console.log(`seed-strategy: strategy already set on "${roadmap.title}", skipping`)
      return
    }

    await prisma.roadmap.update({
      where: { id: roadmap.id },
      data: {
        strategyTitle: title,
        strategyFileUrl: fileUrl,
        strategyFileName: fileName,
        strategyUploadedBy: 'seed',
        strategyUploadedAt: new Date(),
      },
    })

    console.log(`seed-strategy: set "${title}" on roadmap "${roadmap.title}"`)
  } catch (err) {
    console.error('seed-strategy: failed —', err.message)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
