'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { CalendarDays, ZoomIn, ZoomOut } from 'lucide-react'
import { Post, STATUS_LABELS, PILLAR_LABELS } from '@/types/post'
import { PlatformIcons } from './PlatformIcons'
import { PostEditPanel } from './PostEditPanel'

// ─── World-space constants ────────────────────────────────────────────────────
// Everything is authored at zoom = 1.  CSS scale() maps world → screen.
const DAY_W       = 200   // world px per calendar day
const TOTAL_DAYS  = 184   // May 5 → Nov 5  (~6 months)
const WORLD_W     = DAY_W * TOTAL_DAYS   // 36 800 px
const HEADER_H    = 88    // two-row date header
const CARD_W      = 184   // slightly narrower than DAY_W
const CARD_H      = 220
const CARD_GAP    = 14
const ROW_H       = CARD_H + CARD_GAP
const CONNECTOR_H = 20
const WORLD_H     = HEADER_H + CONNECTOR_H + 6 * ROW_H + 60  // room for 6 stacked rows

const EPOCH = new Date('2026-05-05T00:00:00Z')

const MIN_ZOOM = 0.04   // see entire 6-month timeline
const MAX_ZOOM = 3.0    // ~1 card fills screen
const INIT_ZOOM = 0.32  // comfortable overview

// ─── Status / pillar colour maps ──────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  draft:            '#9ca3af',
  'clinical-review':'#fbbf24',
  'brand-review':   '#f97316',
  approved:         '#4ade80',
  scheduled:        '#60a5fa',
  live:             '#008080',
}
const PILLAR_HUE: Record<string, string> = {
  educational: '#14b8a6',
  business:    '#3b82f6',
  premises:    '#f59e0b',
  employee:    '#22c55e',
  leadership:  '#003845',
  events:      '#a855f7',
  tech:        '#f97316',
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function toOffset(s: string) {
  const d = new Date(s.slice(0, 10) + 'T00:00:00Z')
  return Math.round((d.getTime() - EPOCH.getTime()) / 86_400_000)
}
function fromOffset(n: number) {
  const d = new Date(EPOCH)
  d.setUTCDate(d.getUTCDate() + Math.max(0, Math.min(TOTAL_DAYS - 1, n)))
  return d.toISOString().slice(0, 10)
}
function todayOff() { return toOffset(new Date().toISOString().slice(0, 10)) }
function fmtDay(s: string) {
  return new Date(s + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  })
}

// ─── Header rows ──────────────────────────────────────────────────────────────
function buildMonths() {
  const out: { label: string; x: number; w: number }[] = []
  let cur = new Date(EPOCH), x = 0
  while (x < WORLD_W) {
    const y = cur.getUTCFullYear(), m = cur.getUTCMonth()
    const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
    const used = Math.min(dim - cur.getUTCDate() + 1, TOTAL_DAYS - Math.round(x / DAY_W))
    out.push({
      label: cur.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
      x, w: used * DAY_W,
    })
    cur = new Date(Date.UTC(y, m + 1, 1))
    x += used * DAY_W
  }
  return out
}

function buildWeeks() {
  const out: { x: number; label: string }[] = []
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d = new Date(EPOCH); d.setUTCDate(d.getUTCDate() + i)
    if (d.getUTCDay() === 1 || i === 0) {
      const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      const dn = tmp.getUTCDay() || 7; tmp.setUTCDate(tmp.getUTCDate() + 4 - dn)
      const ys = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
      const wk = Math.ceil(((tmp.getTime() - ys.getTime()) / 86_400_000 + 1) / 7)
      out.push({ x: i * DAY_W, label: `W${wk}  ·  ${d.getUTCDate()} ${d.toLocaleDateString('en-GB',{month:'short',timeZone:'UTC'})}` })
    }
  }
  return out
}

// ─── Card stacking ────────────────────────────────────────────────────────────
function stack(posts: Post[], dragSlug: string | null, dragOff: number) {
  const cols = new Map<number, number>()
  return posts
    .map(p => ({ p, off: Math.max(0, Math.min(TOTAL_DAYS - 1, dragSlug === p.slug ? dragOff : toOffset(p.scheduledDate))) }))
    .sort((a, b) => a.off - b.off)
    .map(({ p, off }) => { const r = cols.get(off) ?? 0; cols.set(off, r + 1); return { post: p, off, row: r } })
}

// ─── Component ────────────────────────────────────────────────────────────────
interface DragState { slug: string; startX: number; startOff: number; curOff: number }

const months = buildMonths()
const weeks  = buildWeeks()

export function TimelineCanvas({ posts: init }: { posts: Post[] }) {
  const [posts, setPosts]   = useState(init)
  const [selected, setSelected] = useState<Post | null>(null)
  const [drag, setDrag]     = useState<DragState | null>(null)

  // Viewport transform — stored in refs for wheel handler perf, mirrored to state for re-render
  const zoomRef  = useRef(INIT_ZOOM)
  const panXRef  = useRef(0)
  const [viewZoom, setViewZoom] = useState(INIT_ZOOM)
  const [viewPanX, setViewPanX] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLDivElement>(null)
  const rafRef       = useRef<number>(0)

  // ── clamp ──────────────────────────────────────────────────────────────────
  function clampX(x: number, z: number) {
    const vw = containerRef.current?.clientWidth ?? window.innerWidth
    const scaledW = WORLD_W * z
    if (scaledW <= vw) return (vw - scaledW) / 2  // center when fully zoomed out
    return Math.max(vw - scaledW, Math.min(0, x))
  }

  // ── apply transform (direct DOM, then sync React state throttled) ──────────
  function applyTransform(z: number, x: number) {
    zoomRef.current = z; panXRef.current = x
    if (canvasRef.current)
      canvasRef.current.style.transform = `translateX(${x}px) scale(${z})`
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => { setViewZoom(z); setViewPanX(x) })
  }

  // ── wheel event (non-passive, attached manually) ───────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // scroll to today on mount
    const vw = el.clientWidth
    const tx = clampX(-(todayOff() * DAY_W * INIT_ZOOM) + vw / 2, INIT_ZOOM)
    applyTransform(INIT_ZOOM, tx)

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const z = zoomRef.current, x = panXRef.current
      const rect = (containerRef.current as HTMLDivElement).getBoundingClientRect()
      const mx = e.clientX - rect.left

      if (e.ctrlKey || e.metaKey) {
        // ── zoom to cursor ──────────────────────────────────────────────────
        const factor = Math.pow(0.999, e.deltaY)
        const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * factor))
        const nx = clampX(mx + (x - mx) * nz / z, nz)
        applyTransform(nz, nx)
      } else {
        // ── pan (MX Master horizontal scroll or regular scroll) ─────────────
        // deltaX from horizontal scroll; fall back to deltaY for vertical wheel
        const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        const nx = clampX(x - raw, z)
        applyTransform(z, nx)
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, []) // eslint-disable-line

  // ── zoom buttons ────────────────────────────────────────────────────────────
  function zoomBtn(factor: number) {
    const vw = containerRef.current?.clientWidth ?? window.innerWidth
    const mx = vw / 2
    const z = zoomRef.current, x = panXRef.current
    const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * factor))
    applyTransform(nz, clampX(mx + (x - mx) * nz / z, nz))
  }
  function jumpToday() {
    const vw = containerRef.current?.clientWidth ?? window.innerWidth
    const z = zoomRef.current
    applyTransform(z, clampX(-(todayOff() * DAY_W * z) + vw / 2, z))
  }
  function zoomToFit() {
    const vw = containerRef.current?.clientWidth ?? window.innerWidth
    const z = Math.max(MIN_ZOOM, vw / WORLD_W)
    applyTransform(z, clampX(0, z))
  }

  // ── drag ────────────────────────────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent, post: Post) {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDrag({ slug: post.slug, startX: e.clientX, startOff: toOffset(post.scheduledDate), curOff: toOffset(post.scheduledDate) })
    setSelected(null)
  }
  function onPointerMove(e: React.PointerEvent, slug: string) {
    if (!drag || drag.slug !== slug) return
    const worldDelta = Math.round((e.clientX - drag.startX) / (DAY_W * zoomRef.current))
    setDrag(d => d ? { ...d, curOff: Math.max(0, Math.min(TOTAL_DAYS - 1, d.startOff + worldDelta)) } : null)
  }
  const onPointerUp = useCallback(async (e: React.PointerEvent, post: Post) => {
    if (!drag || drag.slug !== post.slug) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    const { curOff, startOff } = drag
    setDrag(null)
    if (curOff === startOff) { setSelected(s => s?.slug === post.slug ? null : post); return }
    const newDate = fromOffset(curOff)
    const res = await fetch(`/api/posts/${post.slug}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledDate: newDate }),
    })
    if (res.ok) {
      const updated = await res.json()
      setPosts(prev => prev.map(p => p.slug === updated.slug ? updated : p))
      if (selected?.slug === updated.slug) setSelected(updated)
    }
  }, [drag, selected])

  const layout = stack(posts, drag?.slug ?? null, drag?.curOff ?? 0)
  const tOff   = todayOff()
  const zoom   = viewZoom  // for conditional rendering

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>

      {/* ── Control bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-6 py-2.5 border-b border-brand-deep/10 bg-white shrink-0 z-30">
        <button
          onClick={jumpToday}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-deep/15 text-xs font-semibold text-brand-deep hover:bg-brand-bg-soft transition-colors"
        >
          <CalendarDays size={13} /> Today
        </button>

        <div className="h-5 w-px bg-brand-deep/10" />

        <div className="flex items-center rounded-lg border border-brand-deep/15 overflow-hidden">
          <button onClick={() => zoomBtn(0.75)} className="px-2.5 py-1.5 hover:bg-brand-bg-soft text-brand-deep/60 hover:text-brand-deep transition-colors border-r border-brand-deep/15">
            <ZoomOut size={14} />
          </button>
          <span className="px-3 text-xs font-mono text-brand-deep/60 tabular-nums min-w-[52px] text-center">
            {Math.round(viewZoom * 100)}%
          </span>
          <button onClick={() => zoomBtn(1.33)} className="px-2.5 py-1.5 hover:bg-brand-bg-soft text-brand-deep/60 hover:text-brand-deep transition-colors border-l border-brand-deep/15">
            <ZoomIn size={14} />
          </button>
        </div>

        <button
          onClick={zoomToFit}
          className="px-3 py-1.5 rounded-lg border border-brand-deep/15 text-xs font-semibold text-brand-deep/60 hover:text-brand-deep hover:bg-brand-bg-soft transition-colors"
        >
          Fit all
        </button>

        <span className="ml-auto text-xs text-brand-deep/35">
          Scroll to pan · Ctrl + scroll to zoom · Drag to reschedule · Click to edit
        </span>
      </div>

      {/* ── Canvas viewport ───────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-[#f8fafb]"
        style={{ cursor: drag ? 'grabbing' : 'default' }}
      >
        {/* World canvas — transform applied here */}
        <div
          ref={canvasRef}
          className="absolute top-0 left-0 select-none"
          style={{
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: '0 0',
            transform: `translateX(${viewPanX}px) scale(${viewZoom})`,
            willChange: 'transform',
          }}
        >
          {/* ── Month header ─────────────────────────────────────────────────── */}
          {months.map((m, i) => (
            <div
              key={i}
              className="absolute top-0 flex items-center border-r border-brand-deep/10"
              style={{ left: m.x, width: m.w, height: 44, background: '#fff' }}
            >
              <span style={{ fontSize: 22, fontWeight: 800, color: '#003845', paddingLeft: 20, letterSpacing: '-0.5px', opacity: 0.9 }}>
                {m.label}
              </span>
            </div>
          ))}

          {/* ── Week header ──────────────────────────────────────────────────── */}
          {weeks.map((w, i) => (
            <div
              key={i}
              className="absolute flex items-center"
              style={{ left: w.x, top: 44, height: 44, minWidth: DAY_W * 7 }}
            >
              {/* Week separator */}
              <div className="absolute left-0 top-0 w-px h-full bg-brand-deep/10" />
              {/* Full-height week column line */}
              <div
                className="absolute left-0 w-px bg-brand-deep/5"
                style={{ top: 0, height: WORLD_H }}
              />
              <span style={{ fontSize: 18, fontWeight: 600, color: '#003845', opacity: 0.45, paddingLeft: 12 }}>
                {w.label}
              </span>
            </div>
          ))}

          {/* ── Timeline bar ────────────────────────────────────────────────── */}
          <div
            className="absolute left-0 right-0 bg-brand-deep/15"
            style={{ top: HEADER_H, height: 3 }}
          />

          {/* ── Today column ─────────────────────────────────────────────────── */}
          {tOff >= 0 && tOff < TOTAL_DAYS && (
            <>
              <div
                className="absolute bg-red-400/10"
                style={{ left: tOff * DAY_W, width: DAY_W, top: 0, height: WORLD_H }}
              />
              <div
                className="absolute bg-red-400"
                style={{ left: tOff * DAY_W + DAY_W / 2, top: HEADER_H - 8, width: 2, height: WORLD_H - HEADER_H + 8 }}
              />
              <div
                className="absolute rounded-full bg-red-400 border-2 border-white"
                style={{ left: tOff * DAY_W + DAY_W / 2 - 7, top: HEADER_H - 8, width: 14, height: 14, boxShadow: '0 0 0 3px rgba(248,113,113,0.25)' }}
              />
              <div
                className="absolute rounded-md px-2 py-0.5"
                style={{ left: tOff * DAY_W + DAY_W / 2 + 10, top: HEADER_H - 28, background: '#f87171', color: '#fff', fontSize: 16, fontWeight: 700 }}
              >
                Today
              </div>
            </>
          )}

          {/* ── Post cards ──────────────────────────────────────────────────── */}
          {layout.map(({ post, off, row }) => {
            const isDragging = drag?.slug === post.slug
            const x = off * DAY_W + (DAY_W - CARD_W) / 2
            const y = HEADER_H + CONNECTOR_H + row * ROW_H
            const sc = STATUS_COLOR[post.status] ?? '#9ca3af'
            const pc = PILLAR_HUE[post.pillar] ?? '#003845'

            return (
              <div key={post.slug} className="absolute" style={{ left: x, top: y, width: CARD_W, zIndex: isDragging ? 30 : 10 }}>
                {/* Connector */}
                <div className="absolute bg-brand-deep/15" style={{ left: CARD_W / 2, bottom: CARD_H, width: 2, height: CONNECTOR_H }} />
                {/* Timeline dot */}
                <div
                  className="absolute rounded-full border-4 border-white"
                  style={{ left: CARD_W / 2 - 8, bottom: CARD_H + CONNECTOR_H - 8, width: 16, height: 16, background: sc, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
                />

                {/* Card */}
                <div
                  onPointerDown={e => onPointerDown(e, post)}
                  onPointerMove={e => onPointerMove(e, post.slug)}
                  onPointerUp={e => onPointerUp(e, post)}
                  className={clsx(
                    'rounded-2xl bg-white overflow-hidden cursor-grab active:cursor-grabbing',
                    selected?.slug === post.slug ? 'ring-4 ring-brand-teal shadow-2xl' : 'shadow-md hover:shadow-xl',
                    isDragging && 'ring-4 ring-brand-teal shadow-2xl scale-[1.03] opacity-95',
                  )}
                  style={{
                    height: CARD_H,
                    touchAction: 'none',
                    transition: isDragging ? 'none' : 'box-shadow 0.15s, transform 0.1s',
                    borderLeft: `6px solid ${pc}`,
                  }}
                >
                  {/* Status strip */}
                  <div style={{ height: 8, background: sc, marginLeft: -1 }} />

                  <div style={{ padding: '14px 16px', height: CARD_H - 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* ID badge + platforms */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 14, fontWeight: 800, letterSpacing: '0.04em',
                          padding: '2px 8px', borderRadius: 6,
                          background: pc + '18', color: pc,
                        }}
                      >
                        {post.id}
                      </span>
                      <PlatformIcons platforms={post.platforms} size={14} />
                    </div>

                    {/* Title */}
                    <p style={{ fontSize: 17, fontWeight: 600, color: '#003845', lineHeight: 1.35, flex: 1 }}
                      className="line-clamp-3">
                      {post.title}
                    </p>

                    {/* Date + status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: isDragging ? '#008080' : 'rgba(0,56,69,0.4)', fontWeight: 600 }}>
                        {fmtDay(fromOffset(off))}
                      </span>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          background: sc + '22', color: sc === '#9ca3af' ? '#6b7280' : sc,
                          border: `1px solid ${sc}44`,
                        }}
                      >
                        {STATUS_LABELS[post.status]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Zoom hint overlay (shown when fully zoomed out) ─────────────── */}
        {zoom < 0.09 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-brand-deep/80 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
            Ctrl + scroll to zoom in
          </div>
        )}
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
