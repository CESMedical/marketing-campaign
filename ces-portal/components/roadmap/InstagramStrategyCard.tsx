'use client'

import { useState } from 'react'
import { Instagram } from 'lucide-react'

const IG_PINK  = '#E1306C'
const IG_LIGHT = '#FEE8F2'

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

export function InstagramStrategyCard() {
  return (
    <div style={{ width: 300, background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,56,69,0.13)', border: '1.5px solid rgba(0,56,69,0.1)', borderLeft: `6px solid ${IG_PINK}`, overflow: 'hidden', userSelect: 'none' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%)', padding: '18px 20px', cursor: 'grab' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Instagram size={14} color="rgba(255,255,255,0.7)" />
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Platform Strategy</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.35, marginBottom: 10 }}>
          Instagram Algorithm Strategy and Content Framework
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Active', 'May–Aug 2026', '52 Posts'].map(b => (
            <span key={b} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)' }}>{b}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
          {[
            { n: 52,       label: 'IG posts' },
            { n: 38,       label: 'Main camp.' },
            { n: 14,       label: 'IG-specific' },
            { n: '3s',     label: 'Hook window' },
            { n: '10.15%', label: 'Carousel eng.' },
            { n: '3–4',    label: 'Posts/week' },
          ].map(({ n, label }) => (
            <div key={label} style={{ background: IG_LIGHT, borderRadius: 8, padding: '7px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: IG_PINK }}>{n}</div>
              <div style={{ fontSize: 9, color: 'rgba(0,56,69,0.45)', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Platform role */}
        <div style={{ padding: '8px 10px', background: 'rgba(225,48,108,0.06)', borderRadius: 8, fontSize: 11, color: 'rgba(0,56,69,0.65)', lineHeight: 1.55, marginBottom: 0 }}>
          <span style={{ fontWeight: 700, color: IG_PINK }}>Platform role: attract and educate.</span> Facebook converts. Instagram attracts patients in the research phase and converts curious followers into enquirers. Audience: 45–65, actively researching, visually driven, save and DM-share behaviour.
        </div>

        {/* 4 algorithms */}
        <Section title="4 simultaneous algorithms" defaultOpen>
          <div style={{ fontSize: 11, color: 'rgba(0,56,69,0.65)', lineHeight: 1.55 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: IG_PINK }}>Feed:</span> Content from accounts the user interacts with regularly. Carousels and single images perform best. Relationship signals (DMs, story replies) carry significant weight.
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: IG_PINK }}>Reels:</span> Primary discovery engine. Reaches non-followers. Ranked entirely on watch time, completion rate, replays and DM shares. Follower count largely irrelevant. 94% of distribution now from AI recommendations.
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: IG_PINK }}>Stories:</span> Only shown to followers. Ranked by closeness. Daily Stories keep the account visible to its warmest audience.
            </div>
            <div>
              <span style={{ fontWeight: 700, color: IG_PINK }}>Explore:</span> Where non-followers discover new accounts. Ranked on completion rate, dwell time and whether the user follows after viewing.
            </div>
          </div>
        </Section>

        {/* Top 3 signals */}
        <Section title="Top 3 signals (Mosseri, 2025)">
          {[
            { signal: 'Watch time', detail: 'First 3 seconds determine Reel distribution. Drop-off before 3s throttles the post. Hook must be immediate.' },
            { signal: 'DM shares', detail: '694,000 Reels sent via DM every minute. Private sharing is now the strongest distribution signal. Design every post to earn a send.' },
            { signal: 'Saves', detail: 'Educational content, checklists and reference carousels generate saves consistently. Track saves per reach, not raw save counts.' },
          ].map(row => (
            <div key={row.signal} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: IG_PINK, marginBottom: 2 }}>{row.signal}</div>
              <div style={{ fontSize: 10.5, color: 'rgba(0,56,69,0.6)', lineHeight: 1.5 }}>{row.detail}</div>
            </div>
          ))}
        </Section>

        {/* Format performance */}
        <Section title="Format performance (2026)">
          {[
            { fmt: 'Reels under 30 seconds', rate: 'Discovery', detail: 'Completion rate', highlight: true },
            { fmt: 'Reels 30–90 seconds', rate: 'Education', detail: 'Watch time + saves', highlight: true },
            { fmt: 'Carousel (7–10 slides)', rate: '10.15% eng.', detail: 'Saves + swipe rate', highlight: false },
            { fmt: 'Single image', rate: 'Medium', detail: 'Dwell time', highlight: false },
            { fmt: 'Stories (10–15s each)', rate: 'Warmth', detail: 'Daily habit signal', highlight: false },
          ].map(row => (
            <div key={row.fmt} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: row.highlight ? 700 : 500, color: row.highlight ? IG_PINK : 'rgba(0,56,69,0.7)' }}>{row.fmt}</div>
                <div style={{ fontSize: 9, color: 'rgba(0,56,69,0.4)' }}>{row.detail}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: row.highlight ? IG_PINK : 'rgba(0,56,69,0.45)', background: row.highlight ? IG_LIGHT : 'transparent', padding: row.highlight ? '2px 7px' : '0', borderRadius: 6, marginLeft: 6, flexShrink: 0 }}>{row.rate}</span>
            </div>
          ))}
        </Section>

        {/* Content rules */}
        <Section title="Content rules (all posts)">
          {rule('Hook within first 3 seconds of every Reel — visual and immediate')}
          {rule('Design for silent viewing — all Reels fully subtitled')}
          {rule('Caption first two lines must earn the "more" tap')}
          {rule('End educational carousels with "Save this" prompt — not "share this"')}
          {rule('No watermarks from other platforms — zero tolerance, suppressed by Originality Score')}
          {rule('Link in bio only — no clickable links in captions; update bio link per major post')}
          {rule('5 to 8 niche hashtags only — no generic high-volume tags without specifics')}
          {rule('3 to 4 feed posts per week max — consistency over frequency')}
          {rule('Stories posted daily — warmth layer, does not count toward feed post limit')}
          {rule('Human layer required — Leonna, consultant or patient on camera; no pure AI faces or voiceovers')}
          <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(225,48,108,0.06)', borderRadius: 8, fontSize: 11, color: 'rgba(0,56,69,0.6)' }}>
            <span style={{ fontWeight: 700 }}>Primary: </span>Wed 9am. <span style={{ fontWeight: 700 }}>Secondary: </span>Mon + Fri 9am. Reels at 9am for discovery.
          </div>
        </Section>

        {/* Active flags */}
        <Section title="Active flags" defaultOpen>
          {flag('IG04: requires L04 Leonna Pantiles footage before scheduling')}
          {flag('IG06: requires PS03 Anna patient story footage — written consent needed')}
          {flag('IG08: requires L01 Leonna Chatham morning footage')}
          {flag('IG10: requires NK-C11 Kopsachilis interview footage')}
          {flag('IG12: requires PS01 Susan patient story footage — written consent needed')}
          {flag('Use Trial Reels feature on IG02, IG06, IG10 and IG12 before full posting to test hooks with cold audiences')}
          {flag('Bio link must be updated to match the destination of each major post on publish day')}
        </Section>

        {/* Checklist */}
        <Section title="Pre-scheduling checklist">
          {[
            'No watermarks from other platforms',
            'Caption opens with patient experience or clinical insight',
            'First two lines compelling on mobile without tapping more',
            'No health outcome guarantees or unprovable superlatives',
            'No engagement bait phrases',
            'Link in bio updated to relevant destination',
            '5 to 8 relevant niche hashtags included',
            'Reel subtitled and legible without audio',
            'Hook delivered within first 3 seconds of any Reel',
            'Stories queue has fresh content for the same day',
            'Post frequency does not exceed 4 feed posts this week',
            'Trial Reels tested before full posting where applicable',
          ].map(item => (
            <div key={item} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
              <div style={{ width: 13, height: 13, border: `1.5px solid rgba(225,48,108,0.35)`, borderRadius: 3, flexShrink: 0, marginTop: 1, background: '#fff' }} />
              <span style={{ fontSize: 10.5, color: 'rgba(0,56,69,0.65)', lineHeight: 1.45 }}>{item}</span>
            </div>
          ))}
        </Section>

        <div style={{ marginTop: 14, padding: '8px 10px', background: IG_LIGHT, borderRadius: 8, fontSize: 10, color: 'rgba(225,48,108,0.8)', fontWeight: 600, textAlign: 'center' }}>
          Full copy: ces_instagram_posts.md
        </div>
      </div>
    </div>
  )
}
