import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { loadPostsData } from '@/lib/post-data';
import { loadRoadmapsData } from '@/lib/roadmap-data';
import { RoadmapClient } from '@/components/roadmap/RoadmapClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ view?: string; r?: string }>
}

export default async function RoadmapPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const roadmapId = params.r;
  const [posts, roadmaps] = await Promise.all([
    loadPostsData({ roadmapId }),
    loadRoadmapsData(),
  ]);

  // Always canonicalise the URL with the roadmap ID so canvas sync is
  // guaranteed for every user regardless of how they arrived on the page.
  if (!roadmapId && roadmaps.length > 0) {
    const view = params.view ? `&view=${params.view}` : '';
    redirect(`/roadmap/?r=${roadmaps[0].id}${view}`);
  }

  return (
    <Suspense fallback={<div className="container-page py-12 text-sm text-muted">Loading…</div>}>
      <RoadmapClient posts={posts} roadmaps={roadmaps} currentRoadmapId={roadmapId} />
    </Suspense>
  );
}
