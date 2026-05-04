'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Post, STATUS_LABELS, PILLAR_LABELS } from '@/types/post'
import { PlatformIcons } from './PlatformIcons'
import { PostEditPanel } from './PostEditPanel'

// ── Timeline config ────────────────────────────────────────────────────────────
const EPOCH = new Date('2026-05-05T00:00:00Z')
const TOTAL_DAYS = 184 // May 5 → Nov 5

const ZOOMS = {
  day:   { dayW: 78, label: 'Day' },
  week:  { dayW: 40, label: 'Week' },
  month: { dayW: 18, label: 'Month' },
} as const
type Zoom = keyof typeof ZOOMS

const HEADER_ROW = 30  // px per header row; two rows = 60px total
const CARD_H = 88
const CARD_GAP = 8
const ROW_H = CARD_H + CARD_GAP
const CONNECTOR = 12

// ── Colour maps (complete strings so Tailwind doesn't purge) ──────────────────
const STATUS_STRIP: Record<string, string> = {
  draft:            '#d1d5db',
  'clinical-review':'#fbbf24',
  'brand-review':   '#fb923c',
  approved:         '#4ade80',
  scheduled:        '#60a5fa',
  live:             '#008080',
}
const PILLAR_STRIP: Record<string, string> = {
  educational: '#14b8a6',
  business:    '#3b82f6',
  premises:    '#f59e0b',
  employee:    '#22c55e',
  leadership:  '#003845',
  events:      '#a855f7',
  tech:        '#f97316',
}

// ── Date helpers ───────────────────────────────────────────────────────────────
function toOffset(dateStr: string) {
  const d = new Date(dateStr.slice(0, 10) + 'T00:00:00Z')
  return Math.round((d.getTime() - EPOCH.getTime()) / 86_400_000)
}
function fromOffset(off: number) {
  const d = new Date(EPOCH)
  d.setUTCDate(d.getUTCDate() + Math.max(0, Math.min(TOTAL_DAYS - 1, off)))
  return d.toISOString().slice(0, 10)
}
function fmtShort(dateStr: string) {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  })
}
function todayOffset() {
  return toOffset(new Date().toISOString().slice(0, 10))
}
function isoWeek(d: Date) {
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

// ── Header data ────────────────────────────────────────────────────────────────
function buildMonths(dayW: number) {
  const out: { label: string; x: number; width: number }[] = []
  let cur = new Date(EPOCH)
  let x = 0
  while (x < TOTAL_DAYS * dayW) {
    const y = cur.getUTCFullYear(), m = cur.getUTCMonth()
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
    const remaining = daysInMonth - cur.getUTCDate() + 1
    const used = Math.min(remaining, TOTAL_DAYS - Math.round(x / dayW))
    out.push({
      label: cur.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
      x,
      width: used * dayW,
    })
    cur = new Date(Date.UTC(y, m + 1, 1))
    x += used * dayW
  }
  return out
}

function buildSubHeader(zoom: Zoom, dayW: number) {
  const ticks: { x: number; label: string; major: boolean }[] = []
  let prevWeek = -1, prevMonth = -1
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d = new Date(EPOCH)
    d.setUTCDate(d.getUTCDate() + i)
    const x = i * dayW
    if (zoom === 'day') {
      // tick on every day; major on Monday or 1st of month
      const isMon = d.getUTCDay() === 1
      const isFirst = d.getUTCDate() === 1
      ticks.push({ x, label: String(d.getUTCDate()), major: isMon || isFirst })
    } else if (zoom === 'week') {
      // tick at start of each week (Monday)
      if (d.getUTCDay() === 1 || i === 0) {
        const w = isoWeek(d)
        if (w !== prevWeek) {
          ticks.push({ x, label: `W${w}`, major: d.getUTCDate() <= 7 })
          prevWeek = w
        }
      }
    } else {
      // month zoom: tick at start of each month
      if (d.getUTCDate() === 1 || i === 0) {
        const m = d.getUTCMonth()
        if (m !== prevMonth) {
          ticks.push({ x, label: String(d.getUTCDate()), major: true })
          prevMonth = m
        }
      }
    }
  }
  return ticks
}

// ── Card layout ────────────────────────────────────────────────────────────────
function stackPosts(posts: Post[], dragSlug: string | null, dragOff: number, dayW: number) {
  const cols = new Map<number, number>() // offset → next available row
  return posts
    .map(p => ({ p, off: dragSlug === p.slug ? dragOff : Math.max(0, Math.min(TOTAL_DAYS - 1, toOffset(p.scheduledDate))) }))
    .sort((a, b) => a.off - b.off)
    .map(({ p, off }) => {
      const row = cols.get(off) ?? 0
      cols.set(off, row + 1)
      return { post: p, off, row }
    })
}

// ── Drag state ─────────────────────────────────────────────────────────────────
interface Drag { slug: string; startX: number; startOff: number; curOff: number }

// ── Component ──────────────────────────────────────────────────────────────────
export function TimelineCanvas({ posts: init }: { posts: Post[] }) {
  const [posts, setPosts] = useState(init)
  const [selected, setSelected] = useState<Post | null>(null)
  const [zoom, setZoom] = useState<Zoom>('week')
  const [drag, setDrag] = useState<Drag | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { dayW } = ZOOMS[zoom]
  const headerH = HEADER_ROW * 2
  const months = buildMonths(dayW)
  const subTicks = buildSubHeader(zoom, dayW)
  const todayOff = todayOffset()
  const layout = stackPosts(posts, drag?.slug ?? null, drag?.curOff ?? 0, dayW)
  const maxRow = layout.reduce((m, l) => Math.max(m, l.row), 0)
  const totalH = headerH + CONNECTOR + (maxRow + 1) * ROW_H + 32
  const totalW = TOTAL_DAYS * dayW

  // Scroll to today on mount
  useEffect(() => {
    if (!scrollRef.current) return
    const x = todayOff * dayW - scrollRef.current.clientWidth / 2
    scrollRef.current.scrollLeft = Math.max(0, x)
  }, [])  // eslint-disable-line

  // Re-center when zoom changes
  useEffect(() => {
    if (!scrollRef.current) return
    const x = todayOff * dayW - scrollRef.current.clientWidth / 2
    scrollRef.current.scrollLeft = Math.max(0, x)
  }, [zoom, dayW, todayOff])

  // ── Navigation ───────────────────────────────────────────────────────────────
  function scrollBy(days: number) {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: days * dayW, behavior: 'smooth' })
  }
  function jumpToday() {
    if (!scrollRef.current) return
    const x = todayOff * dayW - scrollRef.current.clientWidth / 2
    scrollRef.current.scrollTo({ left: Math.max(0, x), behavior: 'smooth' })
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent, post: Post) {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDrag({ slug: post.slug, startX: e.clientX, startOff: toOffset(post.scheduledDate), curOff: toOffset(post.scheduledDate) })
    setSelected(null)
  }
  function onPointerMove(e: React.PointerEvent, slug: string) {
    if (!drag || drag.slug !== slug) return
    const delta = Math.round((e.clientX - drag.startX) / dayW)
    setDrag(d => d ? { ...d, curOff: Math.max(0, Math.min(TOTAL_DAYS - 1, d.startOff + delta)) } : null)
  }
  const onPointerUp = useCallback(async (e: React.PointerEvent, post: Post) => {
    if (!drag || drag.slug !== post.slug) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    const moved = drag.curOff - drag.startOff
    const snap = drag.curOff
    setDrag(null)
    if (moved === 0) {
      setSelected(s => s?.slug === post.slug ? null : post)
      return
    }
    const newDate = fromOffset(snap)
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
  }, [drag, selected])

  return (
    <div className="flex flex-col gap-0">
      {/* ── Control bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-brand-deep/10 bg-white sticky top-16 z-30">
        {/* Nav arrows */}
        <div className="flex items-center rounded-lg border border-brand-deep/15 overflow-hidden">
          <button onClick={() => scrollBy(-28)} className="px-2.5 py-1.5 hover:bg-brand-bg-soft transition-colors text-brand-deep/60 hover:text-brand-deep border-r border-brand-deep/15" title="Back 4 weeks">
            <ChevronLeft size={15} />
          </button>
          <button onClick={jumpToday} className="px-3 py-1.5 text-xs font-semibold text-brand-deep hover:bg-brand-bg-soft transition-colors flex items-center gap-1.5">
            <CalendarDays size={13} />
            Today
          </button>
          <button onClick={() => scrollBy(28)} className="px-2.5 py-1.5 hover:bg-brand-bg-soft transition-colors text-brand-deep/60 hover:text-brand-deep border-l border-brand-deep/15" title="Forward 4 weeks">
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="h-5 w-px bg-brand-deep/10" />

        {/* Zoom */}
        <div className="flex items-center rounded-lg border border-brand-deep/15 overflow-hidden">
          {(Object.keys(ZOOMS) as Zoom[]).map(z => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={clsx(
                'px-3 py-1.5 text-xs font-semibold transition-colors',
                zoom === z ? 'bg-brand-deep text-white' : 'text-brand-deep/60 hover:bg-brand-bg-soft hover:text-brand-deep',
                z !== 'month' && 'border-r border-brand-deep/15',
              )}
            >
              {ZOOMS[z].label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs text-brand-deep/40">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
            Today
          </span>
          <span>Drag cards to reschedule · Click to edit</span>
        </div>
      </div>

      {/* ── Scrollable canvas ────────────────────────────────────────────────── */}
      <div ref={scrollRef} className="overflow-x-auto overscroll-x-none" style={{ cursor: drag ? 'grabbing' : 'default' }}>
        <div className="relative select-none" style={{ width: totalW, height: totalH }}>

          {/* Month header row */}
          {months.map((m, i) => (
            <div
              key={i}
              className="absolute top-0 flex items-center border-r border-brand-deep/10 bg-white"
              style={{ left: m.x, width: m.width, height: HEADER_ROW }}
            >
              <span className="px-3 text-[11px] font-bold uppercase tracking-widest text-brand-deep truncate">
                {m.label}
              </span>
            </div>
          ))}

          {/* Sub-header row (weeks/days) */}
          {subTicks.map((t, i) => (
            <div
              key={i}
              className="absolute flex items-center"
              style={{ left: t.x, top: HEADER_ROW, height: HEADER_ROW, minWidth: dayW }}
            >
              <div
                className="absolute top-0 h-full w-px"
                style={{ background: t.major ? 'rgba(0,56,69,0.15)' : 'rgba(0,56,69,0.06)' }}
              />
              <span className={clsx(
                'pl-1.5 text-[10px] leading-none',
                t.major ? 'font-bold text-brand-deep' : 'text-brand-deep/35',
              )}>
                {t.label}
              </span>
            </div>
          ))}

          {/* Weekend shading (day zoom only) */}
          {zoom === 'day' && Array.from({ length: TOTAL_DAYS }, (_, i) => {
            const d = new Date(EPOCH); d.setUTCDate(d.getUTCDate() + i)
            const dow = d.getUTCDay()
            if (dow !== 0 && dow !== 6) return null
            return (
              <div key={i} className="absolute top-0 bg-brand-deep/[0.02]"
                style={{ left: i * dayW, width: dayW, height: totalH }} />
            )
          })}

          {/* Today column highlight */}
          {todayOff >= 0 && todayOff < TOTAL_DAYS && (
            <div
              className="absolute top-0 bg-red-400/10"
              style={{ left: todayOff * dayW, width: dayW, height: totalH }}
            />
          )}

          {/* Timeline bar */}
          <div
            className="absolute left-0 right-0"
            style={{ top: headerH, height: 2, background: 'rgba(0,56,69,0.12)' }}
          />

          {/* Today line */}
          {todayOff >= 0 && todayOff < TOTAL_DAYS && (
            <>
              <div
                className="absolute w-0.5 bg-red-400 z-10"
                style={{ left: todayOff * dayW + dayW / 2, top: headerH - 6, height: totalH - headerH + 6 }}
              />
              <div
                className="absolute z-10 rounded-full bg-red-400 border-2 border-white shadow"
                style={{ left: todayOff * dayW + dayW / 2 - 5, top: headerH - 6, width: 10, height: 10 }}
              />
            </>
          )}

          {/* Post cards */}
          {layout.map(({ post, off, row }) => {
            const isDragging = drag?.slug === post.slug
            const x = off * dayW
            const y = headerH + CONNECTOR + row * ROW_H
            const cardW = Math.max(60, dayW - 6)

            return (
              <div
                key={post.slug}
                className={clsx('absolute', isDragging ? 'z-30' : 'z-10')}
                style={{ left: x + 3, top: y, width: cardW }}
              >
                {/* Connector line to timeline */}
                <div
                  className="absolute w-px"
                  style={{ left: cardW / 2, bottom: CARD_H, height: CONNECTOR, background: 'rgba(0,56,69,0.2)' }}
                />
                {/* Dot on timeline */}
                <div
                  className="absolute rounded-full border-2 border-white shadow-sm"
                  style={{
                    left: cardW / 2 - 5, bottom: CARD_H + CONNECTOR - 5,
                    width: 10, height: 10,
                    background: STATUS_STRIP[post.status] ?? '#9ca3af',
                  }}
                />

                {/* Card */}
                <div
                  onPointerDown={e => onPointerDown(e, post)}
                  onPointerMove={e => onPointerMove(e, post.slug)}
                  onPointerUp={e => onPointerUp(e, post)}
                  className={clsx(
                    'rounded-lg bg-white shadow-sm border border-brand-deep/10 overflow-hidden',
                    'cursor-grab active:cursor-grabbing transition-all',
                    selected?.slug === post.slug && 'ring-2 ring-brand-teal ring-offset-1 shadow-md',
                    isDragging && 'shadow-xl scale-[1.03] opacity-95 ring-2 ring-brand-teal',
                  )}
                  style={{ height: CARD_H, touchAction: 'none' }}
                >
                  {/* Status strip */}
                  <div className="h-1 w-full" style={{ background: STATUS_STRIP[post.status] ?? '#e5e7eb' }} />

                  <div className="flex flex-col gap-1 p-2 h-[calc(100%-4px)]">
                    {/* ID + platforms */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="text-[9px] font-black uppercase tracking-wider rounded px-1"
                        style={{
                          background: PILLAR_STRIP[post.pillar] + '22',
                          color: PILLAR_STRIP[post.pillar],
                        }}
                      >
                        {post.id}
                      </span>
                      <PlatformIcons platforms={post.platforms} size={9} />
                    </div>

                    {/* Title */}
                    <p className="flex-1 text-[10px] font-medium text-brand-deep leading-tight line-clamp-3">
                      {post.title}
                    </p>

                    {/* Date */}
                    <span className={clsx(
                      'text-[9px] font-semibold tabular-nums',
                      isDragging ? 'text-brand-teal' : 'text-brand-deep/35',
                    )}>
                      {fmtShort(fromOffset(off))}
                    </span>
                  </div>
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
          onSave={updated => {
            setPosts(prev => prev.map(p => p.slug === updated.slug ? updated : p))
            setSelected(updated)
          }}
        />
      )}
    </div>
  )
}
