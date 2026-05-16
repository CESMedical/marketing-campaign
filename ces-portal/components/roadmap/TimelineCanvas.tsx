'use client'

import { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, Maximize2, CalendarDays, Plus, ChevronsRight, Loader2, X, Link2 } from 'lucide-react'
import { Post, STATUS_LABELS, PILLAR_LABELS, Pillar } from '@/types/post'
import { PlatformIcons } from './PlatformIcons'
import { PostEditPanel } from './PostEditPanel'
import { NewPostModal } from './NewPostModal'
import { StrategyCard } from './StrategyCard'
import { ViewSwitcher } from './ViewSwitcher'
import { VideographyStrategyCard, ConsultantInterviewCard, LeonnaProductionCard, PatientStoriesCard, TeamPhotographyCard, ProductionScheduleCard } from './VideographyCards'
import { LinkedInStrategyCard } from './LinkedInStrategyCard'
import { CONSULTANT_INTERVIEWS } from '@/lib/videography-content'
import { useSession } from 'next-auth/react'
import { canEditPost } from '@/lib/permissions'

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
const WORLD_H     = PANEL_H + GAL_PAD * 2 + 1400  // extra for production cards below roadmap

// Strategy card geometry (world-space, left of roadmap panel)
const STRAT_W     = 300
const STRAT_X     = GAL_PAD - STRAT_W - 160   // 160 px gap before roadmap
const STRAT_Y     = GAL_PAD + PANEL_H / 2 - 200 // vertically centred

// Videography strategy card — below strategy card
const VID_CARD_W  = 300
const VID_STRAT_X = STRAT_X
const VID_STRAT_Y = STRAT_Y + 520

// Platform strategy cards — below videography strategy card
const LI_STRAT_X  = STRAT_X
const LI_STRAT_Y  = VID_STRAT_Y + 540

// Consultant interview cards — row below the roadmap panel
const CONSULT_Y      = GAL_PAD + PANEL_H + 100
const CONSULT_GAP    = 40
// Production asset cards — row below consultant cards
const PROD_CARD_Y    = CONSULT_Y + 430

const EPOCH     = new Date('2026-04-27T00:00:00Z')
const MIN_ZOOM  = 0.15
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

// ─── Draggable world-space card wrapper ───────────────────────────────────────
// Wraps any card so it can be repositioned freely on the canvas.
// ── Node / edge connector system ─────────────────────────────────────────────
interface CanvasNode { id: string; x: number; y: number }
interface CanvasEdge { id: string; from: string; to: string }

function defaultNodesEdges(): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  let n = 0
  const uid = () => `init-${n++}`
  const nodes: CanvasNode[] = []
  const edges: CanvasEdge[] = []

  function line(ax: number, ay: number, bx: number, by: number) {
    const a = { id: uid(), x: ax, y: ay }
    const b = { id: uid(), x: bx, y: by }
    nodes.push(a, b)
    edges.push({ id: uid(), from: a.id, to: b.id })
  }

  // Strategy → Videography card (straight vertical)
  line(STRAT_X + 150, STRAT_Y + 370, VID_STRAT_X + 150, VID_STRAT_Y)

  // Videography → 4 consultant cards: shared trunk node + junction + 4 branches
  const vidBot  = { id: uid(), x: VID_STRAT_X + 150, y: VID_STRAT_Y + 480 }
  const junction = { id: uid(), x: VID_STRAT_X + 150, y: CONSULT_Y - 50 }
  nodes.push(vidBot, junction)
  edges.push({ id: uid(), from: vidBot.id, to: junction.id })
  for (let i = 0; i < 4; i++) {
    const cx  = GAL_PAD + i * (VID_CARD_W + CONSULT_GAP) + 150
    const jBr = { id: uid(), x: cx, y: CONSULT_Y - 50 }
    const cTop = { id: uid(), x: cx, y: CONSULT_Y }
    nodes.push(jBr, cTop)
    edges.push({ id: uid(), from: junction.id, to: jBr.id })
    edges.push({ id: uid(), from: jBr.id,      to: cTop.id })
  }

  // Strategy → Roadmap: L-shape via 3 nodes (start → corner → roadmap)
  const sRight  = { id: uid(), x: STRAT_X + STRAT_W, y: STRAT_Y }
  const corner  = { id: uid(), x: STRAT_X + STRAT_W, y: GAL_PAD + HEADER_H }
  const roadmap = { id: uid(), x: GAL_PAD,            y: GAL_PAD + HEADER_H }
  nodes.push(sRight, corner, roadmap)
  edges.push({ id: uid(), from: sRight.id, to: corner.id })
  edges.push({ id: uid(), from: corner.id, to: roadmap.id })

  return { nodes, edges }
}

type SubMode = 'place' | 'connect' | 'delete'

// A draggable bullet-point node.
function NodeDot({ node, zoomRef, subMode, isPending, onDragEnd, onConnectClick, onDelete }: {
  node: CanvasNode
  zoomRef: React.MutableRefObject<number>
  subMode: SubMode
  isPending: boolean
  onDragEnd: (id: string, pos: { x: number; y: number }) => void
  onConnectClick: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [pos, setPos] = useState({ x: node.x, y: node.y })
  const [hovered, setHovered] = useState(false)
  const dragRef = useRef<{ sx: number; sy: number; wx: number; wy: number; moved: boolean } | null>(null)
  useEffect(() => { setPos({ x: node.x, y: node.y }) }, [node.x, node.y])

  const isDelete = subMode === 'delete'
  const isConnect = subMode === 'connect'

  function onPointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    if (isDelete) { onDelete(node.id); return }
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { sx: e.clientX, sy: e.clientY, wx: pos.x, wy: pos.y, moved: false }
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current; if (!d) return
    const z = zoomRef.current
    const dx = (e.clientX - d.sx) / z, dy = (e.clientY - d.sy) / z
    if (!d.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) d.moved = true
    if (d.moved) setPos({ x: d.wx + dx, y: d.wy + dy })
  }
  function onPointerUp(e: React.PointerEvent) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    const d = dragRef.current
    if (d?.moved) {
      const z = zoomRef.current
      const final = { x: d.wx + (e.clientX - d.sx) / z, y: d.wy + (e.clientY - d.sy) / z }
      setPos(final); onDragEnd(node.id, final)
    } else if (d && isConnect) {
      onConnectClick(node.id)
    }
    dragRef.current = null
  }

  const bg = isDelete && hovered ? '#ef4444'
    : isPending ? '#0ea5e9'
    : 'rgba(0,56,69,0.25)'
  const border = isDelete && hovered ? '#ef4444'
    : isPending ? '#0ea5e9'
    : 'rgba(0,56,69,0.38)'
  const cursor = isDelete ? 'pointer' : isConnect ? 'crosshair' : 'grab'

  return (
    <div
      style={{ position: 'absolute', left: pos.x - 8, top: pos.y - 8, width: 16, height: 16, zIndex: 20 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', boxSizing: 'border-box',
        background: bg,
        border: `${isPending ? 2 : 1.5}px solid ${border}`,
        cursor,
        outline: isPending ? '3px solid rgba(14,165,233,0.3)' : 'none', outlineOffset: 3,
        boxShadow: isPending ? '0 0 0 5px rgba(14,165,233,0.15)' : 'none',
        transition: 'background 0.1s, border-color 0.1s',
      }} />
    </div>
  )
}

// A rigid straight dotted line between two nodes.
function EdgeLine({ fromNode, toNode, subMode, onDelete }: {
  fromNode: CanvasNode; toNode: CanvasNode
  subMode: SubMode; onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const fx = fromNode.x, fy = fromNode.y, tx = toNode.x, ty = toNode.y
  const minX = Math.min(fx, tx) - 10, minY = Math.min(fy, ty) - 10
  const svgW = Math.abs(tx - fx) + 20,  svgH = Math.abs(ty - fy) + 20
  const midX = (fx + tx) / 2,           midY = (fy + ty) / 2
  const isDelete = subMode === 'delete'
  const stroke = isDelete && hovered ? 'rgba(239,68,68,0.6)' : 'rgba(0,56,69,0.22)'
  return (
    <>
      <svg
        style={{ position: 'absolute', left: minX, top: minY, width: svgW, height: svgH, overflow: 'visible', pointerEvents: isDelete ? 'all' : 'none', zIndex: 4, cursor: isDelete ? 'pointer' : 'default' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={isDelete ? (e) => { e.stopPropagation(); onDelete() } : undefined}
      >
        {/* fat invisible hit area */}
        <line x1={fx - minX} y1={fy - minY} x2={tx - minX} y2={ty - minY}
          stroke="transparent" strokeWidth={12} />
        <line x1={fx - minX} y1={fy - minY} x2={tx - minX} y2={ty - minY}
          stroke={stroke} strokeWidth={2} strokeDasharray="8 5" strokeLinecap="round"
          style={{ transition: 'stroke 0.1s' }} />
      </svg>
      {/* delete × shown on midpoint when in delete mode and hovered */}
      {isDelete && hovered && (
        <div
          onPointerDown={e => e.stopPropagation()}
          onClick={() => onDelete()}
          style={{ position: 'absolute', left: midX - 9, top: midY - 9, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', border: '2px solid #fff', cursor: 'pointer', fontSize: 10, fontWeight: 900, zIndex: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.2)', pointerEvents: 'none' }}
        >×</div>
      )}
    </>
  )
}

// Position is persisted to localStorage by storageKey.
function DraggableWorldCard({
  initialX, initialY, storageKey, zoomRef, children, onSaved,
}: {
  initialX: number; initialY: number; storageKey: string
  zoomRef: React.MutableRefObject<number>; children: React.ReactNode
  onSaved?: () => void
}) {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: initialX, y: initialY })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`card-pos-${storageKey}`)
      if (saved) setPos(JSON.parse(saved))
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const [dragging, setDragging]   = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const dragRef = useRef<{ sx: number; sy: number; wx: number; wy: number; moved: boolean } | null>(null)

  function onPointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    if ((e.target as HTMLElement).closest('button,input,textarea,a,select')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { sx: e.clientX, sy: e.clientY, wx: pos.x, wy: pos.y, moved: false }
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current; if (!d) return
    const zoom = zoomRef.current
    const dx = (e.clientX - d.sx) / zoom, dy = (e.clientY - d.sy) / zoom
    if (!d.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) { d.moved = true; setDragging(true) }
    if (d.moved) setPos({ x: d.wx + dx, y: d.wy + dy })
  }
  function onPointerUp(e: React.PointerEvent) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    const d = dragRef.current
    if (d?.moved) {
      const zoom = zoomRef.current
      const final = { x: d.wx + (e.clientX - d.sx) / zoom, y: d.wy + (e.clientY - d.sy) / zoom }
      setPos(final)
      try { localStorage.setItem(`card-pos-${storageKey}`, JSON.stringify(final)) } catch {}
      onSaved?.()
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    }
    dragRef.current = null
    setDragging(false)
  }

  return (
    <div
      style={{ position: 'absolute', left: pos.x, top: pos.y, zIndex: dragging ? 30 : 5, cursor: dragging ? 'grabbing' : undefined }}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
    >
      {justSaved && (
        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8, background: '#22c55e', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          ✓ Position saved
        </div>
      )}
      {children}
    </div>
  )
}

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
  const { data: session } = useSession()
  const canEdit = canEditPost(session?.user?.role)

  const [posts, setPosts]       = useState(init)
  const [selected, setSelected] = useState<Post | null>(null)
  const [showNewPost, setShowNewPost] = useState(false)
  const [showShift, setShowShift]     = useState(false)
  const [shiftAmt, setShiftAmt]       = useState(7)
  const [shifting, setShifting]       = useState(false)
  const [cursorStyle, setCursorStyle] = useState<'grab' | 'grabbing'>('grab')

  // ── Node / edge connector system ─────────────────────────────────────────
  const [connectMode, setConnectMode] = useState(false)
  const [subMode, setSubMode]         = useState<SubMode>('place')
  const [pendingFrom, setPendingFrom] = useState<string | null>(null) // node id
  const [nodes, setNodes] = useState<CanvasNode[]>([])
  const [edges, setEdges] = useState<CanvasEdge[]>([])
  const [layoutVersion, setLayoutVersion] = useState(0)

  const nodesRef          = useRef<CanvasNode[]>([])
  const edgesRef          = useRef<CanvasEdge[]>([])
  const syncTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastLocalChangeRef = useRef<number>(0)
  const CARD_KEYS = ['vid-strategy', 'li-strategy', 'consultant-1', 'consultant-2', 'consultant-3', 'consultant-4', 'prod-leonna', 'prod-patient', 'prod-team', 'prod-schedule']

  useEffect(() => { nodesRef.current = nodes }, [nodes])
  useEffect(() => { edgesRef.current = edges }, [edges])

  // Seed from localStorage on first mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('canvas-nodes-edges-v1')
      if (saved) {
        const { nodes: n, edges: e } = JSON.parse(saved)
        setNodes(n); setEdges(e)
      } else {
        const def = defaultNodesEdges()
        setNodes(def.nodes); setEdges(def.edges)
        localStorage.setItem('canvas-nodes-edges-v1', JSON.stringify(def))
      }
    } catch {}
  }, [])

  type LayoutPayload = { cardPositions?: Record<string, { x: number; y: number }>; nodes?: CanvasNode[]; edges?: CanvasEdge[] }

  function applyServerLayout(data: LayoutPayload) {
    let changed = false
    if (data.cardPositions) {
      for (const [key, pos] of Object.entries(data.cardPositions)) {
        localStorage.setItem(`card-pos-${key}`, JSON.stringify(pos)); changed = true
      }
    }
    if (data.nodes?.length) {
      localStorage.setItem('canvas-nodes-edges-v1', JSON.stringify({ nodes: data.nodes, edges: data.edges ?? [] }))
      setNodes(data.nodes); setEdges(data.edges ?? []); changed = true
    }
    if (changed) setLayoutVersion(v => v + 1)
  }

  useEffect(() => {
    if (!roadmapId) return
    fetch(`/api/roadmaps/${roadmapId}/canvas`)
      .then(r => r.ok ? r.json() : null)
      .then((data: LayoutPayload | null) => { if (data) applyServerLayout(data) })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmapId])

  useEffect(() => {
    if (!roadmapId) return
    const id = setInterval(() => {
      if (Date.now() - lastLocalChangeRef.current < 10_000) return
      fetch(`/api/roadmaps/${roadmapId}/canvas`)
        .then(r => r.ok ? r.json() : null)
        .then((data: LayoutPayload | null) => { if (data) applyServerLayout(data) })
        .catch(() => {})
    }, 20_000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmapId])

  // Poll for post changes (dates, status, sortOrder) made by other users.
  useEffect(() => {
    if (!roadmapId) return
    const id = setInterval(() => {
      fetch(`/api/posts?r=${roadmapId}`)
        .then(r => r.ok ? r.json() : null)
        .then((fresh: Post[] | null) => { if (fresh?.length) setPosts(fresh) })
        .catch(() => {})
    }, 30_000)
    return () => clearInterval(id)
  }, [roadmapId])

  useEffect(() => {
    if (!connectMode) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setConnectMode(false); setPendingFrom(null); setSubMode('place') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [connectMode])

  function scheduleSync() {
    if (!roadmapId) return
    lastLocalChangeRef.current = Date.now()
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      const cardPositions: Record<string, { x: number; y: number }> = {}
      for (const key of CARD_KEYS) {
        try {
          const saved = localStorage.getItem(`card-pos-${key}`)
          if (saved) cardPositions[key] = JSON.parse(saved)
        } catch {}
      }
      fetch(`/api/roadmaps/${roadmapId}/canvas`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardPositions, nodes: nodesRef.current, edges: edgesRef.current }),
      }).catch(() => {})
    }, 2000)
  }

  function saveGraph(n: CanvasNode[], e: CanvasEdge[]) {
    setNodes(n); setEdges(e)
    try { localStorage.setItem('canvas-nodes-edges-v1', JSON.stringify({ nodes: n, edges: e })) } catch {}
    scheduleSync()
  }

  // Place a new node at world coords; if pendingFrom is set, also create an edge.
  function placeNode(wx: number, wy: number) {
    const newNode: CanvasNode = { id: `node-${Date.now()}`, x: wx, y: wy }
    if (pendingFrom) {
      const newEdge: CanvasEdge = { id: `edge-${Date.now()}`, from: pendingFrom, to: newNode.id }
      saveGraph([...nodes, newNode], [...edges, newEdge])
      setPendingFrom(newNode.id) // continue the chain
    } else {
      saveGraph([...nodes, newNode], edges)
      setPendingFrom(newNode.id)
    }
  }

  function handleNodeConnectClick(nodeId: string) {
    if (subMode !== 'connect') return
    if (!pendingFrom) {
      setPendingFrom(nodeId)
    } else if (pendingFrom === nodeId) {
      setPendingFrom(null)
    } else {
      const newEdge: CanvasEdge = { id: `edge-${Date.now()}`, from: pendingFrom, to: nodeId }
      saveGraph(nodes, [...edges, newEdge])
      setPendingFrom(null)
    }
  }

  function handleNodeDragEnd(id: string, pos: { x: number; y: number }) {
    saveGraph(nodes.map(n => n.id === id ? { ...n, ...pos } : n), edges)
  }

  function deleteNode(id: string) {
    saveGraph(nodes.filter(n => n.id !== id), edges.filter(e => e.from !== id && e.to !== id))
    if (pendingFrom === id) setPendingFrom(null)
  }

  function deleteEdge(id: string) {
    saveGraph(nodes, edges.filter(e => e.id !== id))
  }

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
    if (connectMode && subMode === 'place') {
      // Place a new node at the clicked world position (card/node clicks stop propagation so won't reach here)
      const rect = containerRef.current!.getBoundingClientRect()
      const wx = (e.clientX - rect.left - panXRef.current) / zoomRef.current
      const wy = (e.clientY - rect.top  - panYRef.current) / zoomRef.current
      placeNode(wx, wy)
      return
    }
    if (connectMode && (subMode === 'connect' || subMode === 'delete')) {
      // In connect/delete mode, empty canvas clicks do nothing (only node/edge interactions matter)
      return
    }
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
      setCursorStyle('grabbing')
    } else {
      e.currentTarget.setPointerCapture(e.pointerId)
      panDrag.current = { startX: e.clientX, startY: e.clientY, startPanX: panXRef.current, startPanY: panYRef.current }
      setCursorStyle('grabbing')
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
    panDrag.current  = null
    cardDragRef.current = null
    setCursorStyle('grab')
  }

  function addDays(dateStr: string, delta: number): string {
    // slice(0,10) handles both 'YYYY-MM-DD' and full ISO strings from the DB
    const d = new Date(dateStr.slice(0, 10) + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + delta)
    return d.toISOString().slice(0, 10)
  }

  async function applyShift(delta: number) {
    if (!delta || shifting) return
    setShifting(true)
    try {
      const results = await Promise.all(
        posts.map(post =>
          fetch(`/api/posts/${post.slug}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scheduledDate: addDays(post.scheduledDate, delta) }),
          })
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)          // one failure must not cancel the rest
        )
      )
      const updMap = new Map(
        (results as (Post | null)[]).filter(Boolean).map(r => [r!.slug, r!])
      )
      setPosts(prev => prev.map(p => updMap.get(p.slug) ?? p))
      setShowShift(false)
      setSavedSlug('__shift__')
      setTimeout(() => setSavedSlug(s => s === '__shift__' ? null : s), 2500)
    } finally {
      setShifting(false)
    }
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
    <div className="flex fixed inset-0 z-10" style={{ paddingTop: '64px', background: '#eef2f4' }}>

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
        {canEdit && <>
          <div className="w-7 h-px bg-brand-deep/10" />
          <SideBtn onClick={() => setShowShift(true)} title="Shift all posts in time"><ChevronsRight size={15} /></SideBtn>
        </>}
        <div className="w-7 h-px bg-brand-deep/10" />
        <button
          onClick={() => { setConnectMode(m => !m); setPendingFrom(null); setSubMode('place') }}
          title="Connectors"
          className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${connectMode ? 'bg-sky-500 border-sky-500 text-white' : 'border-brand-deep/10 text-brand-deep/50 hover:text-brand-deep hover:bg-brand-bg-soft'}`}
        >
          <Link2 size={14} />
        </button>
      </div>

      {/* ── Connector control panel — appears to the right of sidebar when active ── */}
      {connectMode && (
        <div style={{ position: 'absolute', left: 52, top: 72, zIndex: 50, width: 186, background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,56,69,0.14)', border: '1px solid rgba(0,56,69,0.1)', padding: '12px 10px' }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: 'rgba(0,56,69,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Connectors</p>

          {/* Sub-mode buttons */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {(['place', 'connect', 'delete'] as SubMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setSubMode(m); setPendingFrom(null) }}
                style={{
                  flex: 1, padding: '5px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                  background: subMode === m ? (m === 'delete' ? '#ef4444' : '#0ea5e9') : 'rgba(0,56,69,0.06)',
                  color: subMode === m ? '#fff' : 'rgba(0,56,69,0.55)',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {m === 'place' ? '+ Place' : m === 'connect' ? '— Link' : '× Delete'}
              </button>
            ))}
          </div>

          {/* Instruction hint */}
          <p style={{ fontSize: 10, color: 'rgba(0,56,69,0.4)', lineHeight: 1.5, marginBottom: 10, minHeight: 30 }}>
            {subMode === 'place' && (pendingFrom ? 'Click canvas to extend the line, or click a node to finish.' : 'Click anywhere on the canvas to place a node.')}
            {subMode === 'connect' && (pendingFrom ? 'Now click a second node to draw a line.' : 'Click a node to start a line.')}
            {subMode === 'delete' && 'Click any node or line to delete it.'}
          </p>

          <div style={{ height: 1, background: 'rgba(0,56,69,0.08)', margin: '4px 0 10px' }} />

          {/* Stats */}
          <p style={{ fontSize: 10, color: 'rgba(0,56,69,0.35)', marginBottom: 10 }}>
            {nodes.length} node{nodes.length !== 1 ? 's' : ''} · {edges.length} line{edges.length !== 1 ? 's' : ''}
          </p>

          {/* Clear all */}
          <button
            onClick={() => { saveGraph([], []); setPendingFrom(null) }}
            style={{ width: '100%', padding: '6px 0', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', cursor: 'pointer', fontSize: 11, fontWeight: 700, marginBottom: 6 }}
          >Clear all</button>

          {/* Reset to defaults */}
          <button
            onClick={() => { const d = defaultNodesEdges(); saveGraph(d.nodes, d.edges); setPendingFrom(null) }}
            style={{ width: '100%', padding: '6px 0', borderRadius: 8, border: '1px solid rgba(0,56,69,0.15)', background: 'rgba(0,56,69,0.04)', color: 'rgba(0,56,69,0.55)', cursor: 'pointer', fontSize: 11, fontWeight: 700, marginBottom: 6 }}
          >Reset to default</button>

          {/* Done */}
          <button
            onClick={() => { setConnectMode(false); setPendingFrom(null); setSubMode('place') }}
            style={{ width: '100%', padding: '6px 0', borderRadius: 8, border: 'none', background: '#0ea5e9', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
          >Done</button>
        </div>
      )}

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
          cursor: cursorStyle,
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

        {/* Save / shift toast */}
        {savedSlug && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="flex items-center gap-2 bg-green-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-xl">
              {savedSlug === '__shift__' ? '⏩ All posts shifted' : '✓ Saved'}
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


          {/* ── Videography strategy card — draggable ──────────────────────── */}
          <DraggableWorldCard key={`vid-strategy-${layoutVersion}`} initialX={VID_STRAT_X} initialY={VID_STRAT_Y} storageKey="vid-strategy" zoomRef={zoomRef} onSaved={scheduleSync}>
            <VideographyStrategyCard />
          </DraggableWorldCard>

          {/* ── LinkedIn strategy card — draggable ─────────────────────────── */}
          <DraggableWorldCard key={`li-strategy-${layoutVersion}`} initialX={LI_STRAT_X} initialY={LI_STRAT_Y} storageKey="li-strategy" zoomRef={zoomRef} onSaved={scheduleSync}>
            <LinkedInStrategyCard />
          </DraggableWorldCard>

          {/* ── Consultant interview cards — draggable ─────────────────────── */}
          {CONSULTANT_INTERVIEWS.map((interview, i) => (
            <DraggableWorldCard
              key={`${interview.id}-${layoutVersion}`}
              initialX={GAL_PAD + i * (VID_CARD_W + CONSULT_GAP)}
              initialY={CONSULT_Y}
              storageKey={`consultant-${interview.id}`}
              zoomRef={zoomRef}
              onSaved={scheduleSync}
            >
              <ConsultantInterviewCard interview={interview} index={i} />
            </DraggableWorldCard>
          ))}

          {/* ── Production asset cards — draggable ─────────────────────────── */}
          {([
            { Card: LeonnaProductionCard,       key: 'prod-leonna'   },
            { Card: PatientStoriesCard,         key: 'prod-patient'  },
            { Card: TeamPhotographyCard,        key: 'prod-team'     },
            { Card: ProductionScheduleCard,     key: 'prod-schedule' },
          ] as const).map(({ Card, key }, i) => (
            <DraggableWorldCard
              key={`${key}-${layoutVersion}`}
              initialX={GAL_PAD + i * (VID_CARD_W + CONSULT_GAP)}
              initialY={PROD_CARD_Y}
              storageKey={key}
              zoomRef={zoomRef}
              onSaved={scheduleSync}
            >
              <Card />
            </DraggableWorldCard>
          ))}

          {/* ── Edges (straight dotted lines) ──────────────────────────────── */}
          {edges.map(edge => {
            const fn = nodes.find(n => n.id === edge.from)
            const tn = nodes.find(n => n.id === edge.to)
            if (!fn || !tn) return null
            return <EdgeLine key={edge.id} fromNode={fn} toNode={tn} subMode={connectMode ? subMode : 'place'} onDelete={() => deleteEdge(edge.id)} />
          })}

          {/* ── Nodes (bullet points) ──────────────────────────────────────── */}
          {nodes.map(node => (
            <NodeDot
              key={node.id}
              node={node}
              zoomRef={zoomRef}
              subMode={connectMode ? subMode : 'place'}
              isPending={pendingFrom === node.id}
              onDragEnd={handleNodeDragEnd}
              onConnectClick={handleNodeConnectClick}
              onDelete={deleteNode}
            />
          ))}

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

      {/* ── Shift-all-posts modal ─────────────────────────────────── */}
      {showShift && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={() => !shifting && setShowShift(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl"
            style={{ width: 340, padding: '28px 28px 24px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#003845' }}>Shift all posts</h3>
              {!shifting && (
                <button onClick={() => setShowShift(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,56,69,0.4)', padding: 4 }}>
                  <X size={16} />
                </button>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'rgba(0,56,69,0.5)', lineHeight: 1.5, marginBottom: 24 }}>
              Move every post on this roadmap forward or backward by the same number of days.
            </p>

            {/* Quick presets */}
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,56,69,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Quick select</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {[1, 3, 7, 14, 30].map(n => (
                <button
                  key={n}
                  onClick={() => setShiftAmt(n)}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: shiftAmt === n ? '#003845' : 'rgba(0,56,69,0.06)',
                    color: shiftAmt === n ? '#fff' : '#003845',
                    border: shiftAmt === n ? '1.5px solid #003845' : '1.5px solid transparent',
                  }}
                >
                  {n}d
                </button>
              ))}
            </div>

            {/* Custom day picker */}
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,56,69,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Custom</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <button
                onClick={() => setShiftAmt(d => Math.max(1, d - 1))}
                disabled={shifting}
                style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid rgba(0,56,69,0.15)', background: 'rgba(0,56,69,0.04)', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#003845', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >−</button>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#003845' }}>{shiftAmt}</span>
                <span style={{ fontSize: 13, color: 'rgba(0,56,69,0.5)', marginLeft: 6 }}>days</span>
              </div>
              <button
                onClick={() => setShiftAmt(d => d + 1)}
                disabled={shifting}
                style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid rgba(0,56,69,0.15)', background: 'rgba(0,56,69,0.04)', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#003845', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >+</button>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => applyShift(-shiftAmt)}
                disabled={shifting}
                style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid rgba(0,56,69,0.2)', background: 'rgba(0,56,69,0.05)', cursor: shifting ? 'wait' : 'pointer', fontSize: 13, fontWeight: 700, color: '#003845', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {shifting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : '←'} Earlier
              </button>
              <button
                onClick={() => applyShift(shiftAmt)}
                disabled={shifting}
                style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: '#003845', cursor: shifting ? 'wait' : 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                Later {shifting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : '→'}
              </button>
            </div>

            <p style={{ fontSize: 11, color: 'rgba(0,56,69,0.35)', textAlign: 'center', marginTop: 14 }}>
              Affects all {posts.length} posts · cannot be undone
            </p>
          </div>
        </div>
      )}

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
