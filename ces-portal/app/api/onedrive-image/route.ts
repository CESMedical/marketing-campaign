import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

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

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shareUrl = req.nextUrl.searchParams.get('url')
  if (!shareUrl) return NextResponse.json({ error: 'Missing url param' }, { status: 400 })

  // Validate it looks like a OneDrive / SharePoint URL
  let isOneDrive = false
  try {
    const u = new URL(shareUrl)
    isOneDrive =
      u.hostname.endsWith('.sharepoint.com') ||
      u.hostname === 'onedrive.live.com' ||
      u.hostname === '1drv.ms' ||
      u.hostname.endsWith('.1drv.ms')
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }
  if (!isOneDrive) return NextResponse.json({ error: 'Not a OneDrive URL' }, { status: 400 })

  const token = await getGraphToken()
  if (!token) return NextResponse.json({ error: 'Could not get Graph token' }, { status: 502 })

  // Try fetching via the Graph shares endpoint (works for sharing links of all types).
  const encoded = encodeShareUrl(shareUrl)
  const graphRes = await fetch(
    `https://graph.microsoft.com/v1.0/shares/${encoded}/driveItem/content`,
    { headers: { Authorization: `Bearer ${token}` }, redirect: 'follow' }
  )

  if (!graphRes.ok) {
    // Fallback: try fetching the URL directly (works for direct SharePoint file URLs
    // when the app has Sites.Read.All or the file is publicly accessible).
    const directRes = await fetch(shareUrl, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'follow',
    })
    if (!directRes.ok) {
      return NextResponse.json(
        { error: `Graph returned ${graphRes.status}; direct fetch returned ${directRes.status}` },
        { status: 502 }
      )
    }
    const ct = directRes.headers.get('content-type') ?? 'image/jpeg'
    return new NextResponse(directRes.body, {
      headers: { 'Content-Type': ct, 'Cache-Control': 'private, max-age=3600' },
    })
  }

  const contentType = graphRes.headers.get('content-type') ?? 'image/jpeg'
  return new NextResponse(graphRes.body, {
    headers: { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=3600' },
  })
}
