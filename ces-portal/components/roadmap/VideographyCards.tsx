'use client'

import { useState } from 'react'
import { Video, X, ChevronDown, ChevronRight } from 'lucide-react'
import { VIDEOGRAPHY_STRATEGY, CONSULTANT_INTERVIEWS, type ConsultantInterview, type InterviewQuestion } from '@/lib/videography-content'

const PILLAR_COLOR = '#003845'

const CONSULTANT_COLORS = ['#7c3aed', '#2563eb', '#16a34a', '#008080']

// ─── Script modal ─────────────────────────────────────────────────────────────

function QuestionRow({ q, accent }: { q: InterviewQuestion; accent: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(0,56,69,0.08)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8 }}
      >
        <span style={{ color: accent, marginTop: 2, flexShrink: 0 }}>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#003845', lineHeight: 1.45 }}>{q.question}</span>
      </button>
      {open && (
        <div style={{ paddingLeft: 21, paddingBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,56,69,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>What we need</p>
          <p style={{ fontSize: 12, color: 'rgba(0,56,69,0.65)', lineHeight: 1.55, marginBottom: 10 }}>{q.whatWeNeed}</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,56,69,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Answer guidance</p>
          <p style={{ fontSize: 12, color: 'rgba(0,56,69,0.65)', lineHeight: 1.55, marginBottom: 10 }}>{q.guidance}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {q.feeds.map(f => (
              <span key={f} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: accent + '18', color: accent }}>→ {f}</span>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'rgba(0,56,69,0.4)', fontStyle: 'italic' }}>Target: {q.targetLength}</p>
        </div>
      )}
    </div>
  )
}

function ScriptModal({ interview, accent, onClose }: { interview: ConsultantInterview; accent: string; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 20, width: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ background: accent, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
              Interview {interview.id} · Script
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{interview.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{interview.specialty}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#fff' }}>
            <X size={16} />
          </button>
        </div>

        {/* Posts fed */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(0,56,69,0.1)', background: '#f9fafb', flexShrink: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,56,69,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Posts this interview feeds</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {interview.postsFed.map(p => (
              <span key={p} style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: accent + '18', color: accent }}>{p}</span>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
          {[interview.part1, interview.part2].map(part => (
            <div key={part.title}>
              <div style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10, padding: '16px 0 8px', borderBottom: `2px solid ${accent}`, marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Part {part.attire === 'Business' ? '1' : '2'} — {part.attire} Attire</span>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#003845', marginTop: 2 }}>{part.title}</p>
              </div>
              {part.questions.map(q => <QuestionRow key={q.id} q={q} accent={accent} />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Consultant interview card ─────────────────────────────────────────────────

export function ConsultantInterviewCard({ interview, index }: { interview: ConsultantInterview; index: number }) {
  const [showModal, setShowModal] = useState(false)
  const accent = CONSULTANT_COLORS[index % CONSULTANT_COLORS.length]

  function stopPan(e: React.PointerEvent) { e.stopPropagation() }

  const allQuestions = [...interview.part1.questions, ...interview.part2.questions]

  return (
    <>
      <div
        onPointerDown={stopPan}
        style={{ width: 300, background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,56,69,0.13)', border: '1.5px solid rgba(0,56,69,0.1)', borderLeft: `6px solid ${accent}`, overflow: 'hidden', userSelect: 'none' }}
      >
        {/* Header */}
        <div style={{ background: accent, padding: '16px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
            Interview {interview.id}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{interview.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{interview.specialty}</div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px' }}>
          {/* Posts fed */}
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,56,69,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Posts this feeds</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
            {interview.postsFed.map(p => (
              <span key={p} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: accent + '18', color: accent }}>{p}</span>
            ))}
          </div>

          {/* Question count */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, background: 'rgba(0,56,69,0.04)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: accent }}>{interview.part1.questions.length}</div>
              <div style={{ fontSize: 10, color: 'rgba(0,56,69,0.45)', fontWeight: 600 }}>Part 1 Qs</div>
              <div style={{ fontSize: 9, color: 'rgba(0,56,69,0.35)' }}>Business</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(0,56,69,0.04)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: accent }}>{interview.part2.questions.length}</div>
              <div style={{ fontSize: 10, color: 'rgba(0,56,69,0.45)', fontWeight: 600 }}>Part 2 Qs</div>
              <div style={{ fontSize: 9, color: 'rgba(0,56,69,0.35)' }}>Clinical</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(0,56,69,0.04)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: accent }}>{allQuestions.length}</div>
              <div style={{ fontSize: 10, color: 'rgba(0,56,69,0.45)', fontWeight: 600 }}>Total</div>
              <div style={{ fontSize: 9, color: 'rgba(0,56,69,0.35)' }}>Questions</div>
            </div>
          </div>

          {/* Target */}
          <p style={{ fontSize: 12, color: 'rgba(0,56,69,0.45)', lineHeight: 1.5, marginBottom: 16 }}>
            15–20 min interview · Each answer 30–90 sec clip · {interview.postsFed.length} posts served
          </p>

          {/* View button */}
          <button
            onClick={() => setShowModal(true)}
            style={{ width: '100%', padding: '10px 0', borderRadius: 12, background: accent, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            <Video size={13} /> View full script
          </button>
        </div>
      </div>

      {showModal && <ScriptModal interview={interview} accent={accent} onClose={() => setShowModal(false)} />}
    </>
  )
}

// ─── Videography strategy card ────────────────────────────────────────────────

export function VideographyStrategyCard() {
  const [expanded, setExpanded] = useState(false)

  const lines = VIDEOGRAPHY_STRATEGY.description.split('\n\n')
  const preview = lines.slice(0, 2).join('\n\n')

  function stopPan(e: React.PointerEvent) { e.stopPropagation() }

  return (
    <div
      onPointerDown={stopPan}
      style={{ width: 300, background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,56,69,0.13)', border: '1.5px solid rgba(0,56,69,0.1)', borderLeft: `6px solid ${PILLAR_COLOR}`, overflow: 'hidden', userSelect: 'none' }}
    >
      {/* Header */}
      <div style={{ background: PILLAR_COLOR, padding: '18px 20px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
          Production Asset
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>{VIDEOGRAPHY_STRATEGY.title}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}>
            {VIDEOGRAPHY_STRATEGY.status}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}>
            {VIDEOGRAPHY_STRATEGY.pillar}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px' }}>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { n: 4, label: 'Interviews' },
            { n: 48, label: 'Posts served' },
            { n: 1, label: 'Day per consult' },
          ].map(({ n, label }) => (
            <div key={label} style={{ flex: 1, background: 'rgba(0,56,69,0.04)', borderRadius: 10, padding: '8px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: PILLAR_COLOR }}>{n}</div>
              <div style={{ fontSize: 9, color: 'rgba(0,56,69,0.45)', fontWeight: 600, marginTop: 1 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <p style={{ fontSize: 12, color: 'rgba(0,56,69,0.6)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 10 }}>
          {expanded ? VIDEOGRAPHY_STRATEGY.description : preview}
        </p>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: '#008080', cursor: 'pointer', padding: 0 }}
        >
          {expanded ? '↑ Show less' : '↓ Read full strategy'}
        </button>

        {/* Consultants list */}
        <div style={{ marginTop: 16, borderTop: '1px solid rgba(0,56,69,0.08)', paddingTop: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,56,69,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Consultants
          </p>
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
