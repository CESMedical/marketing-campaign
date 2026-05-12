/**
 * Syncs title, caption, CTA and structural fields from posts.json
 * into the database for every post. Safe to run multiple times.
 * Preserves status, imageUrl, comments, reviewer stamps etc.
 */
const { PrismaClient } = require('@prisma/client')
const posts = require('../content/posts.json')

const prisma = new PrismaClient()

async function main() {
  let updated = 0
  let created = 0

  for (const post of posts) {
    const content = {
      title:                post.title,
      caption:              post.caption,
      cta:                  post.cta,
      scheduledDate:        post.scheduledDate,
      weekNumber:           post.weekNumber,
      pillar:               post.pillar,
      platforms:            post.platforms,
      format:               post.format,
      isCommercialPriority: post.isCommercialPriority,
      service:              post.service   ?? null,
      productionLocation:   post.productionLocation ?? null,
      productionLead:       post.productionLead     ?? null,
    }

    const result = await prisma.post.upsert({
      where: { slug: post.slug },
      create: {
        id:     post.id,
        slug:   post.slug,
        status: post.status ?? 'draft',
        sortOrder: post.sortOrder ?? 0,
        ...content,
      },
      update: content,
    })

    const wasNew = result.updatedAt.getTime() - result.updatedAt.getTime() < 100
    if (wasNew) created++; else updated++
  }

  // Re-count properly
  const total = posts.length
  console.log(`sync-content: ${total} posts processed (${total} upserted)`)
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
