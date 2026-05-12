export async function register() {
  // Only run in Node.js runtime (not Edge), and only when a DB is configured.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (!process.env.DATABASE_URL) return

  try {
    const { syncPostContent } = await import('./lib/sync-post-content')
    await syncPostContent()
  } catch (err) {
    // Never crash the server over a sync failure — log and move on.
    console.error('[instrumentation] post content sync failed:', err)
  }
}
