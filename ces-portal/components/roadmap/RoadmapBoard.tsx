import { Post, Status, STATUS_LABELS, STATUS_ORDER } from '@/types/post';
import { groupByStatus } from '@/lib/posts';
import { PostCard } from './PostCard';
import { pluralise } from '@/lib/format';

export function RoadmapBoard({ posts }: { posts: Post[] }) {
  const grouped = groupByStatus(posts);

  if (posts.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-lg text-muted">No posts match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="timeline-scroll overflow-x-auto pb-4">
      <div className="flex min-w-max gap-4 px-4 sm:px-6 lg:px-8">
        {STATUS_ORDER.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            posts={grouped.get(status) ?? []}
          />
        ))}
      </div>
    </div>
  );
}

function BoardColumn({ status, posts }: { status: Status; posts: Post[] }) {
  return (
    <section
      aria-labelledby={`status-${status}-heading`}
      className="flex w-[300px] shrink-0 flex-col rounded-xl bg-brand-bg-soft p-3"
    >
      <header className="mb-3 flex items-center justify-between">
        <h2
          id={`status-${status}-heading`}
          className="font-display text-sm font-semibold text-brand-deep"
        >
          {STATUS_LABELS[status]}
        </h2>
        <span className="text-xs text-muted">
          {posts.length} {pluralise(posts.length, 'post')}
        </span>
      </header>
      <div className="flex flex-col gap-2">
        {posts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-brand-deep/15 bg-white p-3 text-center text-xs text-muted">
            None
          </p>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </div>
    </section>
  );
}
