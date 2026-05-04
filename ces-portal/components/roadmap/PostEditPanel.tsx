'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Save, MessageCircle, Send, ImagePlus, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import {
  Post,
  Status,
  Platform,
  STATUS_LABELS,
  PLATFORM_LABELS,
  PILLAR_LABELS,
} from '@/types/post'

const ALL_STATUSES: Status[] = [
  'draft',
  'clinical-review',
  'brand-review',
  'approved',
  'scheduled',
  'live',
]
const ALL_PLATFORMS: Platform[] = ['instagram', 'facebook', 'linkedin', 'youtube', 'x']

interface Comment {
  id: string
  authorName: string
  text: string
  createdAt: string
}

export function PostEditPanel({
  post,
  onClose,
  onSave,
}: {
  post: Post
  onClose: () => void
  onSave: (updated: Post) => void
}) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'

  const [caption, setCaption] = useState(post.caption)
  const [status, setStatus] = useState<Status>(post.status)
  const [platforms, setPlatforms] = useState<Platform[]>(post.platforms)
  const [notes, setNotes] = useState(post.notes ?? '')
  const [imageUrl, setImageUrl] = useState(post.imageUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/posts/${post.slug}/comments`)
      .then(r => r.json())
      .then(setComments)
      .catch(() => {})
  }, [post.slug])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/posts/${post.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, status, platforms, notes, imageUrl }),
      })
      if (res.ok) {
        onSave(await res.json())
        setSavedAt(Date.now())
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleComment() {
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${post.slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText }),
      })
      if (res.ok) {
        const newComment = await res.json()
        setComments(prev => [...prev, newComment])
        setCommentText('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (res.ok) {
        const { url } = await res.json()
        setImageUrl(url)
      }
    } finally {
      setUploading(false)
    }
  }

  function togglePlatform(p: Platform) {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const justSaved = savedAt !== null && Date.now() - savedAt < 3000

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col bg-white border-l border-brand-deep/10 shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-brand-deep/10 p-5">
        <div className="min-w-0">
          <p className="label-xs">
            {post.id} · {PILLAR_LABELS[post.pillar]}
            {isAdmin && <span className="ml-2 text-brand-teal">· Admin</span>}
          </p>
          <h2 className="mt-1 text-sm font-semibold leading-snug text-brand-deep">{post.title}</h2>
        </div>
        <button onClick={onClose} className="shrink-0 rounded p-1 text-brand-deep/40 hover:text-brand-deep transition-colors" aria-label="Close panel">
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="label-xs">Date</p>
            <p className="mt-1 text-brand-deep">
              {new Date(post.scheduledDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div>
            <p className="label-xs">Format</p>
            <p className="mt-1 text-brand-deep capitalize">{post.format}</p>
          </div>
        </div>

        {isAdmin ? (
          <>
            <div>
              <p className="label-xs mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${status === s ? 'border-brand-teal bg-brand-teal text-white' : 'border-brand-deep/20 text-brand-deep/60 hover:border-brand-teal'}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label-xs mb-2">Platforms</p>
              <div className="flex flex-wrap gap-2">
                {ALL_PLATFORMS.map(p => (
                  <button key={p} onClick={() => togglePlatform(p)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${platforms.includes(p) ? 'border-brand-deep bg-brand-deep text-white' : 'border-brand-deep/20 text-brand-deep/60 hover:border-brand-deep'}`}>
                    {PLATFORM_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-2">
                <p className="label-xs">Caption</p>
                <span className="text-[10px] text-brand-deep/30">{caption.length} chars</span>
              </div>
              <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={8}
                className="w-full rounded-lg border border-brand-deep/20 px-3 py-2 text-sm text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none" />
            </div>

            <div>
              <p className="label-xs mb-2">Production notes</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Add notes for the production team…"
                className="w-full rounded-lg border border-brand-deep/20 px-3 py-2 text-sm text-brand-deep placeholder:text-brand-deep/30 focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none" />
            </div>

            <div>
              <p className="label-xs mb-2">Image</p>
              {imageUrl && (
                <img src={imageUrl} alt="Post image" className="w-full rounded-lg mb-2 object-cover" style={{ maxHeight: 160 }} />
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 rounded-lg border border-dashed border-brand-deep/30 px-3 py-2 text-xs text-brand-deep/60 hover:border-brand-teal hover:text-brand-teal transition-colors w-full justify-center"
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                {uploading ? 'Uploading…' : imageUrl ? 'Replace image' : 'Upload image'}
              </button>
            </div>
          </>
        ) : (
          <div>
            <p className="label-xs mb-2">Caption</p>
            <p className="text-sm text-brand-deep leading-relaxed whitespace-pre-wrap">{post.caption}</p>
          </div>
        )}

        {/* Comments — everyone */}
        <div className="border-t border-brand-deep/10 pt-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={13} className="text-brand-deep/40" />
            <p className="label-xs">Comments ({comments.length})</p>
          </div>

          <div className="space-y-3 mb-4">
            {comments.length === 0 && (
              <p className="text-xs text-brand-deep/40 italic">No comments yet.</p>
            )}
            {comments.map(c => (
              <div key={c.id} className="rounded-lg bg-brand-bg-soft p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-brand-deep">{c.authorName}</span>
                  <span className="text-[10px] text-brand-deep/40">
                    {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {' '}
                    {new Date(c.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-brand-deep/80 leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment…" rows={2}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleComment() }}
              className="flex-1 rounded-lg border border-brand-deep/20 px-3 py-2 text-xs text-brand-deep placeholder:text-brand-deep/30 focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none" />
            <button onClick={handleComment} disabled={submitting || !commentText.trim()}
              className="self-end rounded-lg bg-brand-deep p-2 text-white hover:bg-brand-teal transition-colors disabled:opacity-40"
              aria-label="Submit comment">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="border-t border-brand-deep/10 p-5">
          <button onClick={handleSave} disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-50">
            <Save size={14} />
            {saving ? 'Saving…' : justSaved ? 'Saved ✓' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  )
}
