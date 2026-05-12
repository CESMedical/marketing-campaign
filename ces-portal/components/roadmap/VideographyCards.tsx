'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Video, X, ChevronDown, ChevronRight } from 'lucide-react'
import {
  VIDEOGRAPHY_STRATEGY, CONSULTANT_INTERVIEWS, DEFAULT_PRODUCTION_NOTES,
  LEONNA_VIDEOS, PATIENT_STORIES, PATIENT_STORY_FRAMEWORK, TEAM_ASSETS,
  FILMING_DAYS, ASSET_DELIVERY_CHECKLIST, SUBTITLE_NOTES, FILE_NAMING, SCHEDULE_ENTRIES,
  type ConsultantInterview, type InterviewQuestion, type ProductionNotes,
  type LeonnaVideo, type PatientStory, type TeamAsset,
} from '@/lib/videography-content'

const PILLAR_COLOR       = '#003845'
const CONSULTANT_COLORS  = ['#008080', '#008080', '#008080', '#008080']

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'rgba(0,56,69,0.4)',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block',
}
const fieldStyle: React.CSSProperties = {
  width: '100%', fontSize: 12, color: 'rgba(0,56,69,0.75)', lineHeight: 1.55,
  border: '1px solid rgba(0,56,69,0.15)', borderRadius: 8, padding: '6px 10px',
  resize: 'vertical', background: '#fafbfb', fontFamily: 'inherit',
  outline: 'none', marginBottom: 12, boxSizing: 'border-box',
}

// ─── Editable question row ────────────────────────────────────────────────────

function QuestionRow({
  q, accent, onUpdate,
}: {
  q: InterviewQuestion
  accent: string
  onUpdate: (patch: Partial<InterviewQuestion>) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderBottom: '1px solid rgba(0,56,69,0.08)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8 }}
      >
        <span style={{ color: accent, marginTop: 2, flexShrink: 0 }}>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#003845', lineHeight: 1.45 }}>{q.question}</span>
      </button>

      {open && (
        <div style={{ paddingLeft: 21, paddingBottom: 16 }}>

          <label style={labelStyle}>Question</label>
          <textarea
            value={q.question}
            rows={2}
            onChange={e => onUpdate({ question: e.target.value })}
            style={fieldStyle}
          />

          <label style={labelStyle}>What we need</label>
          <textarea
            value={q.whatWeNeed}
            rows={3}
            onChange={e => onUpdate({ whatWeNeed: e.target.value })}
            style={fieldStyle}
          />

          <label style={labelStyle}>Answer guidance</label>
          <textarea
            value={q.guidance}
            rows={5}
            onChange={e => onUpdate({ guidance: e.target.value })}
            style={fieldStyle}
          />

          <label style={labelStyle}>Target length</label>
          <input
            value={q.targetLength}
            onChange={e => onUpdate({ targetLength: e.target.value })}
            style={{ ...fieldStyle, resize: undefined, height: 34 }}
          />

          {q.feeds.length > 0 && (
            <>
              <label style={labelStyle}>Post feeds</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {q.feeds.map(f => (
                  <span key={f} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: accent + '18', color: accent }}>→ {f}</span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Production notes panel ───────────────────────────────────────────────────

function ProductionNotesPanel({ notes, accent, onChange }: {
  notes: ProductionNotes
  accent: string
  onChange: (patch: Partial<ProductionNotes>) => void
}) {
  const sectionLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 800, color: accent, textTransform: 'uppercase',
    letterSpacing: '0.1em', marginTop: 20, marginBottom: 12, display: 'block',
    borderBottom: `2px solid ${accent}`, paddingBottom: 6,
  }

  function Field({ label, field, rows }: { label: string; field: keyof ProductionNotes; rows?: number }) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>{label}</label>
        {rows ? (
          <textarea
            value={notes[field]}
            rows={rows}
            onChange={e => onChange({ [field]: e.target.value })}
            style={fieldStyle}
            placeholder={`Add ${label.toLowerCase()}…`}
          />
        ) : (
          <input
            value={notes[field]}
            onChange={e => onChange({ [field]: e.target.value })}
            style={{ ...fieldStyle, resize: undefined, height: 36 }}
            placeholder={`Add ${label.toLowerCase()}…`}
          />
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '4px 24px 24px' }}>
      <span style={sectionLabel}>Scheduling</span>
      <Field label="Filming location" field="location" />
      <Field label="Planned date" field="plannedDate" />
      <Field label="Travel & logistics" field="travelLogistics" rows={3} />

      <span style={sectionLabel}>On the Day</span>
      <Field label="Part 1 outfit (business attire)" field="part1Outfit" rows={2} />
      <Field label="Part 2 outfit (clinical attire)" field="part2Outfit" rows={2} />
      <Field label="Equipment & AV notes" field="equipmentNotes" rows={4} />
      <Field label="B-roll to capture" field="bRollNotes" rows={4} />

      <span style={sectionLabel}>Team Notes</span>
      <Field label="Additional comments for production team" field="teamNotes" rows={5} />
    </div>
  )
}

// ─── Script modal (portal — outside the transformed canvas) ───────────────────

function ScriptModal({
  interview: init, accent, onClose,
}: {
  interview: ConsultantInterview
  accent: string
  onClose: () => void
}) {
  const scriptKey = `ces-videography-interview-${init.id}`
  const prodKey   = `ces-videography-prodnotes-${init.id}`

  const [tab, setTab]   = useState<'script' | 'production'>('script')

  const [data, setData] = useState<ConsultantInterview>(() => {
    if (typeof window === 'undefined') return init
    try {
      const saved = localStorage.getItem(scriptKey)
      return saved ? (JSON.parse(saved) as ConsultantInterview) : init
    } catch { return init }
  })

  const [prodNotes, setProdNotes] = useState<ProductionNotes>(() => {
    if (typeof window === 'undefined') return DEFAULT_PRODUCTION_NOTES
    try {
      const saved = localStorage.getItem(prodKey)
      return saved ? (JSON.parse(saved) as ProductionNotes) : DEFAULT_PRODUCTION_NOTES
    } catch { return DEFAULT_PRODUCTION_NOTES }
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function patchQuestion(partKey: 'part1' | 'part2', qId: string, patch: Partial<InterviewQuestion>) {
    setData(prev => {
      const next = {
        ...prev,
        [partKey]: {
          ...prev[partKey],
          questions: prev[partKey].questions.map(q => q.id === qId ? { ...q, ...patch } : q),
        },
      }
      try { localStorage.setItem(scriptKey, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function patchProdNotes(patch: Partial<ProductionNotes>) {
    setProdNotes(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(prodKey, JSON.stringify(next)) } catch {}
      return next
    })
  }

  const tabBtn = (id: typeof tab, label: string): React.CSSProperties => ({
    flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
    borderBottom: `3px solid ${tab === id ? accent : 'transparent'}`,
    background: tab === id ? accent + '10' : 'transparent',
    color: tab === id ? accent : 'rgba(0,56,69,0.45)',
    transition: 'all 0.15s',
  })

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 20, width: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>

        {/* Header */}
        <div style={{ background: accent, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
              Interview {data.id}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{data.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{data.specialty}</div>
          </div>
          <button type="button" onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,56,69,0.1)', flexShrink: 0 }}>
          <button type="button" style={tabBtn('script', 'Script')} onClick={() => setTab('script')}>
            Script
          </button>
          <button type="button" style={tabBtn('production', 'Production Notes')} onClick={() => setTab('production')}>
            Production Notes
          </button>
        </div>

        {/* Posts fed — shown on both tabs */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(0,56,69,0.08)', background: '#f9fafb', flexShrink: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,56,69,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Posts this interview feeds</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {data.postsFed.map(p => (
              <span key={p} style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: accent + '18', color: accent }}>{p}</span>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'script' ? (
            <div style={{ padding: '0 24px 24px' }}>
              {(['part1', 'part2'] as const).map(partKey => {
                const part = data[partKey]
                return (
                  <div key={partKey}>
                    <div style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10, padding: '16px 0 8px', borderBottom: `2px solid ${accent}`, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Part {partKey === 'part1' ? '1' : '2'} — {part.attire} Attire
                      </span>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#003845', marginTop: 2 }}>{part.title}</p>
                    </div>
                    {part.questions.map(q => (
                      <QuestionRow key={q.id} q={q} accent={accent}
                        onUpdate={patch => patchQuestion(partKey, q.id, patch)} />
                    ))}
                  </div>
                )
              })}
            </div>
          ) : (
            <ProductionNotesPanel notes={prodNotes} accent={accent} onChange={patchProdNotes} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Consultant interview card ─────────────────────────────────────────────────

export function ConsultantInterviewCard({ interview, index }: { interview: ConsultantInterview; index: number }) {
  const [showModal, setShowModal] = useState(false)
  const accent = CONSULTANT_COLORS[index % CONSULTANT_COLORS.length]

  const allQ = interview.part1.questions.length + interview.part2.questions.length

  return (
    <>
      <div style={{ width: 300, background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,56,69,0.13)', border: '1.5px solid rgba(0,56,69,0.1)', borderLeft: `6px solid ${accent}`, overflow: 'hidden', userSelect: 'none' }}>
        <div style={{ background: accent, padding: '16px 18px', cursor: 'grab' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Interview {interview.id}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{interview.name}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontStyle: 'italic' }}>{interview.qualifications}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{interview.role}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{interview.locations}</div>
        </div>

        <div style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,56,69,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Posts this feeds</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
            {interview.postsFed.map(p => (
              <span key={p} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: accent + '18', color: accent }}>{p}</span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[
              { n: interview.part1.questions.length, label: 'Part 1 Qs', sub: 'Business' },
              { n: interview.part2.questions.length, label: 'Part 2 Qs', sub: 'Clinical' },
              { n: allQ, label: 'Total', sub: 'Questions' },
            ].map(({ n, label, sub }) => (
              <div key={label} style={{ flex: 1, background: 'rgba(0,56,69,0.04)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: accent }}>{n}</div>
                <div style={{ fontSize: 10, color: 'rgba(0,56,69,0.45)', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 9, color: 'rgba(0,56,69,0.35)' }}>{sub}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: 'rgba(0,56,69,0.45)', lineHeight: 1.5, marginBottom: 16 }}>
            15–20 min interview · Each answer 30–90 sec clip · {interview.postsFed.length} posts served
          </p>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{ width: '100%', padding: '10px 0', borderRadius: 12, background: accent, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            <Video size={13} /> View full script
          </button>
        </div>
      </div>

      {showModal && (
        <ScriptModal interview={interview} accent={accent} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

// ─── Videography strategy overview card ───────────────────────────────────────

export function VideographyStrategyCard() {
  const [expanded, setExpanded] = useState(false)

  const lines   = VIDEOGRAPHY_STRATEGY.description.split('\n\n')
  const preview = lines.slice(0, 2).join('\n\n')

  return (
    <div style={{ width: 300, background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,56,69,0.13)', border: '1.5px solid rgba(0,56,69,0.1)', borderLeft: `6px solid ${PILLAR_COLOR}`, overflow: 'hidden', userSelect: 'none' }}>
      <div style={{ background: PILLAR_COLOR, padding: '18px 20px', cursor: 'grab' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Production Asset</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>{VIDEOGRAPHY_STRATEGY.title}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}>{VIDEOGRAPHY_STRATEGY.status}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}>{VIDEOGRAPHY_STRATEGY.pillar}</span>
        </div>
      </div>

      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[{ n: 4, label: 'Interviews' }, { n: 48, label: 'Posts served' }, { n: 1, label: 'Day/consult' }].map(({ n, label }) => (
            <div key={label} style={{ flex: 1, background: 'rgba(0,56,69,0.04)', borderRadius: 10, padding: '8px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: PILLAR_COLOR }}>{n}</div>
              <div style={{ fontSize: 9, color: 'rgba(0,56,69,0.45)', fontWeight: 600, marginTop: 1 }}>{label}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: 'rgba(0,56,69,0.6)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 10 }}>
          {expanded ? VIDEOGRAPHY_STRATEGY.description : preview}
        </p>
        <button type="button" onClick={() => setExpanded(e => !e)}
          style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: '#008080', cursor: 'pointer', padding: 0 }}>
          {expanded ? '↑ Show less' : '↓ Read full strategy'}
        </button>

        <div style={{ marginTop: 16, borderTop: '1px solid rgba(0,56,69,0.08)', paddingTop: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,56,69,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Consultants</p>
          {CONSULTANT_INTERVIEWS.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: CONSULTANT_COLORS[i], flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#003845' }}>{c.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(0,56,69,0.45)' }}>{c.specialty}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Shared production asset modal shell ─────────────────────────────────────

function ProductionModal({
  title, subtitle, accent, tabs, activeTab, onTabChange, postsFed, onClose, onSave, children,
}: {
  title: string; subtitle: string; accent: string
  tabs: string[]; activeTab: string; onTabChange: (t: string) => void
  postsFed: string[]; onClose: () => void; onSave?: () => void; children: React.ReactNode
}) {
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const justSaved = savedAt !== null && Date.now() - savedAt < 3000

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSave() {
    onSave?.()
    setSavedAt(Date.now())
    setTimeout(() => setSavedAt(s => s), 3000)
  }

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 20, width: 720, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
        {/* Header */}
        <div style={{ background: accent, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>Production Asset</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{title}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{subtitle}</div>
          </div>
          <button type="button" onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,56,69,0.1)', flexShrink: 0 }}>
          {tabs.map(t => (
            <button key={t} type="button" onClick={() => onTabChange(t)} style={{
              flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              borderBottom: `3px solid ${activeTab === t ? accent : 'transparent'}`,
              background: activeTab === t ? accent + '10' : 'transparent',
              color: activeTab === t ? accent : 'rgba(0,56,69,0.45)', transition: 'all 0.15s',
            }}>{t}</button>
          ))}
        </div>

        {/* Posts fed */}
        {postsFed.length > 0 && (
          <div style={{ padding: '10px 24px', borderBottom: '1px solid rgba(0,56,69,0.08)', background: '#f9fafb', flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,56,69,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Posts fed</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {postsFed.map(p => <span key={p} style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: accent + '18', color: accent }}>{p}</span>)}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>

        {/* Sticky save footer */}
        <div style={{ borderTop: '1px solid rgba(0,56,69,0.1)', padding: '12px 24px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, color: '#fff', transition: 'background 0.2s',
              background: justSaved ? '#22c55e' : accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
          >
            {justSaved ? '✓ Saved' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function EditableNotes({ storageKey, accent }: { storageKey: string; accent: string }) {
  const [notes, setNotes] = useState(() => {
    if (typeof window === 'undefined') return ''
    try { return localStorage.getItem(storageKey) ?? '' } catch { return '' }
  })
  return (
    <div style={{ padding: '20px 24px' }}>
      <label style={labelStyle}>Production team notes</label>
      <textarea
        value={notes}
        rows={12}
        onChange={e => {
          setNotes(e.target.value)
          try { localStorage.setItem(storageKey, e.target.value) } catch {}
        }}
        placeholder="Add notes, reminders, logistics, status updates for the production team…"
        style={{ ...fieldStyle, resize: 'vertical' }}
      />
    </div>
  )
}

// ─── Leonna card ──────────────────────────────────────────────────────────────

function LeonnaVideoRow({ v, accent, onUpdate }: { v: LeonnaVideo; accent: string; onUpdate: (p: Partial<LeonnaVideo>) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(0,56,69,0.08)' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ color: accent, marginTop: 2, flexShrink: 0 }}>{open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: accent }}>{v.id}</span>
            <span style={{ fontSize: 10, color: 'rgba(0,56,69,0.4)' }}>→ {v.post} · {v.date}</span>
            {v.isCommercialPriority && <span style={{ fontSize: 9, fontWeight: 700, background: '#d97706', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>★ Priority</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#003845', lineHeight: 1.4, marginTop: 2 }}>{v.title}</div>
          <div style={{ fontSize: 11, color: 'rgba(0,56,69,0.4)', marginTop: 2 }}>{v.format} · {v.platforms} · {v.location}</div>
        </div>
      </button>
      {open && (
        <div style={{ paddingLeft: 21, paddingBottom: 16 }}>
          <label style={labelStyle}>Concept</label>
          <textarea value={v.concept} rows={3} style={fieldStyle} onChange={e => onUpdate({ concept: e.target.value })} />
          <label style={labelStyle}>Shot list (one per line)</label>
          <textarea value={v.shotList.join('\n')} rows={v.shotList.length + 1} style={fieldStyle}
            onChange={e => onUpdate({ shotList: e.target.value.split('\n') })} />
          <label style={labelStyle}>Script guidance — Leonna</label>
          <textarea value={v.scriptGuidanceLeonna} rows={5} style={fieldStyle}
            onChange={e => onUpdate({ scriptGuidanceLeonna: e.target.value })} />
          <label style={labelStyle}>Script guidance — Consultant</label>
          <textarea value={v.scriptGuidanceConsultant ?? ''} rows={3} style={fieldStyle}
            onChange={e => onUpdate({ scriptGuidanceConsultant: e.target.value })} />
          <label style={labelStyle}>Caption</label>
          <textarea value={v.caption} rows={3} style={fieldStyle} onChange={e => onUpdate({ caption: e.target.value })} />
          <label style={labelStyle}>CTA</label>
          <input value={v.cta} style={{ ...fieldStyle, resize: undefined, height: 36 }} onChange={e => onUpdate({ cta: e.target.value })} />
        </div>
      )}
    </div>
  )
}

export function LeonnaProductionCard() {
  const [show, setShow] = useState(false)
  const [tab, setTab]   = useState('Videos')
  const accent = '#d97706'
  const storageKey = 'ces-prod-leonna-videos'

  const [videos, setVideos] = useState<LeonnaVideo[]>(() => {
    if (typeof window === 'undefined') return LEONNA_VIDEOS
    try { const s = localStorage.getItem(storageKey); return s ? JSON.parse(s) : LEONNA_VIDEOS } catch { return LEONNA_VIDEOS }
  })

  function patchVideo(id: string, patch: Partial<LeonnaVideo>) {
    setVideos(prev => {
      const next = prev.map(v => v.id === id ? { ...v, ...patch } : v)
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return (
    <>
      <ProductionAssetCard
        title="Leonna: Premises & Behind the Scenes"
        type="Production Asset" pillar="Premises" status="Draft" accent={accent}
        postsFed={['P07','P12','P16','P21','P24','P40','P45','P47']}
        meta={['6 videos', 'Chatham (3d) · Headcorn (1d) · TW (2d)']}
        description="Six location-led videos produced by Leonna across the three primary filming locations. Theatre morning, sterilisation, Headcorn walk-through, Pantiles BTS, oculoplastic morning and campaign wrap."
        onOpen={() => setShow(true)}
      />
      {show && (
        <ProductionModal
          title="Leonna: Premises & Behind the Scenes" subtitle="6 videos · 8 posts · 3 locations"
          accent={accent} tabs={['Videos','Production Notes']} activeTab={tab} onTabChange={setTab}
          postsFed={['P07','P12','P16','P21','P24','P40','P45','P47']} onClose={() => setShow(false)}
        >
          {tab === 'Videos' ? (
            <div style={{ padding: '0 24px 24px' }}>
              {videos.map(v => <LeonnaVideoRow key={v.id} v={v} accent={accent} onUpdate={p => patchVideo(v.id, p)} />)}
            </div>
          ) : <EditableNotes storageKey="ces-prod-leonna-notes" accent={accent} />}
        </ProductionModal>
      )}
    </>
  )
}

// ─── Patient stories card ─────────────────────────────────────────────────────

function StoryRow({ s, accent, onUpdate }: { s: PatientStory; accent: string; onUpdate: (p: Partial<PatientStory>) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(0,56,69,0.08)' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ color: accent, marginTop: 2, flexShrink: 0 }}>{open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: accent }}>{s.id}</span>
            <span style={{ fontSize: 10, color: 'rgba(0,56,69,0.4)' }}>→ {s.post} · {s.date}</span>
            {s.isCommercialPriority && <span style={{ fontSize: 9, fontWeight: 700, background: '#d97706', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>★ Priority</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#003845', marginTop: 2 }}>{s.patient}</div>
          <div style={{ fontSize: 11, color: 'rgba(0,56,69,0.4)', marginTop: 1 }}>{s.condition} · {s.location}</div>
        </div>
      </button>
      {open && (
        <div style={{ paddingLeft: 21, paddingBottom: 16 }}>
          <label style={labelStyle}>Patient name / placeholder</label>
          <input value={s.patient} style={{ ...fieldStyle, resize: undefined, height: 36 }} onChange={e => onUpdate({ patient: e.target.value })} />
          <label style={labelStyle}>Condition</label>
          <input value={s.condition} style={{ ...fieldStyle, resize: undefined, height: 36 }} onChange={e => onUpdate({ condition: e.target.value })} />
          <label style={labelStyle}>Why this story matters</label>
          <textarea value={s.whyMatters} rows={4} style={fieldStyle} onChange={e => onUpdate({ whyMatters: e.target.value })} />
          <label style={labelStyle}>Prompt questions (one per line)</label>
          <textarea value={s.promptQuestions.join('\n')} rows={s.promptQuestions.length + 1} style={fieldStyle}
            onChange={e => onUpdate({ promptQuestions: e.target.value.split('\n') })} />
          <label style={labelStyle}>What we need</label>
          <textarea value={s.whatWeNeed} rows={4} style={fieldStyle} onChange={e => onUpdate({ whatWeNeed: e.target.value })} />
          <label style={labelStyle}>Caption</label>
          <textarea value={s.caption} rows={3} style={fieldStyle} onChange={e => onUpdate({ caption: e.target.value })} />
          <label style={labelStyle}>CTA</label>
          <input value={s.cta} style={{ ...fieldStyle, resize: undefined, height: 36 }} onChange={e => onUpdate({ cta: e.target.value })} />
        </div>
      )}
    </div>
  )
}

export function PatientStoriesCard() {
  const [show, setShow] = useState(false)
  const [tab, setTab]   = useState('Stories')
  const accent = '#16a34a'
  const storageKey = 'ces-prod-patient-stories'

  const [stories, setStories] = useState<PatientStory[]>(() => {
    if (typeof window === 'undefined') return PATIENT_STORIES
    try { const s = localStorage.getItem(storageKey); return s ? JSON.parse(s) : PATIENT_STORIES } catch { return PATIENT_STORIES }
  })

  function patchStory(id: string, patch: Partial<PatientStory>) {
    setStories(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...patch } : s)
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return (
    <>
      <ProductionAssetCard
        title="Patient Stories" type="Production Asset" pillar="Employee / Patient Story" status="Draft" accent={accent}
        postsFed={['P13','P27','P38','P46']}
        meta={['4 patient interviews', 'Chatham (2) · Tunbridge Wells (1) · Chatham (1)']}
        description="Four patient interview videos following the before/during/after framework. Susan (cataract), James (acute), Anna (eyelid, ★ priority) and an unnamed glaucoma patient."
        warning="Patient names are placeholders. Recruit and consent patients min. 4 weeks before filming. Susan deadline: 22 May — begin recruitment this week."
        onOpen={() => setShow(true)}
      />
      {show && (
        <ProductionModal
          title="Patient Stories" subtitle="4 interviews · 4 posts · before/during/after framework"
          accent={accent} tabs={['Stories','Framework','Production Notes']} activeTab={tab} onTabChange={setTab}
          postsFed={['P13','P27','P38','P46']} onClose={() => setShow(false)}
        >
          {tab === 'Stories' ? (
            <div style={{ padding: '0 24px 24px' }}>
              {stories.map(s => <StoryRow key={s.id} s={s} accent={accent} onUpdate={p => patchStory(s.id, p)} />)}
            </div>
          ) : tab === 'Framework' ? (
            <div style={{ padding: '20px 24px' }}>
              {[
                { label: 'Before', text: PATIENT_STORY_FRAMEWORK.before },
                { label: 'During', text: PATIENT_STORY_FRAMEWORK.during },
                { label: 'After',  text: PATIENT_STORY_FRAMEWORK.after },
              ].map(({ label, text }) => (
                <div key={label} style={{ marginBottom: 18 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: accent, display: 'block', marginBottom: 6 }}>{label}</span>
                  <p style={{ fontSize: 12, color: 'rgba(0,56,69,0.7)', lineHeight: 1.55 }}>{text}</p>
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgba(0,56,69,0.1)', paddingTop: 16, marginTop: 8 }}>
                <label style={labelStyle}>Filming guidance</label>
                <ul style={{ margin: '0 0 16px', paddingLeft: 16 }}>
                  {PATIENT_STORY_FRAMEWORK.filmingGuidance.map((g, i) => <li key={i} style={{ fontSize: 12, color: 'rgba(0,56,69,0.7)', lineHeight: 1.6, marginBottom: 4 }}>{g}</li>)}
                </ul>
                <div style={{ background: '#fef3c7', border: '1px solid #d97706', borderRadius: 10, padding: '12px 16px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#92400e', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{PATIENT_STORY_FRAMEWORK.recruitmentNote}</p>
                </div>
              </div>
            </div>
          ) : <EditableNotes storageKey="ces-prod-patient-notes" accent={accent} />}
        </ProductionModal>
      )}
    </>
  )
}

// ─── Team photography card ────────────────────────────────────────────────────

export function TeamPhotographyCard() {
  const [show, setShow] = useState(false)
  const [tab, setTab]   = useState('Assets')
  const accent = '#2563eb'
  const storageKey = 'ces-prod-team-assets'

  const [assets, setAssets] = useState<TeamAsset[]>(() => {
    if (typeof window === 'undefined') return TEAM_ASSETS
    try { const s = localStorage.getItem(storageKey); return s ? JSON.parse(s) : TEAM_ASSETS } catch { return TEAM_ASSETS }
  })

  function patchAsset(id: string, patch: Partial<TeamAsset>) {
    setAssets(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...patch } : a)
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return (
    <>
      <ProductionAssetCard
        title="Team Photography" type="Production Asset" pillar="Employee" status="Draft" accent={accent}
        postsFed={['P04','P35']}
        meta={['2 photography assets', 'Chatham']}
        description="Consultant headshot (P04) captured on the same day as the consultant interview to avoid an additional filming day. Patient coordinator photograph (P35) in natural working environment."
        onOpen={() => setShow(true)}
      />
      {show && (
        <ProductionModal
          title="Team Photography" subtitle="2 assets · same day as consultant interviews"
          accent={accent} tabs={['Assets','Production Notes']} activeTab={tab} onTabChange={setTab}
          postsFed={['P04','P35']} onClose={() => setShow(false)}
        >
          {tab === 'Assets' ? (
            <div style={{ padding: '20px 24px' }}>
              {assets.map((a: TeamAsset) => (
                <div key={a.id} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(0,56,69,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: accent }}>{a.id}</span>
                    <span style={{ fontSize: 11, color: 'rgba(0,56,69,0.45)' }}>→ {a.post} · {a.date} · {a.location}</span>
                  </div>
                  <label style={labelStyle}>Subject</label>
                  <input value={a.subject} style={{ ...fieldStyle, resize: undefined, height: 36 }} onChange={e => patchAsset(a.id, { subject: e.target.value })} />
                  <label style={labelStyle}>What to capture</label>
                  <textarea value={a.whatToCapture} rows={4} style={fieldStyle} onChange={e => patchAsset(a.id, { whatToCapture: e.target.value })} />
                  <label style={labelStyle}>Guidance</label>
                  <textarea value={a.guidance} rows={4} style={fieldStyle} onChange={e => patchAsset(a.id, { guidance: e.target.value })} />
                </div>
              ))}
            </div>
          ) : <EditableNotes storageKey="ces-prod-team-notes" accent={accent} />}
        </ProductionModal>
      )}
    </>
  )
}

// ─── Production schedule card ─────────────────────────────────────────────────

export function ProductionScheduleCard() {
  const [show, setShow] = useState(false)
  const [tab, setTab]   = useState('Schedule')
  const accent = '#003845'
  const entriesKey = 'ces-prod-schedule-entries'

  const [entries, setEntries] = useState(() => {
    if (typeof window === 'undefined') return SCHEDULE_ENTRIES
    try { const s = localStorage.getItem(entriesKey); return s ? JSON.parse(s) : SCHEDULE_ENTRIES } catch { return SCHEDULE_ENTRIES }
  })

  function patchEntry(idx: number, patch: Partial<typeof SCHEDULE_ENTRIES[0]>) {
    setEntries((prev: typeof SCHEDULE_ENTRIES) => {
      const next = prev.map((e, i) => i === idx ? { ...e, ...patch } : e)
      try { localStorage.setItem(entriesKey, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return (
    <>
      <ProductionAssetCard
        title="Production Schedule & Asset Delivery"
        type="Production Asset" pillar="Leadership" status="Draft" accent={accent}
        postsFed={[]}
        meta={['6 filming days', '16 posts · all deadlines mapped']}
        description="Full filming day schedule across 6 days, asset delivery checklist, file naming convention and post-to-asset deadline mapping for all Leonna-led and patient story posts."
        onOpen={() => setShow(true)}
      />
      {show && (
        <ProductionModal
          title="Production Schedule & Asset Delivery" subtitle="6 filming days · 3 locations · 16 posts"
          accent={accent} tabs={['Schedule','Asset Delivery','Post Mapping']} activeTab={tab} onTabChange={setTab}
          postsFed={[]} onClose={() => setShow(false)}
        >
          {tab === 'Schedule' ? (
            <div style={{ padding: '20px 24px' }}>
              {['Chatham','Headcorn','Tunbridge Wells'].map(loc => (
                <div key={loc} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: 6, marginBottom: 12 }}>{loc}</div>
                  {FILMING_DAYS.filter(d => d.location === loc).map(d => (
                    <div key={d.day} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,56,69,0.6)', marginBottom: 6 }}>Day {d.day} — {d.label}</div>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {d.items.map((item, i) => <li key={i} style={{ fontSize: 12, color: 'rgba(0,56,69,0.7)', lineHeight: 1.6, marginBottom: 3 }}>{item}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : tab === 'Asset Delivery' ? (
            <div style={{ padding: '20px 24px' }}>
              <label style={labelStyle}>Required versions per asset</label>
              <ul style={{ margin: '0 0 20px', paddingLeft: 16 }}>
                {ASSET_DELIVERY_CHECKLIST.map((item, i) => (
                  <li key={i} style={{ fontSize: 12, color: 'rgba(0,56,69,0.7)', lineHeight: 1.6, marginBottom: 6 }}>
                    <input type="checkbox" style={{ marginRight: 8 }} readOnly /> {item}
                  </li>
                ))}
              </ul>
              <label style={labelStyle}>Subtitle style</label>
              <p style={{ fontSize: 12, color: 'rgba(0,56,69,0.7)', lineHeight: 1.55, marginBottom: 16 }}>{SUBTITLE_NOTES}</p>
              <label style={labelStyle}>File naming convention</label>
              <pre style={{ fontSize: 11, background: 'rgba(0,56,69,0.04)', borderRadius: 8, padding: '10px 14px', color: '#003845', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{FILE_NAMING}</pre>
            </div>
          ) : (
            <div style={{ padding: '20px 24px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Post', 'Asset', 'Type', 'Location', 'Deadline'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', background: 'rgba(0,56,69,0.05)', color: 'rgba(0,56,69,0.5)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid rgba(0,56,69,0.1)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SCHEDULE_ENTRIES.map((e, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(0,56,69,0.06)' }}>
                      {(['post','asset','type','location','deadline'] as const).map(field => (
                        <td key={field} style={{ padding: '4px 6px' }}>
                          <input
                            value={e[field]}
                            onChange={ev => patchEntry(i, { [field]: ev.target.value })}
                            style={{ width: '100%', fontSize: 12, border: '1px solid transparent', borderRadius: 4, padding: '3px 6px', background: 'transparent', color: field === 'deadline' ? accent : field === 'post' ? '#003845' : 'rgba(0,56,69,0.65)', fontWeight: field === 'post' || field === 'deadline' ? 700 : 400, outline: 'none', fontFamily: 'inherit' }}
                            onFocus={e => (e.target.style.borderColor = accent)}
                            onBlur={e => (e.target.style.borderColor = 'transparent')}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ProductionModal>
      )}
    </>
  )
}

// ─── Generic production asset card shell ─────────────────────────────────────

function ProductionAssetCard({
  title, type, pillar, status, accent, postsFed, meta, description, warning, onOpen,
}: {
  title: string; type: string; pillar: string; status: string; accent: string
  postsFed: string[]; meta: string[]; description: string; warning?: string; onOpen: () => void
}) {
  return (
    <div style={{ width: 300, background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,56,69,0.13)', border: '1.5px solid rgba(0,56,69,0.1)', borderLeft: `6px solid ${accent}`, overflow: 'hidden', userSelect: 'none' }}>
      <div style={{ background: accent, padding: '14px 18px', cursor: 'grab' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>{type}</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 8 }}>{title}</div>
        <div style={{ display: 'flex', gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}>{status}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}>{pillar}</span>
        </div>
      </div>

      <div style={{ padding: '14px 18px' }}>
        {postsFed.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,56,69,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Posts fed</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
              {postsFed.map(p => <span key={p} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: accent + '18', color: accent }}>{p}</span>)}
            </div>
          </>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {meta.map(m => (
            <span key={m} style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 8, background: 'rgba(0,56,69,0.05)', color: 'rgba(0,56,69,0.55)' }}>{m}</span>
          ))}
        </div>

        <p style={{ fontSize: 12, color: 'rgba(0,56,69,0.55)', lineHeight: 1.55, marginBottom: warning ? 10 : 14 }}>{description}</p>

        {warning && (
          <div style={{ background: '#fef3c7', border: '1px solid #d97706', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: '#92400e', lineHeight: 1.5 }}>⚠️ {warning}</p>
          </div>
        )}

        <button type="button" onClick={onOpen}
          style={{ width: '100%', padding: '9px 0', borderRadius: 12, background: accent, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <Video size={13} /> View details
        </button>
      </div>
    </div>
  )
}
