import { Suspense } from 'react';
import { loadPostsData } from '@/lib/post-data';
import { RoadmapClient } from '@/components/roadmap/RoadmapClient';

export const dynamic = 'force-dynamic';

export default async function RoadmapPage() {
  const posts = await loadPostsData();

  return (
    <Suspense fallback={<div className="container-page py-12 text-sm text-muted">Loading…</div>}>
      <RoadmapClient posts={posts} />
    </Suspense>
  );
}
