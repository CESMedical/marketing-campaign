import { prisma } from './prisma'

export interface RoadmapMeta {
  id: string
  title: string
  postCount: number
  createdAt: string
  strategyTitle?: string
  strategyFileUrl?: string
  strategyFileName?: string
  strategyUploadedAt?: string
  strategyUploadedBy?: string
}

function toMeta(r: {
  id: string; title: string; createdAt: Date; updatedAt: Date
  strategyTitle: string | null; strategyFileUrl: string | null
  strategyFileName: string | null; strategyUploadedBy: string | null
  strategyUploadedAt: Date | null
  _count: { posts: number }
}): RoadmapMeta {
  return {
    id: r.id,
    title: r.title,
    postCount: r._count.posts,
    createdAt: r.createdAt.toISOString(),
    strategyTitle: r.strategyTitle ?? undefined,
    strategyFileUrl: r.strategyFileUrl ?? undefined,
    strategyFileName: r.strategyFileName ?? undefined,
    strategyUploadedAt: r.strategyUploadedAt?.toISOString(),
    strategyUploadedBy: r.strategyUploadedBy ?? undefined,
  }
}

const INCLUDE = { _count: { select: { posts: true } } } as const

export async function loadRoadmapsData(): Promise<RoadmapMeta[]> {
  if (!process.env.DATABASE_URL) return []
  const rows = await prisma.roadmap.findMany({ orderBy: { createdAt: 'asc' }, include: INCLUDE })
  return rows.map(toMeta)
}

export async function getRoadmapData(id: string): Promise<RoadmapMeta | null> {
  if (!process.env.DATABASE_URL) return null
  const r = await prisma.roadmap.findUnique({ where: { id }, include: INCLUDE })
  return r ? toMeta(r) : null
}

export async function createRoadmapData(title: string): Promise<RoadmapMeta> {
  const r = await prisma.roadmap.create({ data: { title }, include: INCLUDE })
  return toMeta(r)
}

export async function updateRoadmapData(id: string, title: string): Promise<RoadmapMeta> {
  const r = await prisma.roadmap.update({ where: { id }, data: { title }, include: INCLUDE })
  return toMeta(r)
}

export async function updateStrategyData(id: string, data: {
  strategyTitle?: string
  strategyFileUrl?: string
  strategyFileName?: string
  strategyUploadedBy?: string
}): Promise<RoadmapMeta> {
  const r = await prisma.roadmap.update({
    where: { id },
    data: { ...data, strategyUploadedAt: data.strategyFileUrl ? new Date() : undefined },
    include: INCLUDE,
  })
  return toMeta(r)
}

export async function deleteRoadmapData(id: string): Promise<void> {
  await prisma.roadmap.delete({ where: { id } })
}
