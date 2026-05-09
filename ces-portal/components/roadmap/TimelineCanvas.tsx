'use client'

import { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, Maximize2, CalendarDays, Plus } from 'lucide-react'
import { Post, STATUS_LABELS, PILLAR_LABELS, Pillar } from '@/types/post'
import { PlatformIcons } from './PlatformIcons'
import { PostEditPanel } from './PostEditPanel'
import { NewPostModal } from './NewPostModal'
import { StrategyCard } from './StrategyCard'
import { ViewSwitcher } from './ViewSwitcher'

// ─── World-space layout ───────────────────────────────────────────────────────
const DAY_W       = 200
const TOTAL_DAYS  = 184
const PANEL_W     = DAY_W * TOTAL_DAYS
const HEADER_H    = 96
const CARD_W      = 182
const CARD_H      = 230
const CARD_GAP    = 16
const ROW_H       = CARD_H + CARD_GAP
const CONNECTOR_H = 24
const PANEL_H     = HEADER_H + CONNECTOR_H + 6 * ROW_H + 80
const GAL_PAD     = 800
const WORLD_W     = PANEL_W + GAL_PAD * 2
const WORLD_H     = PANEL_H + GAL_PAD * 2

// Strategy card geometry (world-space, left of roadmap panel)
const STRAT_W     = 300
const STRAT_X     = GAL_PAD - STRAT_W - 160   // 160 px gap before roadmap
const STRAT_Y     = GAL_PAD + PANEL_H / 2 - 200 // vertically centred

const EPOCH     = new Date('2026-05-05T00:00:00Z')
const MIN_ZOOM  = 0.03
const MAX_ZOOM  = 3.0
const INIT_ZOOM = 0.55

const PILLAR_COLOR: Record<string, string> = {
  educational: '#008080', business: '#2563eb', premises: '#d97706',
  employee: '#16a34a', leadership: '#003845', events: '#7c3aed', tech: '#ea580c',
}
const STATUS_COLOR: Record<string, string> = {
  draft: '#9ca3af', 'clinical-review': '#f59e0b', 'brand-review': '#f97316',
  approved: '#22c55e', scheduled: '#3b82f6', live: '#008080',
}

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

function buildMonths() {
  const out: { label: string; x: number; w: number }[] = []
  let cur = new Date(EPOCH), x = 0
  while (x < PANEL_W) {
    const y = cur.getUTCFullYear(), m = cur.getUTCMonth()
    const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
    const used = Math.min(dim - cur.getUTCDate() + 1, TOTAL_DAYS - Math.round(x / DAY_W))
    out.push({ label: cur.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }), x, w: used * DAY_W })
    cur = new Date(Date.UTC(y, m + 1, 1)); x += used * DAY_W
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

// ─── 2D card stacking ─────────────────────────────────────────────────────────
// drag.idx = insert-before index in the target column (0 = top)
function stackCards(posts: Post[], drag: { slug: string; off: number; idx: number } | null) {
  if (!drag) {
    const cols = new Map<number, number>()
    return [...posts]
      .sort((a, b) => {
        const oa = toOff(a.scheduledDate), ob = toOff(b.scheduledDate)
        if (oa !== ob) return oa - ob
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      })
      .map(p => {
        const off = Math.max(0, Math.min(TOTAL_DAYS - 1, toOff(p.scheduledDate)))
        const r = cols.get(off) ?? 0; cols.set(off, r + 1)
        return { post: p, off, row: r }
      })
  }

  const { slug: ds, off: dOff, idx } = drag
  const draggedPost = posts.find(p => p.slug === ds)!

  // Build columns without dragged card
  const colMap = new Map<number, Post[]>()
  for (const p of posts) {
    if (p.slug === ds) continue
    const off = Math.max(0, Math.min(TOTAL_DAYS - 1, toOff(p.scheduledDate)))
    if (!colMap.has(off)) colMap.set(off, [])
    colMap.get(off)!.push(p)
  }
  for (const [, col] of colMap) col.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  // Insert dragged card at target position in target column
  if (!colMap.has(dOff)) colMap.set(dOff, [])
  const tc = colMap.get(dOff)!
  tc.splice(Math.min(idx, tc.length), 0, draggedPost)

  const result: { post: Post; off: number; row: number }[] = []
  for (const [off, col] of colMap) col.forEach((p, row) => result.push({ post: p, off, row }))
  return result
}

interface CardDrag {
  slug: string; post: Post
  startX: number; startY: number
  startOff: number; curOff: number
  startRow: number; insertIdx: number
}
interface PanDrag { startX: number; startY: number; startPanX: number; startPanY: number }

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

export function TimelineCanvas({ posts: init, roadmapId, switcher }: {
  posts: Post[]
  roadmapId?: string
  switcher?: React.ReactNode
}) {
  const [posts, setPosts]       = useState(init)
  const [selected, setSelected] = useState<Post | null>(null)
  const [showNewPost, setShowNewPost] = useState(false)

  // Sync when roadmap changes (key prop handles full remount, this covers partial updates)
  useEffect(() => { setPosts(init) }, [init])
  const [dragVisual, setDragVisual] = useState<{ slug: string; curOff: number; insertIdx: number } | null>(null)
  const [savedSlug, setSavedSlug]   = useState<string | null>(null)
  const [zoomPct, setZoomPct]       = useState(Math.round(INIT_ZOOM * 100))

  const zoomRef      = useRef(INIT_ZOOM)
  const panXRef      = useRef(0)
  const panYRef      = useRef(0)
  const panDrag      = useRef<PanDrag | null>(null)
  const cardDragRef  = useRef<CardDrag | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLDivElement>(null)
  const rafRef       = useRef<number>(0)

  // Compute layout — used both for rendering and for startRow calculation on drag start
  const drag = dragVisual ? { slug: dragVisual.slug, off: dragVisual.curOff, idx: dragVisual.insertIdx } : null
  const layout = stackCards(posts, drag)

  function applyTransform(z: number, x: number, y: number) {
    zoomRef.current = z; panXRef.current = x; panYRef.current = y
    if (canvasRef.current) canvasRef.current.style.transform = `translate(${x}px, ${y}px) scale(${z})`
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => setZoomPct(Math.round(z * 100)))
  }

  function centerOnPanel(z: number) {
    const vw = containerRef.current?.clientWidth  ?? window.innerWidth
    const vh = containerRef.current?.clientHeight ?? window.innerHeight
    const panelCenterY = -(GAL_PAD + PANEL_H / 2) * z + vh / 2

    // Always centre between strategy card and today so both are visible
    const stratMid   = STRAT_X + STRAT_W / 2
    const todayWorld = GAL_PAD + todayOff() * DAY_W
    const midWorld   = (stratMid + todayWorld) / 2
    return { x: -midWorld * z + vw / 2, y: panelCenterY }
  }

  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const { x, y } = centerOnPanel(INIT_ZOOM)
    applyTransform(INIT_ZOOM, x, y)

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const z = zoomRef.current, px = panXRef.current, py = panYRef.current
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      if (isHorizontal) {
        applyTransform(z, px - e.deltaX, py)
      } else if (e.ctrlKey || e.metaKey) {
        const rect = (containerRef.current as HTMLDivElement).getBoundingClientRect()
        const mx = e.clientX - rect.left, my = e.clientY - rect.top
        const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * Math.pow(0.999, e.deltaY)))
        applyTransform(nz, mx + (px - mx) * nz / z, my + (py - my) * nz / z)
      } else {
        const rect = (containerRef.current as HTMLDivElement).getBoundingClientRect()
        const mx = e.clientX - rect.left, my = e.clientY - rect.top
        const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * Math.pow(0.998, e.deltaY)))
        applyTransform(nz, mx + (px - mx) * nz / z, my + (py - my) * nz / z)
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => (el as HTMLDivElement).removeEventListener('wheel', onWheel)
  }, []) // eslint-disable-line

  function onContainerPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const cardEl = (e.target as HTMLElement).closest('[data-card]') as HTMLElement | null
    if (cardEl) {
      const slug = cardEl.dataset.slug!
      const post = posts.find(p => p.slug === slug)
      if (!post) return
      e.currentTarget.setPointerCapture(e.pointerId)
      const startOff = toOff(post.scheduledDate)
      const startRow = layout.find(l => l.post.slug === slug)?.row ?? 0
      cardDragRef.current = { slug, post, startX: e.clientX, startY: e.clientY, startOff, curOff: startOff, startRow, insertIdx: startRow }
      setDragVisual({ slug, curOff: startOff, insertIdx: startRow })
      setSelected(null)
    } else {
      e.currentTarget.setPointerCapture(e.pointerId)
      panDrag.current = { startX: e.clientX, startY: e.clientY, startPanX: panXRef.current, startPanY: panYRef.current }
    }
  }

  function onContainerPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const cd = cardDragRef.current
    if (cd) {
      // Horizontal → date
      const newOff = Math.max(0, Math.min(TOTAL_DAYS - 1,
        cd.startOff + Math.round((e.clientX - cd.startX) / (DAY_W * zoomRef.current))
      ))

      // Vertical → insert position within target column
      const rect = (containerRef.current as HTMLDivElement).getBoundingClientRect()
      const worldY = (e.clientY - rect.top - panYRef.current) / zoomRef.current - GAL_PAD
      const panelY = worldY - HEADER_H - CONNECTOR_H
      const targetColCount = posts.filter(p =>
        p.slug !== cd.slug &&
        Math.max(0, Math.min(TOTAL_DAYS - 1, toOff(p.scheduledDate))) === newOff
      ).length
      const newInsertIdx = Math.max(0, Math.min(targetColCount, Math.round(panelY / ROW_H)))

      if (newOff !== cd.curOff || newInsertIdx !== cd.insertIdx) {
        cd.curOff = newOff; cd.insertIdx = newInsertIdx
        setDragVisual({ slug: cd.slug, curOff: newOff, insertIdx: newInsertIdx })
      }
    } else if (panDrag.current) {
      applyTransform(zoomRef.current,
        panDrag.current.startPanX + e.clientX - panDrag.current.startX,
        panDrag.current.startPanY + e.clientY - panDrag.current.startY,
      )
    }
  }

  async function onContainerPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    const cd = cardDragRef.current
    if (cd) {
      cardDragRef.current = null
      setDragVisual(null)

      const dragDist = Math.sqrt((e.clientX - cd.startX) ** 2 + (e.clientY - cd.startY) ** 2)

      if (dragDist < 8) {
        // Tap — open panel
        setSelected(s => s?.slug === cd.slug ? null : cd.post)
      } else {
        // Drag — save new date + position
        const newDate = fromOff(cd.curOff)

        // Build target column: non-dragged cards sorted by sortOrder
        const targetColPosts = posts
          .filter(p => p.slug !== cd.slug && toOff(p.scheduledDate) === cd.curOff)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

        // Insert dragged card at chosen position
        const newCol = [...targetColPosts]
        newCol.splice(Math.min(cd.insertIdx, newCol.length), 0, cd.post)

        // PATCH all cards in target column with new sortOrder (and date for dragged card)
        const results = await Promise.all(
          newCol.map((p, idx) =>
            fetch(`/api/posts/${p.slug}`, {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sortOrder: idx,
                ...(p.slug === cd.slug ? { scheduledDate: newDate } : {}),
              }),
            }).then(r => r.ok ? r.json() : null)
          )
        )

        // Update local state
        const updMap = new Map(
          (results as (Post | null)[]).filter(Boolean).map(r => [r!.slug, r!])
        )
        setPosts(prev => prev.map(p => updMap.get(p.slug) ?? p))
        if (selected?.slug && updMap.has(selected.slug)) setSelected(updMap.get(selected.slug)!)

        setSavedSlug(cd.slug)
        setTimeout(() => setSavedSlug(s => s === cd.slug ? null : s), 2500)
      }
    }
    panDrag.current = null
  }

  function zoomBy(f: number) {
    const vw = containerRef.current?.clientWidth  ?? window.innerWidth
    const vh = containerRef.current?.clientHeight ?? window.innerHeight
    const mx = vw / 2, my = vh / 2
    const z = zoomRef.current, px = panXRef.current, py = panYRef.current
    const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * f))
    applyTransform(nz, mx + (px - mx) * nz / z, my + (py - my) * nz / z)
  }
  function jumpToday() { const { x, y } = centerOnPanel(zoomRef.current); applyTransform(zoomRef.current, x, y) }
  function fitAll() {
    const vw = containerRef.current?.clientWidth  ?? window.innerWidth
    const vh = containerRef.current?.clientHeight ?? window.innerHeight
    const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(vw / WORLD_W, vh / WORLD_H) * 0.85))
    applyTransform(nz, (vw - WORLD_W * nz) / 2, (vh - WORLD_H * nz) / 2)
  }

  const tOff = todayOff()

  return (
    <div className="flex fixed inset-0 z-10" style={{ paddingTop: '64px' }}>

      {/* Sidebar */}
      <div className="flex flex-col items-center gap-2 px-2 py-3 bg-white border-r border-brand-deep/10 shrink-0 z-40">
        <span className="text-[10px] font-mono font-bold text-brand-deep/30 tabular-nums pb-1">{zoomPct}%</span>
        <div className="w-7 h-px bg-brand-deep/10" />
        <SideBtn onClick={() => zoomBy(1.5)} title="Zoom in"><ZoomIn size={15} /></SideBtn>
        <SideBtn onClick={() => zoomBy(0.67)} title="Zoom out"><ZoomOut size={15} /></SideBtn>
        <SideBtn onClick={fitAll} title="Fit all"><Maximize2 size={14} /></SideBtn>
        <div className="w-7 h-px bg-brand-deep/10" />
        <SideBtn onClick={jumpToday} title="Jump to today"><CalendarDays size={14} /></SideBtn>
        <div className="w-7 h-px bg-brand-deep/10" />
        <SideBtn onClick={() => setShowNewPost(true)} title="New post"><Plus size={15} /></SideBtn>
      </div>

      {/* Canvas overlays: roadmap switcher top-left, view switcher top-right */}
      {switcher && (
        <div className="absolute top-[72px] left-14 z-20 pointer-events-auto">
          {switcher}
        </div>
      )}
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
          cursor: panDrag.current || cardDragRef.current ? 'grabbing' : 'grab',
        }}
        onPointerDown={onContainerPointerDown}
        onPointerMove={onContainerPointerMove}
        onPointerUp={onContainerPointerUp}
        onPointerCancel={onContainerPointerUp}
      >
        {/* Drag tooltip: date + position within column */}
        {dragVisual && (() => {
          const colCount = layout.filter(l => l.off === dragVisual.curOff).length
          const dateStr = new Date(fromOff(dragVisual.curOff) + 'T00:00:00Z')
            .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })
          return (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="flex items-center gap-3 bg-brand-deep text-white text-sm font-bold px-4 py-2 rounded-xl shadow-xl">
                <span className="opacity-60">→</span>
                {dateStr}
                {colCount > 1 && (
                  <span className="text-[11px] font-normal opacity-60">
                    · {dragVisual.insertIdx + 1} of {colCount}
                  </span>
                )}
              </div>
            </div>
          )
        })()}

        {/* Save toast */}
        {savedSlug && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="flex items-center gap-2 bg-green-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-xl">
              ✓ Saved
            </div>
          </div>
        )}

        {/* World canvas */}
        <div
          ref={canvasRef}
          className="absolute top-0 left-0"
          style={{ width: WORLD_W, height: WORLD_H, transformOrigin: '0 0', transform: `translate(0px, 0px) scale(${INIT_ZOOM})`, willChange: 'transform' }}
        >
          {/* ── Strategy card — always visible left of roadmap ───────────── */}
          <div style={{ position: 'absolute', left: STRAT_X, top: STRAT_Y, zIndex: 5 }}>
            <StrategyCard roadmapId={roadmapId} />
          </div>
          <div style={{ position: 'absolute', left: STRAT_X + STRAT_W, top: STRAT_Y + 200, width: GAL_PAD - STRAT_W - 160, height: 0, borderTop: '2px dashed rgba(0,56,69,0.14)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: STRAT_X + STRAT_W + 10, top: STRAT_Y + 200 - 18, fontSize: 10, fontWeight: 700, color: 'rgba(0,56,69,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', pointerEvents: 'none' }}>Strategy</div>
          <div style={{ position: 'absolute', left: GAL_PAD - 72, top: STRAT_Y + 200 - 18, fontSize: 10, fontWeight: 700, color: 'rgba(0,56,69,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', pointerEvents: 'none' }}>Roadmap</div>

          <div style={{ position: 'absolute', left: GAL_PAD, top: GAL_PAD, width: PANEL_W, height: PANEL_H }}>

            {/* Month header */}
            {MONTHS.map((m, i) => (
              <div key={i} className="absolute top-0 flex items-end"
                style={{ left: m.x, width: m.w, height: 52, borderRight: '1px solid rgba(0,56,69,0.12)', borderBottom: '1px solid rgba(0,56,69,0.1)' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#003845', paddingLeft: 20, paddingBottom: 10, letterSpacing: '-0.4px' }}>{m.label}</span>
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

            {/* Today indicator */}
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

            {/* Drop indicator line — shows where dragged card will land */}
            {dragVisual && (() => {
              const { curOff, insertIdx } = dragVisual
              const x = curOff * DAY_W + (DAY_W - CARD_W) / 2 - 4
              const y = HEADER_H + CONNECTOR_H + insertIdx * ROW_H - 5
              return (
                <div style={{
                  position: 'absolute', left: x, top: y,
                  width: CARD_W + 8, height: 4,
                  background: '#008080', borderRadius: 2,
                  pointerEvents: 'none', zIndex: 60,
                  boxShadow: '0 0 8px rgba(0,128,128,0.5)',
                }} />
              )
            })()}

            {/* Cards */}
            {layout.map(({ post, off, row }) => {
              const isDragging = dragVisual?.slug === post.slug
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
                    data-slug={post.slug}
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

      {/* Pillar colour legend — bottom-left of canvas */}
      <div className="absolute bottom-4 z-20 pointer-events-none"
        style={{ left: 56 }}>
        <div className="bg-white/90 backdrop-blur border border-brand-deep/10 rounded-xl px-3 py-2.5 shadow-sm">
          <p className="text-[9px] font-bold uppercase tracking-widest text-brand-deep/40 mb-2">Content pillars</p>
          <div className="flex flex-col gap-1">
            {(Object.entries(PILLAR_COLOR) as [Pillar, string][]).map(([pillar, color]) => (
              <div key={pillar} className="flex items-center gap-1.5">
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span className="text-[10px] font-medium" style={{ color: 'rgba(0,56,69,0.7)' }}>
                  {PILLAR_LABELS[pillar]}
                </span>
              </div>
            ))}
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
          onDelete={slug => {
            setPosts(prev => prev.filter(p => p.slug !== slug))
            setSelected(null)
          }}
        />
      )}

      {showNewPost && (
        <NewPostModal
          defaultDate={new Date().toISOString().slice(0, 10)}
          roadmapId={roadmapId}
          onClose={() => setShowNewPost(false)}
          onCreate={post => setPosts(prev => [...prev, post])}
        />
      )}
    </div>
  )
}
