'use client'
import { useState } from 'react'
import { Post } from '@/types/post'
import { PostSquareCard } from './PostSquareCard'
import { PostEditPanel } from './PostEditPanel'

function groupByWeek(posts: Post[]) {
  const map = new Map<number, Post[]>()
  for (const post of posts) {
    if (!map.has(post.weekNumber)) map.set(post.weekNumber, [])
    map.get(post.weekNumber)!.push(post)
  }
  return map
}

function weekDateRange(weekNum: number): string {
  const start = new Date('2026-05-15')
  start.setDate(start.getDate() + (weekNum - 1) * 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${fmt(start)} – ${fmt(end)}`
}

export function CanvasBoard({ posts: initialPosts }: { posts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const [selected, setSelected] = useState<Post | null>(null)
  const weekMap = groupByWeek(posts)
  const weeks = Array.from(weekMap.keys()).sort((a, b) => a - b)

  function handleSave(updated: Post) {
    setPosts(prev => prev.map(p => p.slug === updated.slug ? updated : p))
    setSelected(updated)
  }

  return (
    <div className="relative min-h-0">
      <div className="overflow-x-auto">
        <div className="flex gap-5 px-6 pb-10 pt-4" style={{ minWidth: 'max-content' }}>
          {weeks.map(week => (
            <div key={week} style={{ width: 216 }}>
              <div className="mb-3 pb-2 border-b-2 border-brand-deep/10">
                <p className="text-xs font-bold text-brand-deep uppercase tracking-wider">Week {week}</p>
                <p className="text-[11px] text-brand-deep/40 mt-0.5">{weekDateRange(week)}</p>
              </div>
              <div className="flex flex-col gap-3">
                {(weekMap.get(week) ?? []).map(post => (
                  <PostSquareCard
                    key={post.slug}
                    post={post}
                    selected={selected?.slug === post.slug}
                    onClick={() => setSelected(s => s?.slug === post.slug ? null : post)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <PostEditPanel
          post={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
