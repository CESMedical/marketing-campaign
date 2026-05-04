'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { Grid2x2, ZoomIn, ZoomOut, Maximize2, CalendarDays, Undo2, Redo2 } from 'lucide-react'
import { Post, STATUS_LABELS, PILLAR_LABELS } from '@/types/post'
import { PlatformIcons } from './PlatformIcons'
import { PostEditPanel } from './PostEditPanel'

// ─── World-space layout ───────────────────────────────────────────────────────
const DAY_W       = 200
const TOTAL_DAYS  = 184
const WORLD_W     = DAY_W * TOTAL_DAYS
const HEADER_H    = 96
const CARD_W      = 182
const CARD_H      = 230
const CARD_GAP    = 16
const ROW_H       = CARD_H + CARD_GAP
const CONNECTOR_H = 24
const WORLD_H     = HEADER_H + CONNECTOR_H + 6 * ROW_H + 80

const EPOCH     = new Date('2026-05-05T00:00:00Z')
const MIN_ZOOM  = 0.04
const MAX_ZOOM  = 3.0
const INIT_ZOOM = 0.3

// ─── Colours ──────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  draft:            '#6b7280',
  'clinical-review':'#f59e0b',
  'brand-review':   '#f97316',
  approved:         '#22c55e',
  scheduled:        '#3b82f6',
  live:             '#14b8a6',
}
const PILLAR_COLOR: Record<string, string> = {
  educational: '#14b8a6',
  business:    '#3b82f6',
  premises:    '#f59e0b',
  employee:    '#22c55e',
  leadership:  '#8b5cf6',
  events:      '#ec4899',
  tech:        '#f97316',
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function toOff(s: string) {
  const d = new Date(s.slice(0, 10) + 'T00:00:00Z')
  return Math.round((d.getTime() - EPOCH.getTime()) / 86_400_000)
}
function fromOff(n: number) {
  const d = new Date(EPOCH)
  d.setUTCDate(d.getUTCDate() + Math.max(0, Math.min(TOTAL_DAYS - 1, n)))
  return d.toISOString().slice(0, 10)
}
function todayOff() { return toOff(new Date().toISOString().slice(0, 10)) }
function fmtDay(s: string) {
  return new Date(s + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

// ─── Header builders ──────────────────────────────────────────────────────────
function buildMonths() {
  const out: { label: string; x: number; w: number }[] = []
  let cur = new Date(EPOCH), x = 0
  while (x < WORLD_W) {
    const y = cur.getUTCFullYear(), m = cur.getUTCMonth()
    const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
    const used = Math.min(dim - cur.getUTCDate() + 1, TOTAL_DAYS - Math.round(x / DAY_W))
    out.push({ label: cur.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }), x, w: used * DAY_W })
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
      const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      const dn = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dn)
      const ys = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
      const wk = Math.ceil(((t.getTime() - ys.getTime()) / 86_400_000 + 1) / 7)
      out.push({ x: i * DAY_W, label: `W${wk} · ${d.getUTCDate()} ${d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}` })
    }
  }
  return out
}

// ─── Card stacking ────────────────────────────────────────────────────────────
function stackCards(posts: Post[], dragSlug: string | null, dragOff: number) {
  const cols = new Map<number, number>()
  return posts
    .map(p => ({ p, off: Math.max(0, Math.min(TOTAL_DAYS - 1, dragSlug === p.slug ? dragOff : toOff(p.scheduledDate))) }))
    .sort((a, b) => a.off - b.off)
    .map(({ p, off }) => { const r = cols.get(off) ?? 0; cols.set(off, r + 1); return { post: p, off, row: r } })
}

// ─── Drag state ───────────────────────────────────────────────────────────────
interface Drag { slug: string; startX: number; startOff: number; curOff: number }

const MONTHS = buildMonths()
const WEEKS  = buildWeeks()

// ─── Sidebar button ───────────────────────────────────────────────────────────
function SideBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center w-10 h-10 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
    >
      {children}
    </button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function TimelineCanvas({ posts: init }: { posts: Post[] }) {
  const [posts, setPosts]       = useState(init)
  const [selected, setSelected] = useState<Post | null>(null)
  const [drag, setDrag]         = useState<Drag | null>(null)
  const [zoomPct, setZoomPct]   = useState(Math.round(INIT_ZOOM * 100))

  const zoomRef  = useRef(INIT_ZOOM)
  const panXRef  = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLDivElement>(null)
  const rafRef       = useRef<number>(0)

  // ── clamp ──────────────────────────────────────────────────────────────────
  function clampX(x: number, z: number) {
    const vw = containerRef.current?.clientWidth ?? window.innerWidth
    const sw = WORLD_W * z
    if (sw <= vw) return (vw - sw) / 2
    return Math.max(vw - sw, Math.min(0, x))
  }

  // ── apply transform ────────────────────────────────────────────────────────
  function applyTransform(z: number, x: number) {
    zoomRef.current = z; panXRef.current = x
    if (canvasRef.current)
      canvasRef.current.style.transform = `translateX(${x}px) scale(${z})`
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => setZoomPct(Math.round(z * 100)))
  }

  // ── wheel (non-passive) ────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const vw = el.clientWidth
    applyTransform(INIT_ZOOM, clampX(-(todayOff() * DAY_W * INIT_ZOOM) + vw / 2, INIT_ZOOM))

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const z = zoomRef.current, x = panXRef.current
      const rect = (containerRef.current as HTMLDivElement).getBoundingClientRect()
      const mx = e.clientX - rect.left
      if (e.ctrlKey || e.metaKey) {
        const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * Math.pow(0.999, e.deltaY)))
        applyTransform(nz, clampX(mx + (x - mx) * nz / z, nz))
      } else {
        const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        applyTransform(z, clampX(x - raw, z))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => (el as HTMLDivElement).removeEventListener('wheel', onWheel)
  }, []) // eslint-disable-line

  // ── controls ───────────────────────────────────────────────────────────────
  function zoomBy(f: number) {
    const vw = containerRef.current?.clientWidth ?? window.innerWidth
    const mx = vw / 2, z = zoomRef.current, x = panXRef.current
    const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * f))
    applyTransform(nz, clampX(mx + (x - mx) * nz / z, nz))
  }
  function jumpToday() {
    const vw = containerRef.current?.clientWidth ?? window.innerWidth
    const z = zoomRef.current
    applyTransform(z, clampX(-(todayOff() * DAY_W * z) + vw / 2, z))
  }
  function fitAll() {
    const vw = containerRef.current?.clientWidth ?? window.innerWidth
    const nz = Math.max(MIN_ZOOM, vw / WORLD_W * 0.95)
    applyTransform(nz, clampX(0, nz))
  }

  // ── drag ───────────────────────────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent, post: Post) {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDrag({ slug: post.slug, startX: e.clientX, startOff: toOff(post.scheduledDate), curOff: toOff(post.scheduledDate) })
    setSelected(null)
  }
  function onPointerMove(e: React.PointerEvent, slug: string) {
    if (!drag || drag.slug !== slug) return
    const delta = Math.round((e.clientX - drag.startX) / (DAY_W * zoomRef.current))
    setDrag(d => d ? { ...d, curOff: Math.max(0, Math.min(TOTAL_DAYS - 1, d.startOff + delta)) } : null)
  }
  const onPointerUp = useCallback(async (e: React.PointerEvent, post: Post) => {
    if (!drag || drag.slug !== post.slug) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    const { curOff, startOff } = drag
    setDrag(null)
    if (curOff === startOff) { setSelected(s => s?.slug === post.slug ? null : post); return }
    const res = await fetch(`/api/posts/${post.slug}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledDate: fromOff(curOff) }),
    })
    if (res.ok) {
      const updated = await res.json()
      setPosts(prev => prev.map(p => p.slug === updated.slug ? updated : p))
      if (selected?.slug === updated.slug) setSelected(updated)
    }
  }, [drag, selected])

  const layout = stackCards(posts, drag?.slug ?? null, drag?.curOff ?? 0)
  const tOff   = todayOff()

  return (
    <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── Left sidebar ────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 px-1.5 py-2 z-40 shrink-0"
        style={{ background: 'rgba(14,17,23,0.95)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Zoom % */}
        <div className="text-[11px] font-mono font-semibold text-white/30 py-1 w-10 text-center tabular-nums">
          {zoomPct}%
        </div>

        <div className="w-8 h-px bg-white/10 my-1" />

        <SideBtn onClick={() => zoomBy(1.4)} title="Zoom in"><ZoomIn size={16} /></SideBtn>
        <SideBtn onClick={() => zoomBy(0.7)} title="Zoom out"><ZoomOut size={16} /></SideBtn>
        <SideBtn onClick={fitAll} title="Fit all"><Maximize2 size={15} /></SideBtn>

        <div className="w-8 h-px bg-white/10 my-1" />

        <SideBtn onClick={jumpToday} title="Jump to today"><CalendarDays size={15} /></SideBtn>
      </div>

      {/* ── Canvas viewport ──────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        style={{
          cursor: drag ? 'grabbing' : 'default',
          backgroundColor: '#0e1117',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        {/* World canvas */}
        <div
          ref={canvasRef}
          className="absolute top-0 left-0 select-none"
          style={{ width: WORLD_W, height: WORLD_H, transformOrigin: '0 0', transform: `translateX(0px) scale(${INIT_ZOOM})`, willChange: 'transform' }}
        >
          {/* Month header */}
          {MONTHS.map((m, i) => (
            <div key={i} className="absolute top-0 flex items-end"
              style={{ left: m.x, width: m.w, height: 52, borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.75)', paddingLeft: 20, paddingBottom: 8, letterSpacing: '-0.3px' }}>
                {m.label}
              </span>
            </div>
          ))}

          {/* Week header */}
          {WEEKS.map((w, i) => (
            <div key={i} className="absolute flex items-center"
              style={{ left: w.x, top: 52, height: 44, minWidth: DAY_W }}>
              <div className="absolute left-0 top-0 w-px h-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="absolute left-0 w-px" style={{ background: 'rgba(255,255,255,0.04)', top: 0, height: WORLD_H }} />
              <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.3)', paddingLeft: 14 }}>
                {w.label}
              </span>
            </div>
          ))}

          {/* Timeline bar */}
          <div className="absolute left-0 right-0"
            style={{ top: HEADER_H, height: 2, background: 'rgba(255,255,255,0.12)' }} />

          {/* Today highlight + line */}
          {tOff >= 0 && tOff < TOTAL_DAYS && (
            <>
              <div style={{ position: 'absolute', left: tOff * DAY_W, width: DAY_W, top: 0, height: WORLD_H, background: 'rgba(248,113,113,0.05)' }} />
              <div style={{ position: 'absolute', left: tOff * DAY_W + DAY_W / 2 - 1, top: HEADER_H - 10, width: 2, height: WORLD_H - HEADER_H + 10, background: '#f87171' }} />
              <div style={{ position: 'absolute', left: tOff * DAY_W + DAY_W / 2 - 8, top: HEADER_H - 10, width: 16, height: 16, borderRadius: '50%', background: '#f87171', boxShadow: '0 0 0 4px rgba(248,113,113,0.2)' }} />
              <div style={{ position: 'absolute', left: tOff * DAY_W + DAY_W / 2 + 14, top: HEADER_H - 32, background: '#f87171', color: '#fff', fontSize: 15, fontWeight: 800, padding: '3px 10px', borderRadius: 6 }}>
                Today
              </div>
            </>
          )}

          {/* Cards */}
          {layout.map(({ post, off, row }) => {
            const isDragging = drag?.slug === post.slug
            const x = off * DAY_W + (DAY_W - CARD_W) / 2
            const y = HEADER_H + CONNECTOR_H + row * ROW_H
            const sc = STATUS_COLOR[post.status] ?? '#6b7280'
            const pc = PILLAR_COLOR[post.pillar] ?? '#8b5cf6'

            return (
              <div key={post.slug} className="absolute"
                style={{ left: x, top: y, width: CARD_W, zIndex: isDragging ? 50 : 10 }}>

                {/* Connector */}
                <div style={{ position: 'absolute', left: CARD_W / 2 - 1, bottom: CARD_H, width: 2, height: CONNECTOR_H, background: 'rgba(255,255,255,0.15)' }} />
                {/* Dot */}
                <div style={{ position: 'absolute', left: CARD_W / 2 - 7, bottom: CARD_H + CONNECTOR_H - 7, width: 14, height: 14, borderRadius: '50%', background: sc, border: '3px solid #0e1117', boxShadow: `0 0 0 2px ${sc}55` }} />

                {/* Card */}
                <div
                  onPointerDown={e => onPointerDown(e, post)}
                  onPointerMove={e => onPointerMove(e, post.slug)}
                  onPointerUp={e => onPointerUp(e, post)}
                  className={clsx('cursor-grab active:cursor-grabbing')}
                  style={{
                    height: CARD_H,
                    touchAction: 'none',
                    borderRadius: 18,
                    background: '#161b27',
                    border: `1.5px solid ${selected?.slug === post.slug || isDragging ? pc : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: selected?.slug === post.slug || isDragging
                      ? `0 0 0 3px ${pc}40, 0 20px 40px rgba(0,0,0,0.5)`
                      : '0 4px 20px rgba(0,0,0,0.4)',
                    transform: isDragging ? 'scale(1.04)' : 'scale(1)',
                    transition: isDragging ? 'none' : 'box-shadow 0.2s, border-color 0.2s, transform 0.15s',
                    overflow: 'hidden',
                  }}
                >
                  {/* Coloured top strip */}
                  <div style={{ height: 6, background: pc, opacity: 0.85 }} />

                  <div style={{ padding: '16px 18px', height: CARD_H - 6, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* ID + platforms */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.05em', color: pc, background: pc + '18', padding: '3px 9px', borderRadius: 6 }}>
                        {post.id}
                      </span>
                      <PlatformIcons platforms={post.platforms} size={14} className="opacity-50" />
                    </div>

                    {/* Title */}
                    <p className="line-clamp-4" style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1.4, flex: 1 }}>
                      {post.title}
                    </p>

                    {/* Date + status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: isDragging ? '#14b8a6' : 'rgba(255,255,255,0.3)' }}>
                        {fmtDay(fromOff(off))}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, color: sc, background: sc + '22', border: `1px solid ${sc}44` }}>
                        {STATUS_LABELS[post.status]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Hint */}
        {zoomPct < 9 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/40 bg-white/5 px-4 py-2 rounded-full pointer-events-none backdrop-blur-sm">
            Ctrl + scroll to zoom · Scroll to pan
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
