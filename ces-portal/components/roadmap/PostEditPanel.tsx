'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Save, Send, ImagePlus, Loader2, Calendar, Layout, Trash2, AlertTriangle, ZoomIn, Plus } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Post, Status, Platform, Format, STATUS_LABELS, PLATFORM_LABELS, PILLAR_LABELS } from '@/types/post'
import { canEditPost, roleLabel } from '@/lib/permissions'
import { ImageLightbox } from '@/components/ui/ImageLightbox'

const ALL_FORMATS: Format[] = ['single-image', 'carousel', 'reel', 'story', 'video', 'text']
const FORMAT_LABELS: Record<Format, string> = {
  'single-image': 'Single Image', carousel: 'Carousel', 'document-carousel': 'Document Carousel (PDF)', reel: 'Reel',
  story: 'Story', video: 'Video', text: 'Text',
}

const ALL_STATUSES: Status[] = ['draft', 'clinical-review', 'brand-review', 'approved', 'scheduled', 'live']
const ALL_PLATFORMS: Platform[] = ['instagram', 'facebook', 'linkedin', 'youtube', 'x']

const STATUS_COLOR: Record<string, string> = {
  draft: '#9ca3af', 'clinical-review': '#f59e0b', 'brand-review': '#f97316',
  approved: '#22c55e', scheduled: '#3b82f6', live: '#008080',
}
const PILLAR_COLOR: Record<string, string> = {
  educational: '#008080', business: '#2563eb', premises: '#d97706',
  employee: '#16a34a', leadership: '#003845', events: '#7c3aed', tech: '#ea580c',
}

interface Comment { id: string; authorName: string; text: string; createdAt: string; canDelete: boolean }
interface PortalUser { id: string; firstName: string }

function avatarColor(name: string) {
  const colors = ['#008080','#2563eb','#7c3aed','#ea580c','#16a34a','#d97706','#003845','#ec4899']
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return colors[h % colors.length]
}

export function PostEditPanel({ post, onClose, onSave, onDelete }: {
  post: Post; onClose: () => void; onSave: (u: Post) => void; onDelete?: (slug: string) => void
}) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const canEdit = canEditPost(role)
  const reviewStatuses: Status[] =
    role === 'clinical_reviewer' && post.status === 'clinical-review'
      ? ['draft', 'brand-review']
      : role === 'brand_reviewer' && post.status === 'brand-review'
        ? ['clinical-review', 'approved']
        : []
  const canReview = reviewStatuses.length > 0
  const badge = roleLabel(role)
  const serverName = (session?.user?.name ?? session?.user?.email ?? '').split(/[\s@]/)[0]

  const [title, setTitle]         = useState(post.title)
  const [caption, setCaption]     = useState(post.caption)
  const [status, setStatus]       = useState<Status>(post.status)
  const [format, setFormat]       = useState<Format>(post.format)
  const [platforms, setPlatforms] = useState<Platform[]>(post.platforms)
  const [scheduledDate, setScheduledDate] = useState(post.scheduledDate.slice(0, 10))
  const [notes, setNotes]         = useState(post.notes ?? '')
  const [imageUrl, setImageUrl]   = useState(post.imageUrl ?? '')
  const [images, setImages]       = useState<string[]>(post.images ?? (post.imageUrl ? [post.imageUrl] : []))
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingSlide, setUploadingSlide] = useState(false)
  const [showOneDrive, setShowOneDrive] = useState(false)
  const [oneDriveInput, setOneDriveInput] = useState('')
  const [oneDriveError, setOneDriveError] = useState('')
  const [oneDriveLoading, setOneDriveLoading] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [savedAt, setSavedAt]       = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [comments, setComments]   = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([])
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionSel, setMentionSel]     = useState(0)
  const fileRef        = useRef<HTMLInputElement>(null)
  const slideRef       = useRef<HTMLInputElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTitle(post.title); setCaption(post.caption); setStatus(post.status)
    setFormat(post.format); setPlatforms(post.platforms)
    setScheduledDate(post.scheduledDate.slice(0, 10))
    setNotes(post.notes ?? ''); setImageUrl(post.imageUrl ?? '')
    setImages(post.images ?? (post.imageUrl ? [post.imageUrl] : []))
    fetch(`/api/posts/${post.slug}/comments`).then(r => r.json()).then(setComments).catch(() => {})
    fetch('/api/users').then(r => r.json()).then(setPortalUsers).catch(() => {})
  }, [post.slug]) // eslint-disable-line

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/posts/${post.slug}`, { method: 'DELETE' })
      if (res.ok) { onDelete?.(post.slug); onClose() }
    } finally { setDeleting(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = canEdit
        ? { title, caption, status, format, platforms, scheduledDate, notes, imageUrl, images }
        : { status }
      const res = await fetch(`/api/posts/${post.slug}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) { onSave(await res.json()); setSavedAt(Date.now()) }
    } finally { setSaving(false) }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const form = new FormData(); form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (res.ok) {
        const { url } = await res.json()
        setImageUrl(url)
        setImages([url])
      }
    } finally { setUploading(false); if (e.target) e.target.value = '' }
  }

  async function handleAddSlide(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingSlide(true)
    try {
      const form = new FormData(); form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (res.ok) {
        const { url } = await res.json()
        setImages(prev => {
          const next = [...prev, url]
          if (!imageUrl) setImageUrl(next[0])
          return next
        })
      }
    } finally { setUploadingSlide(false); if (e.target) e.target.value = '' }
  }

  function removeSlide(idx: number) {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== idx)
      setImageUrl(next[0] ?? '')
      return next
    })
  }

  async function handleOneDriveLink() {
    const raw = oneDriveInput.trim()
    if (!raw) return
    setOneDriveError(''); setOneDriveLoading(true)
    try {
      // Use our server proxy which handles auth via client credentials.
      const proxyUrl = `/api/onedrive-image?url=${encodeURIComponent(raw)}`
      // Quick HEAD-like check: try to load the image via a small fetch to see if the proxy works.
      const test = await fetch(proxyUrl, { method: 'HEAD' }).catch(() => null)
      if (test && test.ok) {
        setImageUrl(proxyUrl); setShowOneDrive(false); setOneDriveInput('')
      } else {
        // Proxy may need Files.Read.All permission — try storing the URL directly.
        // This works if the user is logged in to Microsoft 365 in the same browser session.
        setImageUrl(raw); setShowOneDrive(false); setOneDriveInput('')
      }
    } finally { setOneDriveLoading(false) }
  }

  async function handleDeleteComment(id: string) {
    const res = await fetch(`/api/posts/${post.slug}/comments`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setComments(prev => prev.filter(c => c.id !== id))
  }

  async function handleComment() {
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${post.slug}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText }),
      })
      if (res.ok) { const c = await res.json(); setComments(prev => [...prev, c]); setCommentText('') }
    } finally { setSubmitting(false) }
  }

  const filteredUsers = mentionQuery !== null
    ? portalUsers.filter(u => u.firstName.toLowerCase().startsWith(mentionQuery.toLowerCase()))
    : []

  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setCommentText(val)
    const cursor = e.target.selectionStart ?? val.length
    const before = val.slice(0, cursor)
    const m = before.match(/@(\w*)$/)
    if (m) { setMentionQuery(m[1]); setMentionSel(0) }
    else setMentionQuery(null)
  }, [session?.user?.email])

  function insertMention(firstName: string) {
    const el = textareaRef.current
    const cursor = el?.selectionStart ?? commentText.length
    const before = commentText.slice(0, cursor)
    const m = before.match(/@(\w*)$/)
    if (!m) return
    const start = cursor - m[0].length
    const newText = commentText.slice(0, start) + `@${firstName} ` + commentText.slice(cursor)
    setCommentText(newText)
    setMentionQuery(null)
    setTimeout(() => { el?.focus(); const pos = start + firstName.length + 2; el?.setSelectionRange(pos, pos) }, 0)
  }

  function renderCommentText(text: string) {
    return text.split(/(@\w+)/g).map((part, i) =>
      part.startsWith('@')
        ? <span key={i} style={{ color: '#008080', fontWeight: 700 }}>{part}</span>
        : <span key={i}>{part}</span>
    )
  }

  const pc = PILLAR_COLOR[post.pillar] ?? '#003845'
  const sc = STATUS_COLOR[status]
  const justSaved = savedAt !== null && Date.now() - savedAt < 3000

  return (
    <div
      className="fixed right-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl"
      style={{ top: 64, width: 420, borderLeft: `3px solid ${pc}` }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-brand-deep/10 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: pc + '18', color: pc }}>
              {post.id}
            </span>
            <span className="text-[10px] font-semibold text-brand-deep/40 uppercase tracking-wide">
              {PILLAR_LABELS[post.pillar]}
            </span>
            {badge && <span className="text-[10px] font-bold text-brand-teal uppercase tracking-wide">{badge}</span>}
          </div>
          {canEdit ? (
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-sm font-semibold text-brand-deep leading-snug bg-transparent border-0 border-b-2 border-transparent focus:border-brand-teal focus:outline-none transition-colors py-0.5"
              placeholder="Post title…"
            />
          ) : (
            <h2 className="text-sm font-semibold text-brand-deep leading-snug line-clamp-2">{post.title}</h2>
          )}
        </div>
        <button onClick={onClose} className="shrink-0 p-1.5 rounded-lg text-brand-deep/40 hover:text-brand-deep hover:bg-brand-bg-soft transition-colors">
          <X size={17} />
        </button>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Image zone */}
        <div className="relative border-b border-brand-deep/8">
          {format === 'carousel' ? (
            /* ── Carousel: multi-slide grid ─────────────────────────────── */
            <div className="p-3 space-y-2">
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {images.map((src, idx) => (
                    <div key={src + idx} className="relative group aspect-square rounded-lg overflow-hidden bg-brand-bg-soft border border-brand-deep/10">
                      <img
                        src={src} alt={`Slide ${idx + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setLightboxIndex(idx)}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 pointer-events-none group-hover:pointer-events-auto">
                        <button onClick={() => setLightboxIndex(idx)} className="p-1 rounded-full bg-white/80 text-brand-deep hover:bg-white">
                          <ZoomIn size={12} />
                        </button>
                        {canEdit && (
                          <button onClick={() => removeSlide(idx)} className="p-1 rounded-full bg-red-500/90 text-white hover:bg-red-500">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-black/50 px-1 rounded">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                  {canEdit && images.length < 10 && (
                    <button
                      onClick={() => slideRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-brand-deep/20 flex flex-col items-center justify-center gap-1 text-brand-deep/40 hover:text-brand-teal hover:border-brand-teal transition-colors"
                    >
                      {uploadingSlide ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      <span className="text-[9px] font-semibold">{uploadingSlide ? '…' : 'Add slide'}</span>
                    </button>
                  )}
                </div>
              )}
              {canEdit && images.length === 0 && (
                <button
                  onClick={() => slideRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 py-6 text-brand-deep/40 hover:text-brand-teal hover:bg-brand-bg-soft transition-colors rounded-lg border border-dashed border-brand-deep/15"
                >
                  {uploadingSlide ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                  <span className="text-xs font-medium">{uploadingSlide ? 'Uploading…' : 'Upload first slide'}</span>
                </button>
              )}
              {images.length > 0 && (
                <p className="text-[10px] text-brand-deep/40 text-center">{images.length} / 10 slides · click any to expand</p>
              )}
            </div>
          ) : (
            /* ── Single image / other formats ───────────────────────────── */
            <>
              {imageUrl ? (
                <div className="relative group">
                  <img
                    src={imageUrl} alt="Post image"
                    className="w-full object-cover cursor-pointer"
                    style={{ maxHeight: 200 }}
                    onClick={() => setLightboxIndex(0)}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                    <ZoomIn size={22} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                  {canEdit && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 bg-brand-deep/80 text-white text-[10px] font-semibold px-2 py-1 rounded-lg">
                        <ImagePlus size={11} /> Replace
                      </button>
                      <button onClick={() => setShowOneDrive(s => !s)} className="flex items-center gap-1 bg-brand-deep/80 text-white text-[10px] font-semibold px-2 py-1 rounded-lg">
                        OneDrive
                      </button>
                      <button onClick={() => { setImageUrl(''); setImages([]); setShowOneDrive(false) }} className="flex items-center gap-1 bg-red-500/80 text-white text-[10px] font-semibold px-2 py-1 rounded-lg">
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ) : canEdit ? (
                <div className="flex flex-col">
                  <div className="flex">
                    <button
                      onClick={() => { fileRef.current?.click(); setShowOneDrive(false) }}
                      className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-brand-deep/40 hover:text-brand-teal hover:bg-brand-bg-soft transition-colors border-r border-brand-deep/8"
                    >
                      {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                      <span className="text-xs font-medium">{uploading ? 'Uploading…' : 'Upload file'}</span>
                    </button>
                    <button
                      onClick={() => setShowOneDrive(s => !s)}
                      className={`flex flex-1 flex-col items-center justify-center gap-2 py-6 text-xs font-medium transition-colors ${showOneDrive ? 'text-brand-teal bg-brand-bg-soft' : 'text-brand-deep/40 hover:text-brand-teal hover:bg-brand-bg-soft'}`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 15a4 4 0 0 0 4 4h9a5 5 0 1 0-2-9.5A5.5 5.5 0 0 0 3 15Z"/>
                      </svg>
                      OneDrive link
                    </button>
                  </div>
                  {showOneDrive && (
                    <div className="px-4 pb-4 pt-2 border-t border-brand-deep/8 bg-brand-bg-soft">
                      <p className="text-[10px] text-brand-deep/50 mb-2 leading-relaxed">
                        Paste a OneDrive or SharePoint file URL. Right-click the file → Share → Copy link, or use the direct file URL from your browser.
                      </p>
                      <div className="flex gap-2">
                        <input
                          value={oneDriveInput}
                          onChange={e => setOneDriveInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleOneDriveLink()}
                          placeholder="https://alastralabs.sharepoint.com/..."
                          className="flex-1 text-xs border border-brand-deep/20 rounded-lg px-3 py-2 outline-none focus:border-brand-teal"
                        />
                        <button
                          onClick={handleOneDriveLink}
                          disabled={oneDriveLoading || !oneDriveInput.trim()}
                          className="text-xs font-semibold px-3 py-2 rounded-lg bg-brand-teal text-white disabled:opacity-50"
                        >
                          {oneDriveLoading ? '…' : 'Use'}
                        </button>
                      </div>
                      {oneDriveError && <p className="text-[10px] text-red-500 mt-1">{oneDriveError}</p>}
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <input ref={slideRef} type="file" accept="image/*" className="hidden" onChange={handleAddSlide} />
        </div>

        {/* Lightbox */}
        {lightboxIndex !== null && (
          <ImageLightbox
            images={format === 'carousel' ? images : (imageUrl ? [imageUrl] : [])}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}

        <div className="p-5 space-y-5">
          {/* Meta row */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-brand-deep/50">
              <Calendar size={13} />
              <span className="font-medium">
                {new Date(post.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-brand-deep/50">
              <Layout size={13} />
              <span className="font-medium capitalize">{post.format.replace('-', ' ')}</span>
            </div>
            <div className="ml-auto">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: sc }}>
                {STATUS_LABELS[status]}
              </span>
            </div>
          </div>

          {canEdit ? (
            <>
              {/* Date */}
              <div>
                <p className="label-xs mb-2">Scheduled date</p>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  min="2026-05-05"
                  max="2026-11-05"
                  className="w-full rounded-xl border border-brand-deep/20 px-3.5 py-2 text-sm text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              {/* Status */}
              <div>
                <p className="label-xs mb-2">Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_STATUSES.map(s => (
                    <button key={s} onClick={() => setStatus(s)}
                      className="rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all"
                      style={status === s ? { background: STATUS_COLOR[s], borderColor: STATUS_COLOR[s], color: '#fff' } : { borderColor: 'rgba(0,56,69,0.2)', color: 'rgba(0,56,69,0.6)' }}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <p className="label-xs mb-2">Platforms</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_PLATFORMS.map(p => (
                    <button key={p} onClick={() => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                      className="rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all"
                      style={platforms.includes(p) ? { background: '#003845', borderColor: '#003845', color: '#fff' } : { borderColor: 'rgba(0,56,69,0.2)', color: 'rgba(0,56,69,0.6)' }}>
                      {PLATFORM_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <p className="label-xs mb-2">Format</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_FORMATS.map(f => (
                    <button key={f} onClick={() => setFormat(f)}
                      className="rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all"
                      style={format === f ? { background: '#003845', borderColor: '#003845', color: '#fff' } : { borderColor: 'rgba(0,56,69,0.2)', color: 'rgba(0,56,69,0.6)' }}>
                      {FORMAT_LABELS[f]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <p className="label-xs">Caption</p>
                  <span className="text-[10px] text-brand-deep/30 tabular-nums">{caption.length} chars</span>
                </div>
                <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={7}
                  className="w-full rounded-xl border border-brand-deep/20 px-3.5 py-2.5 text-sm text-brand-deep leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none" />
              </div>

              {/* Video relationship */}
              {(post.videoRelationship || post.videoReference) && (
                <div className="rounded-xl border border-brand-deep/10 bg-brand-bg-soft px-3.5 py-3 space-y-1">
                  {post.videoRelationship && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-semibold text-brand-deep/40 uppercase tracking-wide w-28 shrink-0 pt-0.5">Video</span>
                      <span className="text-xs text-brand-deep font-medium">
                        {post.videoRelationship === 'informed-by-interview' && 'Informed by interview'}
                        {post.videoRelationship === 'direct-snippet' && 'Videography snippet (direct video use)'}
                        {post.videoRelationship === 'leonna-premises' && 'Leonna premises video'}
                        {post.videoRelationship === 'patient-story' && 'Patient story'}
                        {post.videoRelationship === 'no-video' && 'No video'}
                        {post.videoRelationship === 'motion-design' && 'Motion design'}
                        {post.videoRelationship === 'team-photography' && 'Team photography'}
                      </span>
                    </div>
                  )}
                  {post.videoReference && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-semibold text-brand-deep/40 uppercase tracking-wide w-28 shrink-0 pt-0.5">Reference</span>
                      <span className="text-xs text-brand-deep/70 font-mono">{post.videoReference}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="label-xs mb-2">Production notes</p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="Notes for the production team…"
                  className="w-full rounded-xl border border-brand-deep/20 px-3.5 py-2.5 text-sm text-brand-deep placeholder:text-brand-deep/30 focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none" />
              </div>
            </>
          ) : (
            <div>
              <p className="label-xs mb-2">Caption</p>
              <p className="text-sm text-brand-deep leading-relaxed whitespace-pre-wrap">{post.caption}</p>
              {canReview && (
                <div className="mt-5">
                  <p className="label-xs mb-2">Review status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {reviewStatuses.map(s => (
                      <button key={s} onClick={() => setStatus(s)}
                        className="rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all"
                        style={status === s ? { background: STATUS_COLOR[s], borderColor: STATUS_COLOR[s], color: '#fff' } : { borderColor: 'rgba(0,56,69,0.2)', color: 'rgba(0,56,69,0.6)' }}>
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Comments ───────────────────────────────────────────────────── */}
          <div className="border-t border-brand-deep/10 pt-5">
            <p className="label-xs mb-4">Comments · {comments.length}</p>

            <div className="space-y-4 mb-4">
              {comments.length === 0 && (
                <p className="text-xs text-brand-deep/35 italic">No comments yet — be the first.</p>
              )}
              {comments.map(c => {
                const initials = c.authorName[0]?.toUpperCase() ?? '?'
                const color = avatarColor(c.authorName)
                return (
                  <div key={c.id} className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: color }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-brand-deep">{c.authorName}</span>
                          <span className="text-[10px] text-brand-deep/35">
                            {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' })}
                            {' · '}
                            {new Date(c.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })}
                            {' BST'}
                          </span>
                        </div>
                        {c.canDelete && (
                          <button onClick={() => handleDeleteComment(c.id)} className="text-brand-deep/25 hover:text-red-400 transition-colors shrink-0" title="Delete comment">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-brand-deep/80 leading-relaxed">{renderCommentText(c.text)}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment input */}
            <div className="flex gap-2 items-end">
              {session?.user && (
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: avatarColor(session.user.displayName ?? session.user.name ?? 'U') }}>
                  {(serverName || (session.user.displayName ?? session.user.name ?? 'U').split(' ')[0])[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 flex gap-2 items-end relative">
                {/* @mention autocomplete dropdown */}
                {filteredUsers.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-1 z-50 bg-white border border-brand-deep/15 rounded-xl shadow-xl overflow-hidden min-w-[160px]">
                    {filteredUsers.map((u, i) => (
                      <button
                        key={u.id}
                        onMouseDown={e => { e.preventDefault(); insertMention(u.firstName) }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); insertMention(u.firstName) } }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-brand-bg-soft transition-colors"
                        style={{ background: i === mentionSel ? '#F4F7F8' : undefined }}
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: avatarColor(u.firstName) }}>
                          {u.firstName[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-brand-deep">{u.firstName}</span>
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={commentText}
                  onChange={handleCommentChange}
                  placeholder="Add a comment… type @ to mention someone"
                  rows={2}
                  onKeyDown={e => {
                    if (filteredUsers.length > 0) {
                      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionSel(s => Math.min(s + 1, filteredUsers.length - 1)) }
                      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionSel(s => Math.max(s - 1, 0)) }
                      if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); insertMention(filteredUsers[mentionSel].firstName); return }
                      if (e.key === 'Escape') { setMentionQuery(null) }
                    }
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleComment()
                  }}
                  className="flex-1 rounded-xl border border-brand-deep/20 px-3 py-2 text-xs text-brand-deep placeholder:text-brand-deep/30 focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none"
                />
                <button onClick={handleComment} disabled={submitting || !commentText.trim()}
                  className="rounded-xl bg-brand-deep px-3 py-2 text-white hover:bg-brand-teal transition-colors disabled:opacity-40"
                  aria-label="Send">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      {(canEdit || canReview) && (
        <div className="border-t border-brand-deep/10 px-5 py-4 shrink-0 space-y-2">
          {/* Delete confirmation */}
          {confirmDelete ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <div className="flex items-center gap-2 mb-2.5">
                <AlertTriangle size={14} className="text-red-500 shrink-0" />
                <p className="text-xs font-semibold text-red-700">Delete this post permanently?</p>
              </div>
              <p className="text-[11px] text-red-600 mb-3">This will remove the post and all its comments. This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-lg border border-red-200 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-50">
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {role === 'admin' && (
                <button onClick={() => setConfirmDelete(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-brand-deep/15 px-3 py-2.5 text-xs font-semibold text-brand-deep/50 hover:border-red-200 hover:text-red-400 transition-colors"
                  title="Delete post">
                  <Trash2 size={13} />
                </button>
              )}
              <button onClick={handleSave} disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
                style={{ background: justSaved ? '#22c55e' : '#008080' }}>
                <Save size={14} />
                {saving ? 'Saving…' : justSaved ? 'Saved ✓' : 'Save changes'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
