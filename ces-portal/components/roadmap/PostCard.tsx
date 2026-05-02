import Link from 'next/link';
import { Post, SERVICE_LABELS } from '@/types/post';
import { PillarBadge } from './PillarBadge';
import { PlatformIcons } from './PlatformIcons';
import { StatusPill } from './StatusPill';
import { PriorityFlag } from './PriorityFlag';
import { formatDateShort, formatWeekday } from '@/lib/format';

interface PostCardProps {
  post: Post;
  compact?: boolean;
}

export function PostCard({ post, compact = false }: PostCardProps) {
  return (
    <Link
      href={`/post/${post.slug}/`}
      className="group block rounded-xl border border-brand-deep/10 bg-white p-4 transition-all hover:border-brand-teal hover:shadow-sm focus-visible:border-brand-teal"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-mono font-medium text-muted">{post.id}</span>
        <span className="text-xs text-muted">
          {formatWeekday(post.scheduledDate)} · {formatDateShort(post.scheduledDate)}
        </span>
      </div>

      <h3 className="mb-3 font-display text-base font-semibold leading-tight text-brand-deep group-hover:text-brand-teal">
        {post.title}
      </h3>

      {!compact && post.service && post.service !== 'general' && post.service !== 'brand' && (
        <p className="mb-3 text-xs text-muted">{SERVICE_LABELS[post.service]}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <PillarBadge pillar={post.pillar} />
        {post.isCommercialPriority && <PriorityFlag />}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-brand-deep/5 pt-3">
        <PlatformIcons platforms={post.platforms} />
        <StatusPill status={post.status} />
      </div>
    </Link>
  );
}
