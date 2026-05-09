import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getRoadmapData } from '@/lib/roadmap-data'

function extractPublicId(cloudinaryUrl: string): string {
  // https://res.cloudinary.com/{cloud}/raw/upload/v{ver}/{public_id}
  const match = cloudinaryUrl.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/)
  return match?.[1] ?? ''
}

async function buildSignedUrl(fileUrl: string): Promise<string> {
  const { v2: cloudinary } = await import('cloudinary')
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  })

  const publicId  = extractPublicId(fileUrl)
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour

  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type:          'upload',
    secure:        true,
    sign_url:      true,
    expires_at:    expiresAt,
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id }  = await params
  const mode    = request.nextUrl.searchParams.get('mode') ?? 'view'

  const roadmap = await getRoadmapData(id)
  if (!roadmap?.strategyFileUrl) {
    return NextResponse.json({ error: 'No strategy document' }, { status: 404 })
  }

  // Local files (dev fallback) — redirect directly
  if (!roadmap.strategyFileUrl.includes('res.cloudinary.com')) {
    return NextResponse.redirect(roadmap.strategyFileUrl)
  }

  try {
    // Generate signed URL server-side then stream the file through this route.
    // This means the browser never talks to Cloudinary directly, bypassing
    // any account-level delivery restrictions entirely.
    const signed = await buildSignedUrl(roadmap.strategyFileUrl)

    const upstream = await fetch(signed)
    if (!upstream.ok) {
      console.error('[strategy/file] upstream fetch failed', upstream.status, signed)
      return NextResponse.json({ error: 'Failed to fetch document' }, { status: 502 })
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
    // Allow browser to cache for 55 min (slightly less than the signed URL TTL)
    headers.set('Cache-Control', 'private, max-age=3300')

    return new NextResponse(upstream.body, { status: 200, headers })
  } catch (err) {
    console.error('[strategy/file] error', err)
    return NextResponse.json({ error: 'Failed to serve document' }, { status: 500 })
  }
}
