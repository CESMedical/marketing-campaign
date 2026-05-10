'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Video, X, ChevronDown, ChevronRight } from 'lucide-react'
import { VIDEOGRAPHY_STRATEGY, CONSULTANT_INTERVIEWS, DEFAULT_PRODUCTION_NOTES, type ConsultantInterview, type InterviewQuestion, type ProductionNotes } from '@/lib/videography-content'

const PILLAR_COLOR       = '#003845'
const CONSULTANT_COLORS  = ['#7c3aed', '#2563eb', '#16a34a', '#008080']

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
      <div
        onPointerDown={e => e.stopPropagation()}
        style={{ width: 300, background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,56,69,0.13)', border: '1.5px solid rgba(0,56,69,0.1)', borderLeft: `6px solid ${accent}`, overflow: 'hidden', userSelect: 'none' }}
      >
        <div style={{ background: accent, padding: '16px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Interview {interview.id}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{interview.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{interview.specialty}</div>
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
    <div
      onPointerDown={e => e.stopPropagation()}
      style={{ width: 300, background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,56,69,0.13)', border: '1.5px solid rgba(0,56,69,0.1)', borderLeft: `6px solid ${PILLAR_COLOR}`, overflow: 'hidden', userSelect: 'none' }}
    >
      <div style={{ background: PILLAR_COLOR, padding: '18px 20px' }}>
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
