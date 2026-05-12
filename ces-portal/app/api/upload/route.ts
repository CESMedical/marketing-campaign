import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import { rateLimit } from '@/lib/rate-limit'
import { canUploadAsset } from '@/lib/roles'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
const MAX_BYTES = 10 * 1024 * 1024
type AllowedImageType = (typeof ALLOWED_TYPES)[number]

function isAllowedType(type: string): type is AllowedImageType {
  return ALLOWED_TYPES.includes(type as AllowedImageType)
}

function isAllowedImage(buffer: Buffer, type: AllowedImageType): boolean {
  if (type === 'image/jpeg') return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
  if (type === 'image/png')
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (type === 'image/webp') {
    return (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    )
  }
  if (type === 'image/gif') {
    const sig = buffer.subarray(0, 6).toString('ascii')
    return sig === 'GIF87a' || sig === 'GIF89a'
  }
  return false
}

// ── Cloudflare R2 (S3-compatible, zero egress fees) ──────────────────────────

function hasR2() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  )
}

async function uploadToR2(buffer: Buffer, mimeType: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')

  const accountId = process.env.R2_ACCOUNT_ID!
  const bucket    = process.env.R2_BUCKET!
  const ext       = mimeType.split('/')[1].replace('jpeg', 'jpg')
  const key       = `images/${randomUUID()}.${ext}`

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })

  await client.send(new PutObjectCommand({
    Bucket:      bucket,
    Key:         key,
    Body:        buffer,
    ContentType: mimeType,
  }))

  // R2_PUBLIC_URL is the custom domain or r2.dev public URL set on the bucket.
  const base = process.env.R2_PUBLIC_URL!.replace(/\/$/, '')
  return `${base}/${key}`
}

// ── Cloudinary (fallback) ─────────────────────────────────────────────────────

function hasCloudinary() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

async function uploadToCloudinary(buffer: Buffer, mimeType: string): Promise<string> {
  const { v2: cloudinary } = await import('cloudinary')
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'ces-portal',
        resource_type: 'image',
        type: 'upload',
        access_mode: 'public',
        format: mimeType === 'image/gif' ? 'gif' : 'webp',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'))
        resolve(result.secure_url)
      },
    )
    stream.end(buffer)
  })
}

// ── Local fallback (dev only) ─────────────────────────────────────────────────

async function uploadToLocal(buffer: Buffer, mimeType: string): Promise<string> {
  const { writeFileSync, mkdirSync } = await import('fs')
  const { join } = await import('path')
  const ext      = mimeType.split('/')[1].replace('jpeg', 'jpg')
  const filename = `${randomUUID()}.${ext}`
  const dir      = join(process.cwd(), 'public', 'uploads')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, filename), buffer)
  return `/uploads/${filename}`
}

// ── Handler ───────────────────────────────────────────────────────────────────

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

  try {
    let url: string
    if (hasR2())             url = await uploadToR2(buffer, file.type)
    else if (hasCloudinary()) url = await uploadToCloudinary(buffer, file.type)
    else                     url = await uploadToLocal(buffer, file.type)
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
