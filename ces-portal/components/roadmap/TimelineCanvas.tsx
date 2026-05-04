'use client'

import { useState, useRef, useCallback } from 'react'
import { clsx } from 'clsx'
import { Post, PILLAR_LABELS } from '@/types/post'
import { PlatformIcons } from './PlatformIcons'
import { PostEditPanel } from './PostEditPanel'

// ─── Constants ───────────────────────────────────────────────────────────────
const START = new Date('2026-05-05T00:00:00Z')
const TOTAL_DAYS = 160          // ~5.3 months
const DAY_W = 72                // px per day
const HEADER_H = 54             // month + day labels
const LINE_Y = HEADER_H         // horizontal timeline bar
const CARD_W = 66
const CARD_H = 96
const CARD_GAP = 6
const ROW_H = CARD_H + CARD_GAP
const CONNECTOR_H = 14

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-gray-300',
  'clinical-review': 'bg-yellow-400',
  'brand-review': 'bg-orange-400',
  approved: 'bg-green-400',
  scheduled: 'bg-blue-400',
  live: 'bg-brand-teal',
}

const PILLAR_BORDER: Record<string, string> = {
  educational: 'border-teal-500',
  business: 'border-blue-500',
  premises: 'border-amber-500',
  employee: 'border-green-500',
  leadership: 'border-slate-700',
  events: 'border-purple-500',
  tech: 'border-orange-500',
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function dayOffset(dateStr: string): number {
  const d = new Date(dateStr.slice(0, 10) + 'T00:00:00Z')
  return Math.round((d.getTime() - START.getTime()) / 86_400_000)
}

function offsetToDateStr(offset: number): string {
  const d = new Date(START)
  d.setUTCDate(d.getUTCDate() + Math.max(0, Math.min(TOTAL_DAYS - 1, offset)))
  return d.toISOString().slice(0, 10)
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  })
}

// ─── Header data ──────────────────────────────────────────────────────────────
function buildMonthHeaders() {
  const out: { label: string; x: number; width: number }[] = []
  let cur = new Date(START)
  let x = 0
  while (x < TOTAL_DAYS * DAY_W) {
    const y = cur.getUTCFullYear(), m = cur.getUTCMonth()
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
    const remaining = daysInMonth - cur.getUTCDate() + 1
    const used = Math.min(remaining, TOTAL_DAYS - Math.round(x / DAY_W))
    out.push({
      label: cur.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
      x,
      width: used * DAY_W,
    })
    cur = new Date(Date.UTC(y, m + 1, 1))
    x += used * DAY_W
  }
  return out
}

function buildDayTicks() {
  const out: { x: number; label: string; major: boolean }[] = []
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d = new Date(START)
    d.setUTCDate(d.getUTCDate() + i)
    const isMonday = d.getUTCDay() === 1
    const isFirst = d.getUTCDate() === 1
    if (isMonday || isFirst) {
      out.push({
        x: i * DAY_W,
        label: String(d.getUTCDate()),
        major: isFirst,
      })
    }
  }
  return out
}

// ─── Layout ───────────────────────────────────────────────────────────────────
function layoutPosts(posts: Post[], draggingSlug: string | null, draggingOffset: number) {
  const byDate = new Map<string, { post: Post; row: number }[]>()

  const display = posts.map(p => ({
    post: p,
    offset: draggingSlug === p.slug ? draggingOffset : dayOffset(p.scheduledDate),
  }))
  display.sort((a, b) => a.offset - b.offset)

  for (const { post, offset } of display) {
    const clampedOffset = Math.max(0, Math.min(TOTAL_DAYS - 1, offset))
    const key = String(clampedOffset)
    const col = byDate.get(key) ?? []
    col.push({ post, row: col.length })
    byDate.set(key, col)
  }

  return display.map(({ post, offset }) => {
    const clampedOffset = Math.max(0, Math.min(TOTAL_DAYS - 1, offset))
    const key = String(clampedOffset)
    const col = byDate.get(key)!
    const row = col.find(c => c.post.slug === post.slug)!.row
    return { post, offset: clampedOffset, row }
  })
}

// ─── Component ───────────────────────────────────────────────────────────────
interface DragState {
  slug: string
  startClientX: number
  startOffset: number
  currentOffset: number
}

export function TimelineCanvas({ posts: initialPosts }: { posts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const [selected, setSelected] = useState<Post | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const monthHeaders = buildMonthHeaders()
  const dayTicks = buildDayTicks()
  const layout = layoutPosts(posts, drag?.slug ?? null, drag?.currentOffset ?? 0)
  const maxRow = layout.reduce((m, l) => Math.max(m, l.row), 0)
  const totalH = LINE_Y + CONNECTOR_H + (maxRow + 1) * ROW_H + 32

  // ── drag handlers on each card ──────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent, post: Post) {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDrag({
      slug: post.slug,
      startClientX: e.clientX,
      startOffset: dayOffset(post.scheduledDate),
      currentOffset: dayOffset(post.scheduledDate),
    })
    setSelected(null)
  }

  function onPointerMove(e: React.PointerEvent, post: Post) {
    if (!drag || drag.slug !== post.slug) return
    const dx = e.clientX - drag.startClientX
    const delta = Math.round(dx / DAY_W)
    setDrag(d => d ? { ...d, currentOffset: Math.max(0, Math.min(TOTAL_DAYS - 1, d.startOffset + delta)) } : null)
  }

  const onPointerUp = useCallback(async (e: React.PointerEvent, post: Post) => {
    if (!drag || drag.slug !== post.slug) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    const newDate = offsetToDateStr(drag.currentOffset)
    const movedDays = drag.currentOffset - drag.startOffset

    setDrag(null)

    if (movedDays !== 0) {
      const res = await fetch(`/api/posts/${post.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate: newDate }),
      })
      if (res.ok) {
        const updated = await res.json()
        setPosts(prev => prev.map(p => p.slug === updated.slug ? updated : p))
        if (selected?.slug === updated.slug) setSelected(updated)
      }
    } else {
      // tap — open panel
      setSelected(s => s?.slug === post.slug ? null : post)
    }
  }, [drag, selected])

  function handleSave(updated: Post) {
    setPosts(prev => prev.map(p => p.slug === updated.slug ? updated : p))
    setSelected(updated)
  }

  return (
    <div className="relative">
      <div ref={scrollRef} className="overflow-x-auto pb-4 select-none">
        <div
          className="relative"
          style={{ width: TOTAL_DAYS * DAY_W, height: totalH }}
        >
          {/* Month headers */}
          {monthHeaders.map((h, i) => (
            <div
              key={i}
              className="absolute top-0 flex items-center border-r border-brand-deep/10 bg-brand-bg-soft"
              style={{ left: h.x, width: h.width, height: 28 }}
            >
              <span className="px-2 text-[11px] font-bold uppercase tracking-wider text-brand-deep/60 truncate">
                {h.label}
              </span>
            </div>
          ))}

          {/* Day ticks */}
          {dayTicks.map((t, i) => (
            <div
              key={i}
              className="absolute"
              style={{ left: t.x, top: 28, width: DAY_W, height: 26 }}
            >
              <span className={clsx(
                'text-[10px] pl-1',
                t.major ? 'font-bold text-brand-deep' : 'text-brand-deep/40',
              )}>
                {t.label}
              </span>
              <div
                className={clsx(
                  'absolute top-0 w-px',
                  t.major ? 'bg-brand-deep/20' : 'bg-brand-deep/8',
                )}
                style={{ left: 0, height: totalH }}
              />
            </div>
          ))}

          {/* Timeline bar */}
          <div
            className="absolute left-0 right-0 bg-brand-deep/15"
            style={{ top: LINE_Y, height: 2 }}
          />

          {/* Post cards */}
          {layout.map(({ post, offset, row }) => {
            const isDragging = drag?.slug === post.slug
            const x = offset * DAY_W + 3
            const y = LINE_Y + CONNECTOR_H + row * ROW_H

            return (
              <div
                key={post.slug}
                className={clsx('absolute', isDragging ? 'z-20' : 'z-10')}
                style={{ left: x, top: y, width: CARD_W }}
              >
                {/* Connector */}
                <div
                  className="absolute w-px bg-brand-deep/20"
                  style={{ left: CARD_W / 2, top: -CONNECTOR_H, height: CONNECTOR_H }}
                />
                {/* Dot on line */}
                <div
                  className="absolute h-2.5 w-2.5 rounded-full bg-brand-deep/30 border-2 border-white"
                  style={{ left: CARD_W / 2 - 5, top: -CONNECTOR_H - 5 }}
                />

                {/* Card */}
                <div
                  onPointerDown={e => onPointerDown(e, post)}
                  onPointerMove={e => onPointerMove(e, post)}
                  onPointerUp={e => onPointerUp(e, post)}
                  className={clsx(
                    'rounded-lg border-l-4 bg-white shadow-sm flex flex-col gap-1.5 p-2 cursor-grab active:cursor-grabbing transition-all',
                    PILLAR_BORDER[post.pillar] ?? 'border-brand-deep',
                    selected?.slug === post.slug && 'ring-2 ring-brand-teal ring-offset-1',
                    isDragging && 'shadow-xl scale-105 opacity-90',
                  )}
                  style={{ height: CARD_H, touchAction: 'none' }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-bold uppercase text-brand-deep/40 leading-none">
                      {post.id}
                    </span>
                    <div className={clsx('h-2 w-2 rounded-full shrink-0', STATUS_DOT[post.status] ?? 'bg-gray-300')} />
                  </div>

                  <PlatformIcons platforms={post.platforms} size={9} />

                  <p className="flex-1 text-[10px] text-brand-deep leading-tight line-clamp-3">
                    {post.title}
                  </p>

                  <span className={clsx(
                    'text-[9px] font-semibold',
                    isDragging ? 'text-brand-teal' : 'text-brand-deep/30',
                  )}>
                    {fmtDate(isDragging ? offsetToDateStr(offset) : post.scheduledDate)}
                  </span>
                </div>
              </div>
            )
          })}
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
