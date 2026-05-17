'use client'

import { useState } from 'react'
import { Facebook } from 'lucide-react'
import { PostRef } from './PostRef'

const FB_BLUE  = '#1877F2'
const FB_LIGHT = '#E7F0FF'

const rule = (text: React.ReactNode) => (
  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
    <span style={{ color: '#22c55e', flexShrink: 0, fontSize: 12, marginTop: 1 }}>✓</span>
    <span style={{ fontSize: 11, color: 'rgba(0,56,69,0.7)', lineHeight: 1.5 }}>{text}</span>
  </div>
)

const flag = (text: React.ReactNode) => (
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

export function FacebookStrategyCard() {
  return (
    <div style={{ width: 300, background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,56,69,0.13)', border: '1.5px solid rgba(0,56,69,0.1)', borderLeft: `6px solid ${FB_BLUE}`, overflow: 'hidden', userSelect: 'none' }}>

      {/* Header */}
      <div style={{ background: FB_BLUE, padding: '18px 20px', cursor: 'grab' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Facebook size={14} color="rgba(255,255,255,0.7)" />
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Platform Strategy</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.35, marginBottom: 10 }}>
          Facebook Algorithm Strategy and Content Framework
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Active', 'May–Aug 2026', '52 Posts'].map(b => (
            <span key={b} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}>{b}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
          {[
            { n: 52,   label: 'FB posts' },
            { n: 40,   label: 'Main camp.' },
            { n: 12,   label: 'FB-specific' },
            { n: '3–4', label: 'Posts/week' },
            { n: '15–30', label: 'Reel secs' },
            { n: 60,   label: 'Min response' },
          ].map(({ n, label }) => (
            <div key={label} style={{ background: FB_LIGHT, borderRadius: 8, padding: '7px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: FB_BLUE }}>{n}</div>
              <div style={{ fontSize: 9, color: 'rgba(0,56,69,0.45)', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Why Facebook */}
        <div style={{ padding: '8px 10px', background: 'rgba(24,119,242,0.06)', borderRadius: 8, fontSize: 11, color: 'rgba(0,56,69,0.65)', lineHeight: 1.55, marginBottom: 0 }}>
          <span style={{ fontWeight: 700, color: FB_BLUE }}>Highest-priority platform.</span> 54% of adults aged 50–64 visit Facebook daily. The 65+ cohort shows even higher daily usage. Facebook is where carers and family members see content and share it with the patient.
        </div>

        {/* Algorithm stages */}
        <Section title="Algorithm: 3 distribution stages" defaultOpen>
          <div style={{ fontSize: 11, color: 'rgba(0,56,69,0.65)', lineHeight: 1.55 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: FB_BLUE }}>Stage 1 — Diagnostic window:</span> Shown to small sample of followers. Algorithm watches engagement in first 60 minutes. Weak early engagement means the post never reaches non-followers. This is the critical window.
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: FB_BLUE }}>Stage 2 — Expanded reach:</span> Strong Stage 1 posts expand to more followers and appear in recommended feeds for non-followers who match the content topic. ~50% of what users see is AI-recommended.
            </div>
            <div>
              <span style={{ fontWeight: 700, color: FB_BLUE }}>Stage 3 — Beyond network:</span> High-performing posts shown to users identified by the AI as likely to engage, based on past behaviour with health content. Shares are the most powerful distribution signal.
            </div>
          </div>
        </Section>

        {/* Format benchmarks */}
        <Section title="Format performance (2026)">
          {[
            { fmt: 'Reels (15–30 seconds)', rate: 'Highest', use: 'Procedure explainers, patient stories', highlight: true },
            { fmt: 'Photo carousel (5+ slides)', rate: 'Very high', use: 'Educational, myth-busting', highlight: true },
            { fmt: 'Single image + long caption', rate: 'High', use: 'Awareness, consultant intros', highlight: false },
            { fmt: 'Text post (no image)', rate: 'Medium', use: 'Elion personal messages', highlight: false },
            { fmt: 'External link post', rate: 'Low', use: 'Avoid entirely', highlight: false },
          ].map(row => (
            <div key={row.fmt} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: row.highlight ? 700 : 500, color: row.highlight ? FB_BLUE : 'rgba(0,56,69,0.7)' }}>{row.fmt}</div>
                <div style={{ fontSize: 9, color: 'rgba(0,56,69,0.4)' }}>{row.use}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: row.highlight ? FB_BLUE : 'rgba(0,56,69,0.4)', background: row.highlight ? FB_LIGHT : 'transparent', padding: row.highlight ? '2px 7px' : '0', borderRadius: 6, marginLeft: 6, flexShrink: 0 }}>{row.rate}</span>
            </div>
          ))}
        </Section>

        {/* Content rules */}
        <Section title="Content rules (all posts)">
          {rule('Phone number 01732 757771 as CTA — not a URL')}
          {rule('Caption opens with the patient\'s experience, not CES Medical\'s name')}
          {rule('Write to earn shares — not to ask for them')}
          {rule('No engagement bait — algorithm penalises "like if you agree"')}
          {rule('No health outcome claims or guarantees — Facebook flags health claims')}
          {rule('No external URL in post body — use phone number instead')}
          {rule('Original content only — no other platform watermarks on Reels')}
          {rule('Format for mobile — vertical or square images, readable at 375px')}
          {rule('3 to 4 posts per week maximum — overposting reduces per-post reach')}
          {rule('Golden hour: reply to every comment within 60 minutes')}
          <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(24,119,242,0.06)', borderRadius: 8, fontSize: 11, color: 'rgba(0,56,69,0.6)' }}>
            <span style={{ fontWeight: 700 }}>Primary times: </span>Tue–Thu 8am and 7pm. <span style={{ fontWeight: 700 }}>Secondary: </span>Sat 9am.
          </div>
        </Section>

        {/* Active flags */}
        <Section title="Active flags" defaultOpen>
          {flag(<><PostRef id="P78" color={FB_BLUE} /> (Patient story: Susan): Do not schedule until PS01 footage is filmed and approved</>)}
          {flag('All evening posts (7pm): team member must be available to monitor comments until 9pm')}
          {flag('Main campaign posts going to Facebook: replace URL CTA with phone number 01732 757771 on Facebook versions')}
          {flag(<><PostRef id="P74" color={FB_BLUE} /> reel: must be exported without TikTok or Instagram watermark before native upload</>)}
        </Section>

        {/* Post breakdown */}
        <Section title="Post breakdown">
          {[
            { id: 'Main campaign', count: 40, fmt: 'Various', audience: 'Patients 55–75, carers, family members' },
            { id: 'FB-specific', count: 12, fmt: 'Single image, Carousel, Reel', audience: 'Same — deeper patient journey focus' },
          ].map(s => (
            <div key={s.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#003845' }}>{s.id}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: FB_BLUE }}>{s.count} posts</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(0,56,69,0.5)' }}>{s.fmt} · {s.audience}</div>
            </div>
          ))}
        </Section>

        {/* Pre-scheduling checklist */}
        <Section title="Pre-scheduling checklist">
          {[
            'Phone number 01732 757771 used as CTA (not URL)',
            'Caption opens with the patient\'s experience',
            'Caption formatted in short paragraphs for mobile',
            'No engagement bait phrases',
            'No health outcome claims or guarantees',
            'No external URL in post body',
            'Reels are native to Facebook (no other platform watermarks)',
            'Images formatted vertically or square for mobile',
            'Post is original content, not reposted',
            'Post frequency does not exceed 4 posts this week',
            'Golden hour cover confirmed (replies within 60 min)',
            'Evening posts: team member available until 9pm',
          ].map(item => (
            <div key={item} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
              <div style={{ width: 13, height: 13, border: `1.5px solid rgba(24,119,242,0.35)`, borderRadius: 3, flexShrink: 0, marginTop: 1, background: '#fff' }} />
              <span style={{ fontSize: 10.5, color: 'rgba(0,56,69,0.65)', lineHeight: 1.45 }}>{item}</span>
            </div>
          ))}
        </Section>

        <div style={{ marginTop: 14, padding: '8px 10px', background: FB_LIGHT, borderRadius: 8, fontSize: 10, color: 'rgba(24,119,242,0.8)', fontWeight: 600, textAlign: 'center' }}>
          Full copy: ces_facebook_strategy_card.md
        </div>
      </div>
    </div>
  )
}
