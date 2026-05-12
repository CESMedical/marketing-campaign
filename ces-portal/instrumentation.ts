export async function register() {
  // Only run in Node.js runtime (not Edge), and only when a DB is configured.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (!process.env.DATABASE_URL) return

  try {
    const { syncPostContent } = await import('./lib/sync-post-content')
    await syncPostContent()
  } catch (err) {
    console.error('[instrumentation] post content sync failed:', err)
  }

  try {
    const { prisma } = await import('./lib/prisma')
    const count = await prisma.roadmap.count()
    if (count === 0) {
      await prisma.roadmap.create({ data: { title: 'CES May–Aug 2026' } })
      console.log('[instrumentation] created default roadmap')
    }
  } catch (err) {
    console.error('[instrumentation] roadmap seed failed:', err)
  }
}
