import { Suspense } from 'react';
import { loadPostsData } from '@/lib/post-data';
import { loadRoadmapsData } from '@/lib/roadmap-data';
import { RoadmapClient } from '@/components/roadmap/RoadmapClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ view?: string; r?: string }>
}

export default async function RoadmapPage({ searchParams }: PageProps) {
  const { r: roadmapId } = await searchParams;
  const [posts, roadmaps] = await Promise.all([
    loadPostsData({ roadmapId }),
    loadRoadmapsData(),
  ]);

  return (
    <Suspense fallback={<div className="container-page py-12 text-sm text-muted">Loading…</div>}>
      <RoadmapClient posts={posts} roadmaps={roadmaps} currentRoadmapId={roadmapId} />
    </Suspense>
  );
}
