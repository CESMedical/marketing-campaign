import { prisma } from './prisma'
import postsData from '@/content/posts.json'
import type { Post } from '@/types/post'

export async function syncPostContent() {
  const posts = postsData as Post[]
  let n = 0

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      create: {
        id:                   post.id,
        slug:                 post.slug,
        title:                post.title,
        caption:              post.caption,
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
        sortOrder:            post.sortOrder            ?? 0,
      },
      update: {
        title:                post.title,
        caption:              post.caption,
        cta:                  post.cta as object,
        pillar:               post.pillar,
        platforms:            post.platforms,
        // scheduledDate and weekNumber excluded — user-managed via canvas drag
        isCommercialPriority: post.isCommercialPriority,
        format:               post.format,
        service:              post.service              ?? null,
        productionLocation:   post.productionLocation   ?? null,
        productionLead:       post.productionLead       ?? null,
      },
    })
    n++
  }

  console.log(`[sync-post-content] ${n} posts synced from posts.json`)
}
