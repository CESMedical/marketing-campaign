import { prisma } from './prisma'

export interface RoadmapMeta {
  id: string
  title: string
  postCount: number
  createdAt: string
}

export async function loadRoadmapsData(): Promise<RoadmapMeta[]> {
  if (!process.env.DATABASE_URL) return []
  const rows = await prisma.roadmap.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { posts: true } } },
  })
  return rows.map(r => ({ id: r.id, title: r.title, postCount: r._count.posts, createdAt: r.createdAt.toISOString() }))
}

export async function createRoadmapData(title: string): Promise<RoadmapMeta> {
  const r = await prisma.roadmap.create({
    data: { title },
    include: { _count: { select: { posts: true } } },
  })
  return { id: r.id, title: r.title, postCount: 0, createdAt: r.createdAt.toISOString() }
}

export async function updateRoadmapData(id: string, title: string): Promise<RoadmapMeta> {
  const r = await prisma.roadmap.update({
    where: { id },
    data: { title },
    include: { _count: { select: { posts: true } } },
  })
  return { id: r.id, title: r.title, postCount: r._count.posts, createdAt: r.createdAt.toISOString() }
}

export async function deleteRoadmapData(id: string): Promise<void> {
  await prisma.roadmap.delete({ where: { id } })
}
