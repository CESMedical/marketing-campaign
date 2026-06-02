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

  // Local dev: serve from public folder directly.
  if (process.env.NODE_ENV !== 'production' && roadmap.strategyFileUrl.startsWith('/uploads/docs/')) {
    return NextResponse.redirect(roadmap.strategyFileUrl)
  }

  let strategyUrl: URL
  try {
    strategyUrl = new URL(roadmap.strategyFileUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid strategy document URL' }, { status: 400 })
  }
  if (strategyUrl.protocol !== 'https:') {
    return NextResponse.json({ error: 'Invalid strategy document URL' }, { status: 400 })
  }

  // Cloudflare R2 public bucket — redirect directly, no signing needed.
  const r2PublicUrl = process.env.R2_PUBLIC_URL
  const isR2 =
    strategyUrl.hostname.endsWith('.r2.dev') ||
    (r2PublicUrl && (() => { try { return strategyUrl.hostname === new URL(r2PublicUrl).hostname } catch { return false } })())
  if (isR2) {
    return NextResponse.redirect(roadmap.strategyFileUrl, { status: 302 })
  }

  // Cloudinary authenticated asset — generate a signed URL.
  if (
    strategyUrl.hostname !== 'res.cloudinary.com' ||
    !strategyUrl.pathname.includes('/raw/authenticated/')
  ) {
    return NextResponse.json({ error: 'Unsupported document storage' }, { status: 403 })
  }

  const { v2: cloudinary } = await import('cloudinary')
  configureCloudinary(cloudinary)

  const publicId  = extractPublicId(roadmap.strategyFileUrl)
  if (!publicId) {
    return NextResponse.json({ error: 'Invalid strategy document' }, { status: 400 })
  }
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60

  // Use cloudinary.url() with sign_url to generate a signed delivery URL
  // (res.cloudinary.com). private_download_url generates an api.cloudinary.com
  // endpoint URL that Cloudinary has been returning "Resource not found" for.
  const signedUrl: string = cloudinary.url(publicId, {
    resource_type: 'raw',
    type:          'authenticated',
    sign_url:      true,
    secure:        true,
    expires_at:    expiresAt,
  })

  return NextResponse.redirect(signedUrl, { status: 302 })
}
