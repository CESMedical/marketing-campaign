'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ZoomIn, ZoomOut, Maximize2, CalendarDays } from 'lucide-react'
import { Post, STATUS_LABELS } from '@/types/post'
import { PlatformIcons } from './PlatformIcons'
import { PostEditPanel } from './PostEditPanel'
import { ViewSwitcher } from './ViewSwitcher'

// ─── World-space layout ───────────────────────────────────────────────────────
const DAY_W       = 200
const TOTAL_DAYS  = 184
const PANEL_W     = DAY_W * TOTAL_DAYS   // the roadmap board
const HEADER_H    = 96
const CARD_W      = 182
const CARD_H      = 230
const CARD_GAP    = 16
const ROW_H       = CARD_H + CARD_GAP
const CONNECTOR_H = 24
const PANEL_H     = HEADER_H + CONNECTOR_H + 6 * ROW_H + 80

// Empty galaxy space around the panel (in world px)
const GAL_PAD     = 800
// Total world canvas size
const WORLD_W     = PANEL_W + GAL_PAD * 2
const WORLD_H     = PANEL_H + GAL_PAD * 2

const EPOCH     = new Date('2026-05-05T00:00:00Z')
const MIN_ZOOM  = 0.03
const MAX_ZOOM  = 3.0
const INIT_ZOOM = 0.55

// ─── Brand palette ────────────────────────────────────────────────────────────
const PILLAR_COLOR: Record<string, string> = {
  educational: '#008080',
  business:    '#2563eb',
  premises:    '#d97706',
  employee:    '#16a34a',
  leadership:  '#003845',
  events:      '#7c3aed',
  tech:        '#ea580c',
}
const STATUS_COLOR: Record<string, string> = {
  draft:            '#9ca3af',
  'clinical-review':'#f59e0b',
  'brand-review':   '#f97316',
  approved:         '#22c55e',
  scheduled:        '#3b82f6',
  live:             '#008080',
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function toOff(s: string) {
  return Math.round((new Date(s.slice(0, 10) + 'T00:00:00Z').getTime() - EPOCH.getTime()) / 86_400_000)
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

// ─── Header ───────────────────────────────────────────────────────────────────
function buildMonths() {
  const out: { label: string; x: number; w: number }[] = []
  let cur = new Date(EPOCH), x = 0
  while (x < PANEL_W) {
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
      out.push({ x: i * DAY_W, label: `W${wk}  ·  ${d.getUTCDate()} ${d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}` })
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

interface CardDrag { slug: string; startX: number; startOff: number; curOff: number }
interface PanDrag  { startX: number; startY: number; startPanX: number; startPanY: number }

const MONTHS = buildMonths()
const WEEKS  = buildWeeks()

function SideBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title}
      className="flex items-center justify-center w-9 h-9 rounded-xl border border-brand-deep/10 text-brand-deep/50 hover:text-brand-deep hover:bg-brand-bg-soft transition-all">
      {children}
    </button>
  )
}

export function TimelineCanvas({ posts: init }: { posts: Post[] }) {
  const [posts, setPosts]       = useState(init)
  const [selected, setSelected] = useState<Post | null>(null)
  const [cardDrag, setCardDrag] = useState<CardDrag | null>(null)
  const [zoomPct, setZoomPct]   = useState(Math.round(INIT_ZOOM * 100))
  const [panY, setPanY]         = useState(0)

  const zoomRef  = useRef(INIT_ZOOM)
  const panXRef  = useRef(0)
  const panYRef  = useRef(0)
  const panDrag  = useRef<PanDrag | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLDivElement>(null)
  const rafRef       = useRef<number>(0)

  function applyTransform(z: number, x: number, y: number) {
    zoomRef.current = z; panXRef.current = x; panYRef.current = y
    if (canvasRef.current)
      canvasRef.current.style.transform = `translate(${x}px, ${y}px) scale(${z})`
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      setZoomPct(Math.round(z * 100))
      setPanY(y)
    })
  }

  function centerOnPanel(z: number) {
    const vw = containerRef.current?.clientWidth  ?? window.innerWidth
    const vh = containerRef.current?.clientHeight ?? window.innerHeight
    // x: put today near 40% from left
    const todayX = -(GAL_PAD + todayOff() * DAY_W) * z + vw * 0.4
    // y: center the panel
    const panelCenterY = -(GAL_PAD + PANEL_H / 2) * z + vh / 2
    return { x: todayX, y: panelCenterY }
  }

  // ── wheel: vertical = zoom, horizontal = pan ──────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const { x, y } = centerOnPanel(INIT_ZOOM)
    applyTransform(INIT_ZOOM, x, y)

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const z = zoomRef.current, px = panXRef.current, py = panYRef.current

      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)

      if (isHorizontal) {
        // horizontal scroll → pan left/right
        applyTransform(z, px - e.deltaX, py)
      } else if (e.ctrlKey || e.metaKey) {
        // pinch / ctrl+scroll → zoom
        const rect = (containerRef.current as HTMLDivElement).getBoundingClientRect()
        const mx = e.clientX - rect.left, my = e.clientY - rect.top
        const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * Math.pow(0.999, e.deltaY)))
        applyTransform(nz, mx + (px - mx) * nz / z, my + (py - my) * nz / z)
      } else {
        // vertical scroll → zoom to cursor
        const rect = (containerRef.current as HTMLDivElement).getBoundingClientRect()
        const mx = e.clientX - rect.left, my = e.clientY - rect.top
        const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * Math.pow(0.998, e.deltaY)))
        applyTransform(nz, mx + (px - mx) * nz / z, my + (py - my) * nz / z)
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => (el as HTMLDivElement).removeEventListener('wheel', onWheel)
  }, []) // eslint-disable-line

  // ── canvas drag-to-pan ────────────────────────────────────────────────────
  function onCanvasPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('[data-card]')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    panDrag.current = { startX: e.clientX, startY: e.clientY, startPanX: panXRef.current, startPanY: panYRef.current }
  }
  function onCanvasPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!panDrag.current) return
    applyTransform(zoomRef.current,
      panDrag.current.startPanX + e.clientX - panDrag.current.startX,
      panDrag.current.startPanY + e.clientY - panDrag.current.startY,
    )
  }
  function onCanvasPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!panDrag.current) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    panDrag.current = null
  }

  // ── card drag ─────────────────────────────────────────────────────────────
  function onCardPointerDown(e: React.PointerEvent, post: Post) {
    e.stopPropagation(); e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setCardDrag({ slug: post.slug, startX: e.clientX, startOff: toOff(post.scheduledDate), curOff: toOff(post.scheduledDate) })
    setSelected(null)
  }
  function onCardPointerMove(e: React.PointerEvent, slug: string) {
    if (!cardDrag || cardDrag.slug !== slug) return
    const delta = Math.round((e.clientX - cardDrag.startX) / (DAY_W * zoomRef.current))
    setCardDrag(d => d ? { ...d, curOff: Math.max(0, Math.min(TOTAL_DAYS - 1, d.startOff + delta)) } : null)
  }
  const onCardPointerUp = useCallback(async (e: React.PointerEvent, post: Post) => {
    if (!cardDrag || cardDrag.slug !== post.slug) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    const { curOff, startOff } = cardDrag
    setCardDrag(null)
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
  }, [cardDrag, selected])

  // ── controls ──────────────────────────────────────────────────────────────
  function zoomBy(f: number) {
    const vw = containerRef.current?.clientWidth  ?? window.innerWidth
    const vh = containerRef.current?.clientHeight ?? window.innerHeight
    const mx = vw / 2, my = vh / 2
    const z = zoomRef.current, px = panXRef.current, py = panYRef.current
    const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * f))
    applyTransform(nz, mx + (px - mx) * nz / z, my + (py - my) * nz / z)
  }
  function jumpToday() {
    const { x, y } = centerOnPanel(zoomRef.current)
    applyTransform(zoomRef.current, x, y)
  }
  function fitAll() {
    const vw = containerRef.current?.clientWidth  ?? window.innerWidth
    const vh = containerRef.current?.clientHeight ?? window.innerHeight
    const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(vw / WORLD_W, vh / WORLD_H) * 0.85))
    const cx = (vw - WORLD_W * nz) / 2
    const cy = (vh - WORLD_H * nz) / 2
    applyTransform(nz, cx, cy)
  }

  const layout = stackCards(posts, cardDrag?.slug ?? null, cardDrag?.curOff ?? 0)
  const tOff   = todayOff()

  return (
    <div className="flex fixed inset-0 z-10" style={{ paddingTop: '64px' }}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-2 px-2 py-3 bg-white border-r border-brand-deep/10 shrink-0 z-40">
        <span className="text-[10px] font-mono font-bold text-brand-deep/30 tabular-nums pb-1">{zoomPct}%</span>
        <div className="w-7 h-px bg-brand-deep/10" />
        <SideBtn onClick={() => zoomBy(1.5)} title="Zoom in"><ZoomIn size={15} /></SideBtn>
        <SideBtn onClick={() => zoomBy(0.67)} title="Zoom out"><ZoomOut size={15} /></SideBtn>
        <SideBtn onClick={fitAll} title="Fit all"><Maximize2 size={14} /></SideBtn>
        <div className="w-7 h-px bg-brand-deep/10" />
        <SideBtn onClick={jumpToday} title="Jump to today"><CalendarDays size={14} /></SideBtn>
      </div>

      {/* ── Infinite canvas viewport ──────────────────────────────────────── */}
      {/* Floating overlay: view switcher top-right, controls bottom-left */}
      <div className="absolute top-[72px] right-4 z-20 pointer-events-auto">
        <ViewSwitcher />
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        style={{
          backgroundColor: '#eef2f4',
          backgroundImage: 'radial-gradient(circle, rgba(0,56,69,0.18) 1.5px, transparent 1.5px)',
          backgroundSize: '26px 26px',
          cursor: panDrag.current ? 'grabbing' : cardDrag ? 'grabbing' : 'grab',
        }}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onPointerCancel={onCanvasPointerUp}
      >
        {/* World canvas — includes galaxy padding around the panel */}
        <div
          ref={canvasRef}
          className="absolute top-0 left-0"
          style={{
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: '0 0',
            transform: `translate(0px, 0px) scale(${INIT_ZOOM})`,
            willChange: 'transform',
          }}
        >
          {/* ── Roadmap content — cards float directly on the canvas ──────── */}
          <div
            style={{
              position: 'absolute',
              left: GAL_PAD,
              top: GAL_PAD,
              width: PANEL_W,
              height: PANEL_H,
            }}
          >
            {/* Month header */}
            {MONTHS.map((m, i) => (
              <div key={i} className="absolute top-0 flex items-end"
                style={{ left: m.x, width: m.w, height: 52, borderRight: '1px solid rgba(0,56,69,0.12)', borderBottom: '1px solid rgba(0,56,69,0.1)' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#003845', paddingLeft: 20, paddingBottom: 10, letterSpacing: '-0.4px' }}>
                  {m.label}
                </span>
              </div>
            ))}

            {/* Week header */}
            {WEEKS.map((w, i) => (
              <div key={i} className="absolute flex items-center"
                style={{ left: w.x, top: 52, height: 44, minWidth: DAY_W }}>
                <div className="absolute left-0 top-0 h-full w-px" style={{ background: 'rgba(0,56,69,0.08)' }} />
                <div className="absolute left-0 w-px" style={{ background: 'rgba(0,56,69,0.04)', top: 0, height: PANEL_H }} />
                <span style={{ fontSize: 17, fontWeight: 600, color: '#003845', opacity: 0.32, paddingLeft: 14 }}>{w.label}</span>
              </div>
            ))}

            {/* Timeline bar */}
            <div className="absolute left-0 right-0" style={{ top: HEADER_H, height: 3, background: 'rgba(0,56,69,0.12)' }} />

            {/* Today */}
            {tOff >= 0 && tOff < TOTAL_DAYS && (
              <>
                <div style={{ position: 'absolute', left: tOff * DAY_W, width: DAY_W, top: 0, height: PANEL_H, background: 'rgba(0,128,128,0.05)' }} />
                <div style={{ position: 'absolute', left: tOff * DAY_W + DAY_W / 2 - 1, top: HEADER_H - 12, width: 2, height: PANEL_H - HEADER_H + 12, background: '#008080' }} />
                <div style={{ position: 'absolute', left: tOff * DAY_W + DAY_W / 2 - 9, top: HEADER_H - 12, width: 18, height: 18, borderRadius: '50%', background: '#008080', border: '3px solid #eef2f4', boxShadow: '0 0 0 3px rgba(0,128,128,0.2)' }} />
                <div style={{ position: 'absolute', left: tOff * DAY_W + DAY_W / 2 + 16, top: HEADER_H - 40, background: '#008080', color: '#fff', fontSize: 16, fontWeight: 800, padding: '4px 12px', borderRadius: 8 }}>
                  Today
                </div>
              </>
            )}

            {/* Cards */}
            {layout.map(({ post, off, row }) => {
              const isDragging = cardDrag?.slug === post.slug
              const isSelected = selected?.slug === post.slug
              const x = off * DAY_W + (DAY_W - CARD_W) / 2
              const y = HEADER_H + CONNECTOR_H + row * ROW_H
              const sc = STATUS_COLOR[post.status] ?? '#9ca3af'
              const pc = PILLAR_COLOR[post.pillar] ?? '#003845'

              return (
                <div key={post.slug} data-card="1" style={{ position: 'absolute', left: x, top: y, width: CARD_W, zIndex: isDragging ? 50 : 10 }}>
                  <div style={{ position: 'absolute', left: CARD_W / 2 - 1, bottom: CARD_H, width: 2, height: CONNECTOR_H, background: 'rgba(0,56,69,0.15)' }} />
                  <div style={{ position: 'absolute', left: CARD_W / 2 - 8, bottom: CARD_H + CONNECTOR_H - 8, width: 16, height: 16, borderRadius: '50%', background: sc, border: '4px solid #eef2f4', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }} />

                  <div
                    data-card="1"
                    onPointerDown={e => onCardPointerDown(e, post)}
                    onPointerMove={e => onCardPointerMove(e, post.slug)}
                    onPointerUp={e => onCardPointerUp(e, post)}
                    style={{
                      height: CARD_H, touchAction: 'none',
                      borderRadius: 18,
                      background: '#fff',
                      border: `1.5px solid ${isSelected || isDragging ? pc : 'rgba(0,56,69,0.1)'}`,
                      borderLeft: `6px solid ${pc}`,
                      boxShadow: isSelected || isDragging
                        ? `0 0 0 3px ${pc}28, 0 12px 32px rgba(0,56,69,0.15)`
                        : '0 2px 12px rgba(0,56,69,0.07)',
                      transform: isDragging ? 'scale(1.03)' : 'scale(1)',
                      transition: isDragging ? 'none' : 'box-shadow 0.2s, border-color 0.2s, transform 0.1s',
                      overflow: 'hidden',
                      cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                  >
                    <div style={{ height: 7, background: sc }} />
                    <div style={{ padding: '16px 18px', height: CARD_H - 7, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.05em', color: pc, background: pc + '15', padding: '3px 10px', borderRadius: 6 }}>{post.id}</span>
                        <PlatformIcons platforms={post.platforms} size={14} />
                      </div>
                      <p className="line-clamp-4" style={{ fontSize: 18, fontWeight: 600, color: '#003845', lineHeight: 1.4, flex: 1 }}>{post.title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: isDragging ? '#008080' : 'rgba(0,56,69,0.38)' }}>{fmtDay(fromOff(off))}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, color: '#fff', background: sc }}>{STATUS_LABELS[post.status]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
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
