import { prisma } from './prisma'
import postsData from '@/content/posts.json'
import type { Post } from '@/types/post'

export async function syncPostContent() {
  const posts = postsData as Post[]

  // Ensure all posts are associated with the default roadmap.
  // New posts created by the sync must have a roadmapId or they will be
  // invisible when the canvas queries with ?r=<id>.
  const defaultRoadmap = await prisma.roadmap.findFirst({ orderBy: { createdAt: 'asc' } })
  const defaultRoadmapId = defaultRoadmap?.id ?? null

  let n = 0

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      create: {
        id:                   post.id,
        slug:                 post.slug,
        title:                post.title,
        caption:              post.caption,
        notes:                (post as unknown as Record<string, unknown>).notes as string ?? null,
        cta:                  post.cta as object,
        pillar:               post.pillar,
        platforms:            post.platforms,
        status:               post.status,
        scheduledDate:        post.scheduledDate,
        weekNumber:           post.weekNumber,
        isCommercialPriority: post.isCommercialPriority,
        format:               post.format,
        service:              post.service              ?? null,
        productionLocation:   post.productionLocation   ?? null,
        productionLead:       post.productionLead       ?? null,
        videoRelationship:    post.videoRelationship     ?? null,
        videoReference:       post.videoReference        ?? null,
        linkedInAccount:      post.linkedInAccount       ?? null,
        linkedInHook:         post.linkedInHook          ?? null,
        sortOrder:            post.sortOrder             ?? 0,
        roadmapId:            defaultRoadmapId,
      },
      update: {
        title:                post.title,
        caption:              post.caption,
        cta:                  post.cta as object,
        pillar:               post.pillar,
        platforms:            post.platforms,
        // scheduledDate and weekNumber are authoritative from posts.json.
        // Canvas drags persist until the next deploy, at which point
        // the schedule from posts.json takes precedence.
        scheduledDate:        post.scheduledDate,
        weekNumber:           post.weekNumber,
        isCommercialPriority: post.isCommercialPriority,
        format:               post.format,
        service:              post.service              ?? null,
        productionLocation:   post.productionLocation   ?? null,
        productionLead:       post.productionLead       ?? null,
        videoRelationship:    post.videoRelationship     ?? null,
        videoReference:       post.videoReference        ?? null,
        linkedInAccount:      post.linkedInAccount       ?? null,
        linkedInHook:         post.linkedInHook          ?? null,
      },
    })
    n++
  }

  // Backfill any existing posts that somehow have no roadmapId.
  if (defaultRoadmapId) {
    await prisma.post.updateMany({
      where: { roadmapId: null },
      data:  { roadmapId: defaultRoadmapId },
    })
  }

  // Remove any DB posts whose slugs no longer exist in posts.json.
  // This cleans up old IG/FB/LI/YT prefixed records after the P-number unification.
  const validSlugs = posts.map(p => p.slug)
  const stale = await prisma.post.deleteMany({
    where: { slug: { notIn: validSlugs } },
  })
  if (stale.count > 0) {
    console.log(`[sync-post-content] ${stale.count} stale posts removed (slug no longer in posts.json)`)
  }

  console.log(`[sync-post-content] ${n} posts synced from posts.json`)
}
