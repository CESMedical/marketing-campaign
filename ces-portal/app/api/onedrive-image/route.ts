import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canUploadAsset } from '@/lib/roles'
import { rateLimit } from '@/lib/rate-limit'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])

function configuredShareHosts(): string[] {
  const hosts = (process.env.ONEDRIVE_ALLOWED_HOSTS ?? 'alastralabs.sharepoint.com,cesmedical.sharepoint.com,onedrive.live.com,1drv.ms,*.1drv.ms')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
  return Array.from(new Set(hosts))
}

function hostMatches(hostname: string, allowedHosts: string[]): boolean {
  const host = hostname.toLowerCase()
  return allowedHosts.some((allowed) => {
    if (allowed.startsWith('*.')) return host.endsWith(allowed.slice(1))
    return host === allowed
  })
}

function canFetchHost(hostname: string, allowedShareHosts: string[]): boolean {
  return hostname.toLowerCase() === 'graph.microsoft.com' || hostMatches(hostname, allowedShareHosts)
}

// Encode a sharing URL into the Graph "shares" token format.
function encodeShareUrl(url: string): string {
  const b64 = Buffer.from(url).toString('base64url')
  return `u!${b64}`
}

// Get an app-only Microsoft Graph access token using client credentials.
async function getGraphToken(): Promise<string | null> {
  const { AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET } = process.env
  if (!AZURE_AD_TENANT_ID || !AZURE_AD_CLIENT_ID || !AZURE_AD_CLIENT_SECRET) return null

  const res = await fetch(
    `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AZURE_AD_CLIENT_ID,
        client_secret: AZURE_AD_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
      }),
    }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

async function fetchWithAllowedRedirects(
  input: string,
  headers: HeadersInit,
  allowedShareHosts: string[],
): Promise<Response> {
  let current = input

  for (let i = 0; i < 4; i += 1) {
    const url = new URL(current)
    if (url.protocol !== 'https:' || !canFetchHost(url.hostname, allowedShareHosts)) {
      throw new Error('Blocked upstream host')
    }

    const response = await fetch(url, { headers, redirect: 'manual' })
    if (!REDIRECT_STATUSES.has(response.status)) return response

    const location = response.headers.get('location')
    if (!location) return response
    current = new URL(location, url).toString()
  }

  throw new Error('Too many upstream redirects')
}

async function imageResponse(upstream: Response): Promise<NextResponse> {
  if (!upstream.ok) {
    return NextResponse.json({ error: 'Unable to fetch image' }, { status: 502 })
  }

  const contentType = (upstream.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    return NextResponse.json({ error: 'Upstream file is not an allowed image type' }, { status: 415 })
  }

  const declaredLength = Number(upstream.headers.get('content-length') ?? '0')
  if (declaredLength > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Image too large' }, { status: 413 })
  }

  const buffer = Buffer.from(await upstream.arrayBuffer())
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Image too large' }, { status: 413 })
  }

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canUploadAsset(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!rateLimit({ key: `onedrive:${session.user.email ?? 'unknown'}`, limit: 30, windowMs: 5 * 60_000 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const shareUrl = req.nextUrl.searchParams.get('url')
  if (!shareUrl) return NextResponse.json({ error: 'Missing url param' }, { status: 400 })
  if (shareUrl.length > 2000) return NextResponse.json({ error: 'URL too long' }, { status: 400 })

  // Validate it looks like a OneDrive / SharePoint URL
  const allowedShareHosts = configuredShareHosts()
  try {
    const u = new URL(shareUrl)
    if (u.protocol !== 'https:' || !hostMatches(u.hostname, allowedShareHosts)) {
      return NextResponse.json({ error: 'OneDrive host is not allowed' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const token = await getGraphToken()
  if (!token) return NextResponse.json({ error: 'Could not get Graph token' }, { status: 502 })

  // Try fetching via the Graph shares endpoint (works for sharing links of all types).
  const encoded = encodeShareUrl(shareUrl)
  const graphRes = await fetchWithAllowedRedirects(
    `https://graph.microsoft.com/v1.0/shares/${encoded}/driveItem/content`,
    { Authorization: `Bearer ${token}` },
    allowedShareHosts,
  )

  if (!graphRes.ok) {
    // Fallback: try fetching the URL directly (works for direct SharePoint file URLs
    // when the app has Sites.Read.All or the file is publicly accessible).
    const directRes = await fetchWithAllowedRedirects(
      shareUrl,
      { Authorization: `Bearer ${token}` },
      allowedShareHosts,
    )
    return imageResponse(directRes)
  }

  return imageResponse(graphRes)
}

export async function HEAD(req: NextRequest) {
  const response = await GET(req)
  return new NextResponse(null, { status: response.status, headers: response.headers })
}
