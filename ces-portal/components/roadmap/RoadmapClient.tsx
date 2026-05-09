'use client';

import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Post } from '@/types/post';
import { RoadmapMeta } from '@/lib/roadmap-data';
import { filterPosts } from '@/lib/posts';
import { PostFilters } from '@/components/roadmap/PostFilters';
import { ViewSwitcher } from '@/components/roadmap/ViewSwitcher';
import { TimelineCanvas } from '@/components/roadmap/TimelineCanvas';
import { CanvasBoard } from '@/components/roadmap/CanvasBoard';
import { RoadmapBoard } from '@/components/roadmap/RoadmapBoard';
import { RoadmapPriority } from '@/components/roadmap/RoadmapPriority';
import { RoadmapSwitcher } from '@/components/roadmap/RoadmapSwitcher';
import { paramsToFilters } from '@/lib/filters';
import { canEditPost } from '@/lib/permissions';

export function RoadmapClient({ posts: allPosts, roadmaps, currentRoadmapId }: {
  posts: Post[]
  roadmaps: RoadmapMeta[]
  currentRoadmapId?: string
}) {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const view = searchParams.get('view') ?? 'timeline';
  const filters = paramsToFilters(searchParams);
  const posts = filterPosts(allPosts, filters);
  const editable = canEditPost(session?.user?.role);

  const switcher = (
    <RoadmapSwitcher roadmaps={roadmaps} currentId={currentRoadmapId} canEdit={editable} />
  );

  // Fall back to first roadmap so the strategy card always appears
  const effectiveRoadmapId = currentRoadmapId ?? roadmaps[0]?.id

  if (view === 'timeline') {
    return <TimelineCanvas key={effectiveRoadmapId ?? 'all'} posts={posts} roadmapId={effectiveRoadmapId} switcher={switcher} />;
  }

  return (
    <>
      <PostFilters />
      <div className="container-page pt-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {switcher}
            <p className="text-sm text-muted">
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
