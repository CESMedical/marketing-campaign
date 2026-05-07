const { PrismaClient } = require('@prisma/client')
const posts = require('../content/posts.json')
let comments = []

try {
  comments = require('../content/comments.json')
} catch {
  comments = []
}

const prisma = new PrismaClient()

async function main() {
  let createdPosts = 0
  let createdComments = 0

  for (const post of posts) {
    const exists = await prisma.post.findUnique({
      where: { slug: post.slug },
      select: { slug: true },
    })
    if (exists) continue

    await prisma.post.create({
      data: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        pillar: post.pillar,
        platforms: post.platforms,
        status: post.status,
        scheduledDate: post.scheduledDate,
        weekNumber: post.weekNumber,
        isCommercialPriority: post.isCommercialPriority,
        service: post.service ?? null,
        format: post.format,
        caption: post.caption,
        cta: post.cta,
        asset: post.asset ?? undefined,
        productionLocation: post.productionLocation ?? null,
        productionLead: post.productionLead ?? null,
        clinicalReviewer: post.clinicalReviewer ?? null,
        brandReviewer: post.brandReviewer ?? null,
        approvedAt: post.approvedAt ?? null,
        imageUrl: post.imageUrl ?? null,
        notes: post.notes ?? null,
        tags: post.tags ?? undefined,
      },
    })
    createdPosts += 1
  }

  for (const comment of comments) {
    const exists = await prisma.comment.findUnique({
      where: { id: comment.id },
      select: { id: true },
    })
    if (exists) continue

    await prisma.comment.create({
      data: {
        id: comment.id,
        postSlug: comment.postSlug,
        authorName: comment.authorName,
        authorEmail: comment.authorEmail,
        text: comment.text,
        createdAt: new Date(comment.createdAt),
      },
    })
    createdComments += 1
  }

  console.log(`Seeded ${createdPosts} posts and ${createdComments} comments.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
