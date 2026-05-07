import type { Post as DbPost } from '@prisma/client'
import postsData from '@/content/posts.json'
import { prisma } from '@/lib/prisma'
import { Post } from '@/types/post'

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

function toPost(post: DbPost): Post {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    pillar: post.pillar as Post['pillar'],
    platforms: post.platforms as unknown as Post['platforms'],
    status: post.status as Post['status'],
    scheduledDate: post.scheduledDate,
    weekNumber: post.weekNumber,
    isCommercialPriority: post.isCommercialPriority,
    service: (post.service ?? undefined) as Post['service'],
    format: post.format as Post['format'],
    caption: post.caption,
    cta: post.cta as unknown as Post['cta'],
    asset: (post.asset ?? undefined) as unknown as Post['asset'],
    productionLocation: (post.productionLocation ?? undefined) as Post['productionLocation'],
    productionLead: (post.productionLead ?? undefined) as Post['productionLead'],
    clinicalReviewer: post.clinicalReviewer ?? undefined,
    brandReviewer: post.brandReviewer ?? undefined,
    approvedAt: post.approvedAt ?? undefined,
    imageUrl: post.imageUrl ?? undefined,
    notes: post.notes ?? undefined,
    tags: (post.tags ?? undefined) as unknown as Post['tags'],
  }
}

function jsonPosts(): Post[] {
  return postsData as Post[]
}

export async function loadPostsData(): Promise<Post[]> {
  if (!hasDatabase()) return jsonPosts()
  const posts = await prisma.post.findMany({
    orderBy: [{ scheduledDate: 'asc' }, { id: 'asc' }],
  })
  // If database is connected but empty, seed it and return JSON in the meantime
  if (posts.length === 0) {
    seedDatabase().catch(() => {})
    return jsonPosts()
  }
  return posts.map(toPost)
}

async function seedDatabase() {
  const posts = jsonPosts()
  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      create: {
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
        cta: post.cta as object,
        asset: post.asset ? (post.asset as object) : undefined,
        productionLocation: post.productionLocation ?? null,
        productionLead: post.productionLead ?? null,
        clinicalReviewer: post.clinicalReviewer ?? null,
        brandReviewer: post.brandReviewer ?? null,
        approvedAt: post.approvedAt ?? null,
        imageUrl: post.imageUrl ?? null,
        notes: post.notes ?? null,
        tags: post.tags ?? undefined,
      },
      update: {},
    })
  }
}

export async function getPostBySlugData(slug: string): Promise<Post | undefined> {
  if (!hasDatabase()) return jsonPosts().find((post) => post.slug === slug)
  const post = await prisma.post.findUnique({ where: { slug } })
  return post ? toPost(post) : undefined
}

export async function getAdjacentPostsData(slug: string): Promise<{
  prev?: Post
  next?: Post
}> {
  const all = await loadPostsData()
  const idx = all.findIndex((post) => post.slug === slug)
  if (idx === -1) return {}
  return {
    prev: idx > 0 ? all[idx - 1] : undefined,
    next: idx < all.length - 1 ? all[idx + 1] : undefined,
  }
}

export async function updatePostData(slug: string, updates: Partial<Post>): Promise<Post | undefined> {
  if (!hasDatabase()) return undefined
  const post = await prisma.post.update({
    where: { slug },
    data: {
      title: updates.title,
      platforms: updates.platforms,
      status: updates.status,
      scheduledDate: updates.scheduledDate,
      weekNumber: updates.weekNumber,
      format: updates.format,
      caption: updates.caption,
      imageUrl: updates.imageUrl,
      notes: updates.notes,
    },
  })
  return toPost(post)
}

export async function postExistsData(slug: string): Promise<boolean> {
  if (!hasDatabase()) return jsonPosts().some((post) => post.slug === slug)
  const count = await prisma.post.count({ where: { slug } })
  return count > 0
}

export function seedPostSlugs(): { slug: string }[] {
  return jsonPosts().map((post) => ({ slug: post.slug }))
}
