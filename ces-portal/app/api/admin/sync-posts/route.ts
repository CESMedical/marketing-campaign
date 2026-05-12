import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import postsData from '@/content/posts.json'
import type { Post } from '@/types/post'

// One-time admin endpoint: force-syncs every post's title, caption and CTA
// from posts.json into the database, preserving all other fields (status,
// imageUrl, comments, reviewer stamps, etc.) that users have set via the app.
//
// Only callable by admins. Safe to run multiple times.

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const posts = postsData as Post[]
  const results: { slug: string; status: 'updated' | 'created' | 'skipped' }[] = []

  for (const post of posts) {
    try {
      const existing = await prisma.post.findUnique({ where: { slug: post.slug } })

      if (existing) {
        await prisma.post.update({
          where: { slug: post.slug },
          data: {
            title:       post.title,
            caption:     post.caption,
            cta:         post.cta as object,
            // also sync scheduling and structural fields
            scheduledDate:       post.scheduledDate,
            weekNumber:          post.weekNumber,
            pillar:              post.pillar,
            platforms:           post.platforms,
            format:              post.format,
            isCommercialPriority: post.isCommercialPriority,
            service:             post.service ?? null,
            productionLocation:  post.productionLocation ?? null,
            productionLead:      post.productionLead ?? null,
          },
        })
        results.push({ slug: post.slug, status: 'updated' })
      } else {
        await prisma.post.create({
          data: {
            id:                  post.id,
            slug:                post.slug,
            title:               post.title,
            pillar:              post.pillar,
            platforms:           post.platforms,
            status:              post.status,
            scheduledDate:       post.scheduledDate,
            weekNumber:          post.weekNumber,
            isCommercialPriority: post.isCommercialPriority,
            service:             post.service ?? null,
            format:              post.format,
            caption:             post.caption,
            cta:                 post.cta as object,
            productionLocation:  post.productionLocation ?? null,
            productionLead:      post.productionLead ?? null,
            sortOrder:           post.sortOrder ?? 0,
          },
        })
        results.push({ slug: post.slug, status: 'created' })
      }
    } catch {
      results.push({ slug: post.slug, status: 'skipped' })
    }
  }

  const summary = {
    updated: results.filter(r => r.status === 'updated').length,
    created: results.filter(r => r.status === 'created').length,
    skipped: results.filter(r => r.status === 'skipped').length,
  }

  return NextResponse.json({ ok: true, summary, results })
}
