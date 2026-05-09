import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getRoadmapData } from '@/lib/roadmap-data'

function extractPublicId(cloudinaryUrl: string): string {
  // https://res.cloudinary.com/{cloud}/raw/upload/v{ver}/{public_id}
  const match = cloudinaryUrl.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/)
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

  // Local dev files — redirect directly
  if (!roadmap.strategyFileUrl.includes('res.cloudinary.com')) {
    return NextResponse.redirect(roadmap.strategyFileUrl)
  }

  const { v2: cloudinary } = await import('cloudinary')
  configureCloudinary(cloudinary)

  const publicId  = extractPublicId(roadmap.strategyFileUrl)
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60

  // Build download URL using the admin-API signature method (private_download_url)
  // This works regardless of account-level delivery restrictions.
  const ext         = (roadmap.strategyFileName ?? 'document').split('.').pop() ?? 'pdf'
  // Cloudinary stores the extension as part of the public_id for raw files;
  // private_download_url appends the format separately, so strip it to avoid doubling.
  const publicIdBase = publicId.endsWith(`.${ext}`) ? publicId.slice(0, -(ext.length + 1)) : publicId

  const downloadUrl: string = (cloudinary.utils as unknown as {
    private_download_url: (id: string, fmt: string, opts: object) => string
  }).private_download_url(publicIdBase, ext, {
    resource_type: 'raw',
    expires_at:    expiresAt,
    attachment:    mode === 'download',
  })

  try {
    const upstream = await fetch(downloadUrl)

    if (!upstream.ok) {
      const body = await upstream.text().catch(() => '')
      console.error('[strategy/file] Cloudinary error', upstream.status, body.slice(0, 400))
      // Return diagnostic info in non-prod or fall through to the generic error
      return NextResponse.json({
        error:            'Failed to fetch document',
        cloudinaryStatus: upstream.status,
        hint:             body.slice(0, 300),
      }, { status: 502 })
    }

    const contentType = upstream.headers.get('Content-Type') ?? 'application/octet-stream'
    const fileName    = (roadmap.strategyFileName ?? 'document').replace(/"/g, '')

    const headers = new Headers()
    headers.set('Content-Type', contentType)
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
