import { Post } from '@/types/post';
import { groupByWeek, loadCampaign } from '@/lib/posts';
import { PostCard } from './PostCard';
import { getWeekRange, formatDateShort, pluralise } from '@/lib/format';

export function RoadmapTimeline({ posts }: { posts: Post[] }) {
  const campaign = loadCampaign();
  const grouped = groupByWeek(posts);
  const weeks = Array.from({ length: campaign.totalWeeks }, (_, i) => i + 1);

  if (posts.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      {/* Desktop: horizontal scrolling timeline */}
      <div className="hidden sm:block">
        <div className="timeline-scroll overflow-x-auto pb-4">
          <div className="flex min-w-max gap-4 px-4 sm:px-6 lg:px-8">
            {weeks.map((week) => {
              const weekPosts = grouped.get(week) ?? [];
              const range = getWeekRange(week, campaign.startDate);
              return (
                <section
                  key={week}
                  aria-labelledby={`week-${week}-heading`}
                  className="flex w-[280px] shrink-0 flex-col"
                >
                  <header className="sticky top-0 z-10 mb-3 rounded-lg bg-brand-bg-soft px-3 py-2">
                    <h2
                      id={`week-${week}-heading`}
                      className="font-display text-sm font-semibold text-brand-deep"
                    >
                      Week {week}
                    </h2>
                    <p className="text-xs text-muted">
                      {formatDateShort(range.start)} – {formatDateShort(range.end)}
                      {' · '}
                      {weekPosts.length} {pluralise(weekPosts.length, 'post')}
                    </p>
                  </header>
                  <div className="flex flex-col gap-3">
                    {weekPosts.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-brand-deep/15 p-4 text-center text-xs text-muted">
                        No posts
                      </p>
                    ) : (
                      weekPosts.map((p) => <PostCard key={p.id} post={p} />)
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: stacked vertical week sections */}
      <div className="sm:hidden">
        <div className="container-page space-y-6 pb-12 pt-2">
          {weeks.map((week) => {
            const weekPosts = grouped.get(week) ?? [];
            const range = getWeekRange(week, campaign.startDate);
            if (weekPosts.length === 0) return null;
            return (
              <section key={week} aria-labelledby={`week-${week}-heading-m`}>
                <header className="mb-3">
                  <h2
                    id={`week-${week}-heading-m`}
                    className="font-display text-base font-semibold text-brand-deep"
                  >
                    Week {week}
                  </h2>
                  <p className="text-xs text-muted">
                    {formatDateShort(range.start)} – {formatDateShort(range.end)}
                  </p>
                </header>
                <div className="flex flex-col gap-3">
                  {weekPosts.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="container-page py-20 text-center">
      <p className="text-lg text-muted">No posts match the current filters.</p>
    </div>
  );
}
