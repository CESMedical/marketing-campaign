import { Post, SERVICE_LABELS, LOCATION_LABELS } from '@/types/post';
import { PillarBadge } from '@/components/roadmap/PillarBadge';
import { PlatformIcons } from '@/components/roadmap/PlatformIcons';
import { StatusPill } from '@/components/roadmap/StatusPill';
import { PriorityFlag } from '@/components/roadmap/PriorityFlag';
import { formatDate } from '@/lib/format';

export function PostHero({ post }: { post: Post }) {
  return (
    <header className="mb-8 border-b border-brand-deep/10 pb-8">
      <div className="mb-4 flex items-center gap-3 text-sm text-muted">
        <span className="font-mono font-medium text-brand-deep">{post.id}</span>
        <span aria-hidden="true">·</span>
        <span>Week {post.weekNumber}</span>
        <span aria-hidden="true">·</span>
        <span>{formatDate(post.scheduledDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>

      <h1 className="mb-4 font-display text-3xl font-semibold leading-tight text-brand-deep sm:text-4xl">
        {post.title}
      </h1>

      <div className="flex flex-wrap items-center gap-2">
        <PillarBadge pillar={post.pillar} />
        {post.isCommercialPriority && <PriorityFlag size="md" />}
        {post.service && (
          <span className="text-sm text-muted">{SERVICE_LABELS[post.service]}</span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted">Status:</span>
          <StatusPill status={post.status} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted">Platforms:</span>
          <PlatformIcons platforms={post.platforms} size={16} />
        </div>
        {post.productionLocation && (
          <div className="flex items-center gap-2">
            <span className="text-muted">Location:</span>
            <span className="font-medium text-brand-deep">
              {LOCATION_LABELS[post.productionLocation]}
            </span>
          </div>
        )}
        {post.productionLead && (
          <div className="flex items-center gap-2">
            <span className="text-muted">Lead:</span>
            <span className="font-medium text-brand-deep capitalize">
              {post.productionLead}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
