'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Post, Pillar, Platform, Format, PILLAR_LABELS, PLATFORM_LABELS } from '@/types/post'

const ALL_PILLARS: Pillar[] = ['educational', 'business', 'premises', 'employee', 'leadership', 'events', 'tech']
const ALL_PLATFORMS: Platform[] = ['instagram', 'facebook', 'linkedin', 'youtube', 'x']
const ALL_FORMATS: Format[] = ['single-image', 'carousel', 'reel', 'story', 'video', 'text']
const FORMAT_LABELS: Record<Format, string> = {
  'single-image': 'Single Image', carousel: 'Carousel', 'document-carousel': 'Document Carousel (PDF)', reel: 'Reel',
  story: 'Story', video: 'Video', text: 'Text',
}
const PILLAR_COLOR: Record<string, string> = {
  educational: '#008080', business: '#2563eb', premises: '#d97706',
  employee: '#16a34a', leadership: '#003845', events: '#7c3aed', tech: '#ea580c',
}

export function NewPostModal({ defaultDate, roadmapId, onClose, onCreate }: {
  defaultDate: string
  roadmapId?: string
  onClose: () => void
  onCreate: (post: Post) => void
}) {
  const [title, setTitle]         = useState('')
  const [pillar, setPillar]       = useState<Pillar>('educational')
  const [platforms, setPlatforms] = useState<Platform[]>(['instagram'])
  const [format, setFormat]       = useState<Format>('single-image')
  const [date, setDate]           = useState(defaultDate)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  function togglePlatform(p: Platform) {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    if (platforms.length === 0) { setError('Select at least one platform'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), pillar, platforms, format, scheduledDate: date, roadmapId }),
      })
      if (res.ok) { onCreate(await res.json()); onClose() }
      else { const d = await res.json(); setError(d.error ?? 'Failed to create') }
    } finally { setSaving(false) }
  }

  const pc = PILLAR_COLOR[pillar]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,56,69,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" style={{ borderTop: `4px solid ${pc}` }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-deep/10">
          <h2 className="font-display text-lg font-semibold text-brand-deep">New post</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-deep/40 hover:text-brand-deep hover:bg-brand-bg-soft transition-colors">
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="label-xs mb-2 block">Title</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Meet the team at Chatham"
              className="w-full rounded-xl border border-brand-deep/20 px-3.5 py-2.5 text-sm text-brand-deep font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal"
              autoFocus
            />
          </div>

          {/* Date */}
          <div>
            <label className="label-xs mb-2 block">Scheduled date</label>
            <input
              type="date" value={date} onChange={e => setDate(e.target.value)}
              min="2026-05-05" max="2026-11-05"
              className="w-full rounded-xl border border-brand-deep/20 px-3.5 py-2.5 text-sm text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>

          {/* Pillar */}
          <div>
            <label className="label-xs mb-2 block">Pillar</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_PILLARS.map(p => (
                <button key={p} type="button" onClick={() => setPillar(p)}
                  className="rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all"
                  style={pillar === p ? { background: PILLAR_COLOR[p], borderColor: PILLAR_COLOR[p], color: '#fff' } : { borderColor: 'rgba(0,56,69,0.2)', color: 'rgba(0,56,69,0.6)' }}>
                  {PILLAR_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="label-xs mb-2 block">Platforms</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_PLATFORMS.map(p => (
                <button key={p} type="button" onClick={() => togglePlatform(p)}
                  className="rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all"
                  style={platforms.includes(p) ? { background: '#003845', borderColor: '#003845', color: '#fff' } : { borderColor: 'rgba(0,56,69,0.2)', color: 'rgba(0,56,69,0.6)' }}>
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="label-xs mb-2 block">Format</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_FORMATS.map(f => (
                <button key={f} type="button" onClick={() => setFormat(f)}
                  className="rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all"
                  style={format === f ? { background: '#003845', borderColor: '#003845', color: '#fff' } : { borderColor: 'rgba(0,56,69,0.2)', color: 'rgba(0,56,69,0.6)' }}>
                  {FORMAT_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-brand-deep/20 py-2.5 text-sm font-semibold text-brand-deep/70 hover:bg-brand-bg-soft transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
              style={{ background: pc }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
