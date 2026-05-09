import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getRoadmapData } from '@/lib/roadmap-data'

function extractPublicId(cloudinaryUrl: string): string {
  // https://res.cloudinary.com/{cloud}/raw/upload/v{ver}/{public_id}
  const match = cloudinaryUrl.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/)
  return match?.[1] ?? ''
}

async function signedUrl(fileUrl: string, forDownload: boolean, fileName: string | null): Promise<string> {
  const { v2: cloudinary } = await import('cloudinary')
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  const publicId = extractPublicId(fileUrl)
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour

  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'upload',
    sign_url: true,
    expires_at: expiresAt,
    ...(forDownload ? { flags: `attachment:${(fileName ?? 'document').replace(/\s+/g, '_')}` } : {}),
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const mode = request.nextUrl.searchParams.get('mode') ?? 'view'

  const roadmap = await getRoadmapData(id)
  if (!roadmap?.strategyFileUrl) {
    return NextResponse.json({ error: 'No strategy document' }, { status: 404 })
  }

  // For local files (non-Cloudinary), redirect directly
  if (!roadmap.strategyFileUrl.includes('res.cloudinary.com')) {
    return NextResponse.redirect(roadmap.strategyFileUrl)
  }

  try {
    const url = await signedUrl(roadmap.strategyFileUrl, mode === 'download', roadmap.strategyFileName ?? null)
    return NextResponse.redirect(url)
  } catch {
    return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 })
  }
}
