import { Post, Service, SERVICE_LABELS } from '@/types/post';
import { groupByService, getCommercialPriority } from '@/lib/posts';
import { PostCard } from './PostCard';
import { pluralise } from '@/lib/format';
import { Star } from 'lucide-react';

const SERVICE_ORDER: Service[] = [
  'cataract-monofocal',
  'cataract-multifocal',
  'cataract-edof',
  'cataract-toric',
  'oculoplastic-eyelid',
  'glaucoma',
  'dry-eye',
  'general',
  'brand',
];

export function RoadmapPriority({ posts }: { posts: Post[] }) {
  const priorityPosts = getCommercialPriority(posts);
  const grouped = groupByService(priorityPosts);
  const servicesWithPosts = SERVICE_ORDER.filter((s) => (grouped.get(s)?.length ?? 0) > 0);

  return (
    <div className="container-page py-6 sm:py-8">
      <div className="mb-8 max-w-3xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1 text-sm font-medium text-warning">
          <Star size={14} fill="currentColor" />
          Commercial Priority Board
        </div>
        <h1 className="mb-3 font-display text-3xl font-semibold sm:text-4xl">
          The 15 posts driving conversion
        </h1>
        <p className="text-base text-muted sm:text-lg">
          These posts focus on monofocal lenses, multifocal lenses, cataract lens consultations,
          eyelid surgery explainers, oculoplastic Q&amp;A, and final conversion. They get extra
          attention on caption writing, clinical review, CTA routing, and enquiry follow-up.
        </p>
      </div>

      {priorityPosts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-muted">No commercial priority posts match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {servicesWithPosts.map((service) => {
            const servicePosts = grouped.get(service) ?? [];
            return (
              <section key={service} aria-labelledby={`service-${service}-heading`}>
                <header className="mb-4 flex items-baseline justify-between border-b border-brand-deep/10 pb-2">
                  <h2
                    id={`service-${service}-heading`}
                    className="font-display text-xl font-semibold text-brand-deep"
                  >
                    {SERVICE_LABELS[service]}
                  </h2>
                  <span className="text-sm text-muted">
                    {servicePosts.length} {pluralise(servicePosts.length, 'post')}
                  </span>
                </header>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {servicePosts.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
