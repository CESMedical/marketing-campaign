'use client'

import { useState } from 'react'
import { Linkedin } from 'lucide-react'

const LI_BLUE   = '#0A66C2'
const LI_LIGHT  = '#EBF3FB'

const rule = (text: string) => (
  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
    <span style={{ color: '#22c55e', flexShrink: 0, fontSize: 12, marginTop: 1 }}>✓</span>
    <span style={{ fontSize: 11, color: 'rgba(0,56,69,0.7)', lineHeight: 1.5 }}>{text}</span>
  </div>
)

const flag = (text: string) => (
  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
    <span style={{ color: '#f59e0b', flexShrink: 0, fontSize: 11, marginTop: 1 }}>⚑</span>
    <span style={{ fontSize: 11, color: 'rgba(0,56,69,0.7)', lineHeight: 1.5 }}>{text}</span>
  </div>
)

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderTop: '1px solid rgba(0,56,69,0.08)', marginTop: 12, paddingTop: 12 }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, width: '100%', textAlign: 'left', marginBottom: open ? 10 : 0 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(0,56,69,0.38)', textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1 }}>{title}</span>
        <span style={{ fontSize: 10, color: 'rgba(0,56,69,0.3)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && children}
    </div>
  )
}

export function LinkedInStrategyCard() {
  return (
    <div style={{ width: 300, background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,56,69,0.13)', border: '1.5px solid rgba(0,56,69,0.1)', borderLeft: `6px solid ${LI_BLUE}`, overflow: 'hidden', userSelect: 'none' }}>

      {/* Header */}
      <div style={{ background: LI_BLUE, padding: '18px 20px', cursor: 'grab' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Linkedin size={14} color="rgba(255,255,255,0.7)" />
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Platform Strategy</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.35, marginBottom: 10 }}>
          LinkedIn Algorithm Strategy and Content Framework
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Active', 'May–Aug 2026', '3 Streams'].map(b => (
            <span key={b} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}>{b}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
          {[
            { n: 52,  label: 'LI posts' },
            { n: 26,  label: 'Brand' },
            { n: 18,  label: 'Elion' },
            { n: 8,   label: 'Consultants' },
            { n: 10,  label: 'Slides/post' },
            { n: '60', label: 'Min response' },
          ].map(({ n, label }) => (
            <div key={label} style={{ background: LI_LIGHT, borderRadius: 8, padding: '7px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: LI_BLUE }}>{n}</div>
              <div style={{ fontSize: 9, color: 'rgba(0,56,69,0.45)', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Algorithm stages */}
        <Section title="Algorithm: 3 distribution stages" defaultOpen>
          <div style={{ fontSize: 11, color: 'rgba(0,56,69,0.65)', lineHeight: 1.55 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: LI_BLUE }}>Stage 1 — Golden Hour:</span> Shown to 2–5% of network. If 5–10% engage in first 60–90 minutes, post advances. Most posts die here.
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: LI_BLUE }}>Stage 2 — Engagement scoring:</span> 10–20% of network. Comments count 2× over likes. Substantive professional comments carry most weight.
            </div>
            <div>
              <span style={{ fontWeight: 700, color: LI_BLUE }}>Stage 3 — Extended reach:</span> &lt;1% of posts. Content distributed beyond network by topic interest. Reach scales significantly.
            </div>
          </div>
        </Section>

        {/* Format benchmarks */}
        <Section title="Format performance (2026)">
          {[
            { fmt: 'Document carousel (PDF)', rate: '6.60%', use: 'Brand account', highlight: true },
            { fmt: 'Text only', rate: '2.00%', use: 'Personal accounts', highlight: false },
            { fmt: 'Native video', rate: '2× growth', use: 'Interview snippets', highlight: false },
            { fmt: 'Single image', rate: '0.93%', use: 'Not used', highlight: false },
          ].map(row => (
            <div key={row.fmt} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: row.highlight ? 700 : 500, color: row.highlight ? LI_BLUE : 'rgba(0,56,69,0.7)' }}>{row.fmt}</div>
                <div style={{ fontSize: 9, color: 'rgba(0,56,69,0.4)' }}>{row.use}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: row.highlight ? LI_BLUE : 'rgba(0,56,69,0.5)', background: row.highlight ? LI_LIGHT : 'transparent', padding: row.highlight ? '2px 7px' : '0', borderRadius: 6 }}>{row.rate}</span>
            </div>
          ))}
        </Section>

        {/* Content rules */}
        <Section title="Content rules (all posts)">
          {rule('No external URL in post body — 60% reach penalty')}
          {rule('First line ≤200 chars — must earn the read')}
          {rule('End every post with a genuine professional question')}
          {rule('No engagement bait ("comment YES if you agree")')}
          {rule('British English, no em dashes, no Oxford comma')}
          {rule('Stay in the niche — ophthalmology only')}
          {rule('Golden hour: respond to comments within 60 minutes')}
          <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(10,102,194,0.06)', borderRadius: 8, fontSize: 11, color: 'rgba(0,56,69,0.6)' }}>
            <span style={{ fontWeight: 700 }}>Posting times: </span>Brand Mon/Thu 8am. Personal Tue/Wed 7:30am.
          </div>
        </Section>

        {/* Flags */}
        <Section title="Active flags" defaultOpen>
          {flag('LI-B06 (2RT AMD): Do not schedule until Mr Qureshi confirms he is comfortable with brand account publication')}
          {flag('All Elion posts (LI-E01 to LI-E18): placeholder drafts only — Elion must rewrite each in his own voice before publishing')}
          {flag('All consultant posts (LI-C01 to LI-C08): must be reviewed and approved by the named consultant before publishing')}
          {flag('LI-E06 (Southborough): time to coincide with actual clinic launch date — confirm with team')}
        </Section>

        {/* Streams */}
        <Section title="Post streams">
          {[
            { id: 'Brand', count: 26, fmt: 'Document carousel', audience: 'GPs, referrers, insurers, patients 45–65' },
            { id: 'Elion', count: 18, fmt: 'Text only', audience: 'All audiences + healthcare builders' },
            { id: 'Consultants', count: 8, fmt: 'Text only', audience: 'GPs, optometrists, patients researching specialists' },
          ].map(s => (
            <div key={s.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#003845' }}>{s.id}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: LI_BLUE }}>{s.count} posts</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(0,56,69,0.5)' }}>{s.fmt} · {s.audience}</div>
            </div>
          ))}
        </Section>

        {/* Compliance checklist */}
        <Section title="Pre-scheduling checklist">
          {[
            'No external URL in post body',
            'First line compelling within 200 characters',
            'Post ends with a genuine question',
            'No engagement bait phrases',
            'Topic directly relevant to ophthalmology',
            'British English, no em dashes',
            'No ASA red flags',
            'Elion posts rewritten by Elion',
            'Consultant posts approved by consultant',
            'LI-B06 Qureshi confirmation received',
            'Golden hour cover confirmed',
          ].map(item => (
            <div key={item} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
              <div style={{ width: 13, height: 13, border: '1.5px solid rgba(10,102,194,0.35)', borderRadius: 3, flexShrink: 0, marginTop: 1, background: '#fff' }} />
              <span style={{ fontSize: 10.5, color: 'rgba(0,56,69,0.65)', lineHeight: 1.45 }}>{item}</span>
            </div>
          ))}
        </Section>

        <div style={{ marginTop: 14, padding: '8px 10px', background: LI_LIGHT, borderRadius: 8, fontSize: 10, color: 'rgba(10,102,194,0.8)', fontWeight: 600, textAlign: 'center' }}>
          Full copy: ces_linkedin_strategy.md
        </div>
      </div>
    </div>
  )
}
