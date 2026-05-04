'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { loadPosts, filterPosts } from '@/lib/posts';
import { PostFilters } from '@/components/roadmap/PostFilters';
import { ViewSwitcher } from '@/components/roadmap/ViewSwitcher';
import { TimelineCanvas } from '@/components/roadmap/TimelineCanvas';
import { CanvasBoard } from '@/components/roadmap/CanvasBoard';
import { RoadmapBoard } from '@/components/roadmap/RoadmapBoard';
import { RoadmapPriority } from '@/components/roadmap/RoadmapPriority';
import { paramsToFilters } from '@/lib/filters';

export default function RoadmapPage() {
  return (
    <Suspense fallback={<div className="container-page py-12 text-sm text-muted">Loading…</div>}>
      <RoadmapPageInner />
    </Suspense>
  );
}

function RoadmapPageInner() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') ?? 'timeline';
  const filters = paramsToFilters(searchParams);
  const posts = filterPosts(loadPosts(), filters);

  // Timeline gets the full viewport — no heading above it
  if (view === 'timeline') {
    return <TimelineCanvas posts={posts} />;
  }

  return (
    <>
      <PostFilters />
      <div className="container-page pt-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-brand-deep sm:text-3xl">
              Campaign roadmap
            </h1>
            <p className="mt-1 text-sm text-muted">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'} showing
            </p>
          </div>
          <ViewSwitcher />
        </div>
      </div>

      {view === 'board' ? (
        <RoadmapBoard posts={posts} />
      ) : view === 'priority' ? (
        <RoadmapPriority posts={posts} />
      ) : (
        <CanvasBoard posts={posts} />
      )}
    </>
  );
}
