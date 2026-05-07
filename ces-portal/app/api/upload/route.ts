import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import { rateLimit } from '@/lib/rate-limit'
import { canUploadAsset } from '@/lib/roles'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
type AllowedImageType = (typeof ALLOWED_TYPES)[number]

function isAllowedType(type: string): type is AllowedImageType {
  return ALLOWED_TYPES.includes(type as AllowedImageType)
}

function isAllowedImage(buffer: Buffer, type: AllowedImageType): boolean {
  if (type === 'image/jpeg') return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
  if (type === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (type === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  }
  if (type === 'image/gif') {
    const signature = buffer.subarray(0, 6).toString('ascii')
    return signature === 'GIF87a' || signature === 'GIF89a'
  }
  return false
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || !canUploadAsset(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!rateLimit({ key: `upload:${session.user.email ?? 'unknown'}`, limit: 10, windowMs: 5 * 60_000 })) {
    return NextResponse.json({ error: 'Too many uploads' }, { status: 429 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!isAllowedType(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP or GIF allowed' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
  }
  if (!isAllowedImage(buffer, file.type)) {
    return NextResponse.json({ error: 'Invalid image file' }, { status: 400 })
  }

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const filename = `${randomUUID()}.${ext}`
  const dir = join(process.cwd(), 'public', 'uploads')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, filename), buffer)

  return NextResponse.json({ url: `/uploads/${filename}` })
}
