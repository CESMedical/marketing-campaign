import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getRoadmapData } from '@/lib/roadmap-data'

function extractPublicId(cloudinaryUrl: string): string {
  // https://res.cloudinary.com/{cloud}/raw/authenticated/v{ver}/{public_id}
  const match = cloudinaryUrl.match(/\/raw\/authenticated\/(?:v\d+\/)?(.+)$/)
  return match?.[1] ?? ''
}

function configureCloudinary(cloudinary: { config: (opts: object) => void }) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const mode   = request.nextUrl.searchParams.get('mode') ?? 'view'

  const roadmap = await getRoadmapData(id)
  if (!roadmap?.strategyFileUrl) {
    return NextResponse.json({ error: 'No strategy document' }, { status: 404 })
  }

  if (mode !== 'view' && mode !== 'download') {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  // Local dev files only. Production documents should be authenticated Cloudinary assets.
  if (process.env.NODE_ENV !== 'production' && roadmap.strategyFileUrl.startsWith('/uploads/docs/')) {
    return NextResponse.redirect(roadmap.strategyFileUrl)
  }

  let strategyUrl: URL
  try {
    strategyUrl = new URL(roadmap.strategyFileUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid strategy document URL' }, { status: 400 })
  }
  if (
    strategyUrl.protocol !== 'https:' ||
    strategyUrl.hostname !== 'res.cloudinary.com' ||
    !strategyUrl.pathname.includes('/raw/authenticated/')
  ) {
    return NextResponse.json({ error: 'Strategy document is not stored privately' }, { status: 403 })
  }

  const { v2: cloudinary } = await import('cloudinary')
  configureCloudinary(cloudinary)

  const publicId  = extractPublicId(roadmap.strategyFileUrl)
  if (!publicId) {
    return NextResponse.json({ error: 'Invalid strategy document' }, { status: 400 })
  }
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60

  // Build download URL using the admin-API signature method (private_download_url)
  // This works regardless of account-level delivery restrictions.
  // For Cloudinary raw files the extension IS part of the public_id.
  // Pass the full publicId and an empty format so the SDK doesn't double-append it.
  const downloadUrl: string = (cloudinary.utils as unknown as {
    private_download_url: (id: string, fmt: string, opts: object) => string
  }).private_download_url(publicId, '', {
    resource_type: 'raw',
    type:          'authenticated',
    expires_at:    expiresAt,
    attachment:    mode === 'download',
  })

  try {
    const upstream = await fetch(downloadUrl)

    if (!upstream.ok) {
      const body = await upstream.text().catch(() => '')
      console.error('[strategy/file] Cloudinary error', upstream.status, body.slice(0, 400))
      return NextResponse.json({ error: 'Failed to fetch document' }, { status: 502 })
    }

    const contentType = upstream.headers.get('Content-Type') ?? 'application/octet-stream'
    const fileName    = (roadmap.strategyFileName ?? 'document').replace(/"/g, '')

    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set(
      'Content-Disposition',
      mode === 'download'
        ? `attachment; filename="${fileName}"`
        : `inline; filename="${fileName}"`,
    )
    headers.set('Cache-Control', 'private, max-age=3300')

    return new NextResponse(upstream.body, { status: 200, headers })
  } catch (err) {
    console.error('[strategy/file] fetch threw', err)
    return NextResponse.json({ error: 'Failed to serve document' }, { status: 500 })
  }
}
