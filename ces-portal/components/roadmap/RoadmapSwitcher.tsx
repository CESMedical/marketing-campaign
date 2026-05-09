'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus, Trash2, Pencil, Check, X, AlertTriangle } from 'lucide-react'
import { RoadmapMeta } from '@/lib/roadmap-data'

export function RoadmapSwitcher({
  roadmaps: init,
  currentId,
  canEdit,
}: {
  roadmaps: RoadmapMeta[]
  currentId?: string
  canEdit: boolean
}) {
  const router = useRouter()
  const [roadmaps, setRoadmaps] = useState(init)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const current = roadmaps.find(r => r.id === currentId)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false); setCreating(false); setDeleteId(null); setEditingId(null)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function select(id: string) {
    router.push(`/roadmap/?r=${id}`)
    setOpen(false)
  }

  async function handleCreate() {
    if (!newTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/roadmaps', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      if (res.ok) {
        const r = await res.json()
        setRoadmaps(prev => [...prev, r])
        setNewTitle(''); setCreating(false)
        router.push(`/roadmap/?r=${r.id}`)
        setOpen(false)
      }
    } finally { setSaving(false) }
  }

  async function handleRename(id: string) {
    if (!editTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/roadmaps/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      })
      if (res.ok) {
        const updated = await res.json()
        setRoadmaps(prev => prev.map(r => r.id === id ? updated : r))
        setEditingId(null)
      }
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/roadmaps/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setRoadmaps(prev => prev.filter(r => r.id !== id))
        setDeleteId(null)
        if (currentId === id) router.push('/roadmap/')
      }
    } finally { setDeleting(false) }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl border border-brand-deep/15 bg-white px-3.5 py-2 text-sm font-semibold text-brand-deep hover:bg-brand-bg-soft transition-colors shadow-sm"
      >
        <span className="max-w-[180px] truncate">{current?.title ?? 'All posts'}</span>
        <ChevronDown size={14} className={`text-brand-deep/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-brand-deep/10 rounded-2xl shadow-xl w-72 overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40">Roadmaps</p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {roadmaps.map(r => (
              <div key={r.id}>
                {deleteId === r.id ? (
                  <div className="px-4 py-3 bg-red-50 border-t border-red-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle size={12} className="text-red-500 shrink-0" />
                      <p className="text-xs font-semibold text-red-700">Delete "{r.title}"?</p>
                    </div>
                    <p className="text-[11px] text-red-600 mb-2.5">Posts will be kept but unlinked from this roadmap.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteId(null)} className="flex-1 rounded-lg border border-red-200 py-1 text-xs font-medium text-red-600">Cancel</button>
                      <button onClick={() => handleDelete(r.id)} disabled={deleting} className="flex-1 rounded-lg bg-red-500 py-1 text-xs font-bold text-white disabled:opacity-50">
                        {deleting ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ) : editingId === r.id ? (
                  <div className="flex items-center gap-1.5 px-3 py-2 border-t border-brand-deep/6">
                    <input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(r.id); if (e.key === 'Escape') setEditingId(null) }}
                      className="flex-1 rounded-lg border border-brand-deep/20 px-2 py-1 text-xs text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-teal"
                      autoFocus
                    />
                    <button onClick={() => handleRename(r.id)} disabled={saving} className="rounded-lg bg-brand-teal p-1 text-white">
                      <Check size={12} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="rounded-lg border border-brand-deep/15 p-1 text-brand-deep/50">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`group flex items-center gap-2 px-4 py-2.5 cursor-pointer border-t border-brand-deep/6 hover:bg-brand-bg-soft transition-colors ${currentId === r.id ? 'bg-brand-bg-soft' : ''}`}
                    onClick={() => select(r.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brand-deep truncate">{r.title}</p>
                      <p className="text-[10px] text-brand-deep/40">{r.postCount} {r.postCount === 1 ? 'post' : 'posts'}</p>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => { e.stopPropagation(); setEditingId(r.id); setEditTitle(r.title) }}
                          className="p-1 rounded-md text-brand-deep/40 hover:text-brand-deep hover:bg-brand-deep/8"
                          title="Rename"
                        ><Pencil size={11} /></button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteId(r.id) }}
                          className="p-1 rounded-md text-brand-deep/40 hover:text-red-400"
                          title="Delete"
                        ><Trash2 size={11} /></button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {canEdit && (
            <div className="border-t border-brand-deep/8 p-3">
              {creating ? (
                <div className="flex gap-1.5">
                  <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
                    placeholder="Roadmap name…"
                    className="flex-1 rounded-xl border border-brand-deep/20 px-3 py-1.5 text-xs text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    autoFocus
                  />
                  <button onClick={handleCreate} disabled={saving || !newTitle.trim()}
                    className="rounded-xl bg-brand-teal px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">
                    {saving ? '…' : 'Create'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-2 rounded-xl border border-dashed border-brand-deep/20 px-3 py-2 text-xs font-semibold text-brand-deep/50 hover:text-brand-teal hover:border-brand-teal transition-colors"
                >
                  <Plus size={13} /> New roadmap
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
