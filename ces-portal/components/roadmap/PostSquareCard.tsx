'use client'
import { clsx } from 'clsx'
import { Post, PILLAR_LABELS } from '@/types/post'
import { PlatformIcons } from './PlatformIcons'
import { StatusPill } from './StatusPill'

const PILLAR_BORDER: Record<string, string> = {
  educational: 'border-teal-500',
  business: 'border-blue-500',
  premises: 'border-amber-500',
  employee: 'border-green-500',
  leadership: 'border-brand-deep',
  events: 'border-purple-500',
  tech: 'border-orange-500',
}

export function PostSquareCard({
  post,
  selected,
  onClick,
}: {
  post: Post
  selected?: boolean
  onClick: () => void
}) {
  const date = new Date(post.scheduledDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left bg-white rounded-lg border-l-4 shadow-sm hover:shadow-md transition-all p-3 flex flex-col gap-2 cursor-pointer group',
        PILLAR_BORDER[post.pillar] ?? 'border-brand-deep',
        selected && 'ring-2 ring-brand-teal ring-offset-1 shadow-md',
      )}
      style={{ minHeight: 168 }}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[10px] font-semibold text-brand-deep/40 uppercase tracking-wide">
          {post.id}
        </span>
        <PlatformIcons platforms={post.platforms} size={11} />
      </div>

      <p className="flex-1 text-xs text-brand-deep leading-snug line-clamp-5">
        {post.caption}
      </p>

      <div className="flex items-center justify-between gap-1 pt-1">
        <span className="text-[10px] text-brand-deep/40">{date}</span>
        <StatusPill status={post.status} />
      </div>
    </button>
  )
}
