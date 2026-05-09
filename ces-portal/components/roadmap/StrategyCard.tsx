'use client'

import { useState, useEffect } from 'react'
import { FileText, Upload, Download, Eye, Pencil, Check, X, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { canEditPost } from '@/lib/permissions'

interface StrategyDoc {
  title: string
  fileUrl: string | null
  fileName: string | null
  uploadedAt: string | null
  uploadedBy: string | null
}

const CARD_W = 300

function viewerUrl(fileUrl: string, fileName: string | null): string {
  const ext = fileName?.split('.').pop()?.toLowerCase() ?? ''
  const officeExts = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
  if (officeExts.includes(ext)) {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`
  }
  return fileUrl
}

function downloadUrl(fileUrl: string): string {
  if (fileUrl.includes('res.cloudinary.com')) {
    return fileUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/')
  }
  return fileUrl
}

export function StrategyCard({ roadmapId }: { roadmapId?: string }) {
  const { data: session } = useSession()
  const canEdit = canEditPost(session?.user?.role)

  const [doc, setDoc]             = useState<StrategyDoc | null>(null)
  const [loading, setLoading]     = useState(true)
  const [editTitle, setEditTitle] = useState(false)
  const [title, setTitle]         = useState('Strategy Document')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    if (!roadmapId) { setLoading(false); return }
    fetch(`/api/roadmaps/${roadmapId}/strategy`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setDoc(d); if (d?.title) setTitle(d.title) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [roadmapId])

  async function saveStrategy(patch: Partial<{ strategyTitle: string; strategyFileUrl: string; strategyFileName: string }>) {
    if (!roadmapId) return
    const res = await fetch(`/api/roadmaps/${roadmapId}/strategy`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) setDoc(await res.json())
  }

  async function handleTitleSave() {
    setSaving(true)
    await saveStrategy({ strategyTitle: title }).catch(() => {})
    setSaving(false); setEditTitle(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const form = new FormData(); form.append('file', file)
      const uploadRes = await fetch('/api/upload/document', { method: 'POST', body: form })
      if (!uploadRes.ok) return
      const { url, fileName } = await uploadRes.json()
      await saveStrategy({ strategyFileUrl: url, strategyFileName: fileName, strategyTitle: title })
    } finally { setUploading(false); e.target.value = '' }
  }

  const ext = doc?.fileName?.split('.').pop()?.toUpperCase() ?? ''
  const extColor: Record<string, string> = { PDF: '#e34234', DOCX: '#2b579a', DOC: '#2b579a', XLSX: '#217346', XLS: '#217346', PPTX: '#d24726', PPT: '#d24726' }
  const badgeColor = extColor[ext] ?? '#003845'

  // Stop canvas pan from intercepting clicks on this card
  function stopPan(e: React.PointerEvent) { e.stopPropagation() }

  return (
    <div
      onPointerDown={stopPan}
      style={{ width: CARD_W, background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,56,69,0.13)', border: '1.5px solid rgba(0,56,69,0.1)', borderLeft: '6px solid #003845', overflow: 'hidden', userSelect: 'none' }}
    >
      {/* Header */}
      <div style={{ background: '#003845', padding: '18px 20px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
          Strategy
        </div>
        {editTitle ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setEditTitle(false) }}
              style={{ flex: 1, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '5px 10px', color: '#fff', fontSize: 15, fontWeight: 700, outline: 'none' }}
              autoFocus
            />
            <button onClick={handleTitleSave} disabled={saving} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', padding: 4 }}>
              {saving ? <Loader2 size={14} /> : <Check size={14} />}
            </button>
            <button onClick={() => setEditTitle(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', flex: 1, lineHeight: 1.3 }}>{doc?.title ?? title}</span>
            {canEdit && (
              <button onClick={() => { setTitle(doc?.title ?? title); setEditTitle(true) }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 4 }}>
                <Pencil size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '28px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, minHeight: 240 }}>
        {!roadmapId ? (
          <>
            <div style={{ width: 72, height: 80, borderRadius: 12, background: '#f4f7f8', border: '1.5px dashed rgba(0,56,69,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={36} color="rgba(0,56,69,0.18)" />
            </div>
            <p style={{ fontSize: 13, color: 'rgba(0,56,69,0.4)', textAlign: 'center', lineHeight: 1.6, maxWidth: 220 }}>
              Select a roadmap from the dropdown to attach a strategy document
            </p>
          </>
        ) : loading ? (
          <Loader2 size={28} style={{ color: 'rgba(0,56,69,0.2)', marginTop: 40 }} />
        ) : doc?.fileUrl ? (
          <>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 72, height: 80, borderRadius: 12, background: '#f4f7f8', border: '1.5px solid rgba(0,56,69,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={36} color="#003845" />
              </div>
              {ext && (
                <div style={{ position: 'absolute', bottom: -8, right: -8, background: badgeColor, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 6, letterSpacing: '0.05em' }}>
                  {ext}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#003845', marginBottom: 4, wordBreak: 'break-word', maxWidth: 240 }}>{doc.fileName}</p>
              {doc.uploadedAt && (
                <p style={{ fontSize: 11, color: 'rgba(0,56,69,0.4)' }}>
                  Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <a href={viewerUrl(doc.fileUrl, doc.fileName)} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#003845', color: '#fff', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                <Eye size={14} /> View
              </a>
              <a href={downloadUrl(doc.fileUrl)} download={doc.fileName ?? 'strategy'} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(0,56,69,0.08)', border: '1.5px solid rgba(0,56,69,0.15)', color: '#003845', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                <Download size={14} /> Download
              </a>
            </div>

            {canEdit && (
              <label style={{ fontSize: 12, color: 'rgba(0,56,69,0.4)', cursor: 'pointer', textDecoration: 'underline' }}>
                {uploading ? 'Uploading…' : 'Replace document'}
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
              </label>
            )}
          </>
        ) : canEdit ? (
          <>
            <div style={{ width: 72, height: 80, borderRadius: 12, background: '#f4f7f8', border: '1.5px dashed rgba(0,56,69,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={36} color="rgba(0,56,69,0.2)" />
            </div>
            <p style={{ fontSize: 13, color: 'rgba(0,56,69,0.45)', textAlign: 'center', lineHeight: 1.5, maxWidth: 220 }}>
              Upload your strategy document to reference it alongside the roadmap
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,56,69,0.05)', border: '1.5px dashed rgba(0,56,69,0.2)', borderRadius: 12, padding: '11px 20px', fontSize: 13, fontWeight: 700, color: '#003845', cursor: uploading ? 'wait' : 'pointer' }}>
              {uploading ? <><Loader2 size={14} /> Uploading…</> : <><Upload size={14} /> Upload document</>}
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
            </label>
            <p style={{ fontSize: 11, color: 'rgba(0,56,69,0.3)', textAlign: 'center' }}>PDF, Word, Excel, PowerPoint · max 50 MB</p>
          </>
        ) : (
          <>
            <div style={{ width: 72, height: 80, borderRadius: 12, background: '#f4f7f8', border: '1.5px solid rgba(0,56,69,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={36} color="rgba(0,56,69,0.2)" />
            </div>
            <p style={{ fontSize: 13, color: 'rgba(0,56,69,0.4)', textAlign: 'center' }}>No strategy document uploaded yet</p>
          </>
        )}
      </div>
    </div>
  )
}
