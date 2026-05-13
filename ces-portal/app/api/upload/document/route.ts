import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import { canEditPost } from '@/lib/roles'
import { rateLimit } from '@/lib/rate-limit'

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
}
const MAX_BYTES = 50 * 1024 * 1024 // 50 MB
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04])
const OLE_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0])

function hasCloudinary() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
}

async function uploadToCloudinary(buffer: Buffer, originalName: string): Promise<string> {
  const { v2: cloudinary } = await import('cloudinary')
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  return new Promise((resolve, reject) => {
    const safeName = originalName.replace(/[^a-z0-9._-]/gi, '_').slice(0, 80)
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'ces-portal/strategy',
        resource_type: 'raw',
        type: 'authenticated',
        access_mode: 'authenticated',
        public_id: `${Date.now()}-${safeName}`,
        use_filename: false,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'))
        resolve(result.secure_url)
      },
    )
    stream.end(buffer)
  })
}

async function uploadToLocal(buffer: Buffer, originalName: string, ext: string): Promise<string> {
  const { writeFileSync, mkdirSync } = await import('fs')
  const { join } = await import('path')
  const filename = `${randomUUID()}.${ext}`
  const dir = join(process.cwd(), 'public', 'uploads', 'docs')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, filename), buffer)
  return `/uploads/docs/${filename}`
}

function isAllowedDocument(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'application/pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-'
  }

  if (mimeType.includes('openxmlformats-officedocument')) {
    return buffer.subarray(0, 4).equals(ZIP_SIGNATURE)
  }

  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.ms-powerpoint'
  ) {
    return buffer.subarray(0, 4).equals(OLE_SIGNATURE)
  }

  return false
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || !canEditPost(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!rateLimit({ key: `doc-upload:${session.user.email ?? 'unknown'}`, limit: 10, windowMs: 10 * 60_000 })) {
    return NextResponse.json({ error: 'Too many uploads' }, { status: 429 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) return NextResponse.json({ error: 'Unsupported file type. Allowed: PDF, Word, Excel, PowerPoint' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  if (buffer.byteLength > MAX_BYTES) return NextResponse.json({ error: 'File too large (max 50 MB)' }, { status: 400 })
  if (!isAllowedDocument(buffer, file.type)) {
    return NextResponse.json({ error: 'Invalid document file' }, { status: 400 })
  }
  if (!hasCloudinary() && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Document storage is not configured' }, { status: 500 })
  }

  try {
    const url = hasCloudinary()
      ? await uploadToCloudinary(buffer, file.name)
      : await uploadToLocal(buffer, file.name, ext)
    return NextResponse.json({ url, fileName: file.name })
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
