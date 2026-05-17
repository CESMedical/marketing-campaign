'use client'

import { useState } from 'react'
import { Youtube } from 'lucide-react'
import { PostRef } from './PostRef'

const YT_RED   = '#FF0000'
const YT_DARK  = '#CC0000'
const YT_LIGHT = '#FFF0F0'

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

export function YouTubeStrategyCard() {
  return (
    <div style={{ width: 300, background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,56,69,0.13)', border: '1.5px solid rgba(0,56,69,0.1)', borderLeft: `6px solid ${YT_RED}`, overflow: 'hidden', userSelect: 'none' }}>

      {/* Header */}
      <div style={{ background: YT_DARK, padding: '18px 20px', cursor: 'grab' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Youtube size={14} color="rgba(255,255,255,0.7)" />
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Platform Strategy</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.35, marginBottom: 10 }}>
          YouTube Algorithm Strategy and Content Framework
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Active', 'May–Aug 2026', '26 Videos'].map(b => (
            <span key={b} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}>{b}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
          {[
            { n: 26,    label: 'Total videos' },
            { n: 8,     label: 'Long-form' },
            { n: 10,    label: 'Shorts' },
            { n: '50%+', label: 'Avg view dur.' },
            { n: '4%+', label: 'CTR target' },
            { n: '48h', label: 'Comment reply' },
          ].map(({ n, label }) => (
            <div key={label} style={{ background: YT_LIGHT, borderRadius: 8, padding: '7px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: YT_RED }}>{n}</div>
              <div style={{ fontSize: 9, color: 'rgba(0,56,69,0.45)', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Why YouTube is different */}
        <div style={{ padding: '8px 10px', background: 'rgba(255,0,0,0.05)', borderRadius: 8, fontSize: 11, color: 'rgba(0,56,69,0.65)', lineHeight: 1.55, marginBottom: 0 }}>
          <span style={{ fontWeight: 700, color: YT_RED }}>Not a social feed — a search engine.</span> A well-optimised cataract surgery explainer published in May 2026 will still generate patient enquiries in 2028. Every video is a permanent digital asset, not a campaign post.
        </div>

        {/* 3 ranking signals */}
        <Section title="3 primary ranking signals" defaultOpen>
          <div style={{ fontSize: 11, color: 'rgba(0,56,69,0.65)', lineHeight: 1.55 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: YT_RED }}>Watch time and retention:</span> Videos with 50%+ average view duration rank higher regardless of total views. A viewer watching 100% of 8 minutes beats 40% of 25 minutes. Cut everything that does not add value.
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: YT_RED }}>Click-through rate (CTR):</span> The single most important metric. Target 4 to 10%. Below 2% signals the algorithm to reduce impressions. An increase from 3% to 6% CTR can double organic reach. Faces in thumbnails consistently outperform scenery or text-only.
            </div>
            <div>
              <span style={{ fontWeight: 700, color: YT_RED }}>Satisfaction signals:</span> Likes (target 4%+), comments (target 0.5%+), saves to playlists, shares. Videos exceeding benchmarks receive 2 to 3 times more algorithmic distribution. Respond to every comment within 48 hours.
            </div>
          </div>
        </Section>

        {/* 2-format strategy */}
        <Section title="2-format strategy">
          {[
            {
              fmt: 'Long-form explainers (8–12 min)',
              detail: 'Primary asset. Hosted on YouTube. Embedded on cesmedical.co.uk and cespatientinformation.co.uk. Designed to rank in YouTube and Google search. One per fortnight. Evergreen — compounds for years.',
              highlight: true,
            },
            {
              fmt: 'YouTube Shorts (under 60 seconds)',
              detail: 'Discovery engine. Reaches people who do not yet know CES Medical. Each Short covers one clinical insight and links to the relevant long-form video. One per week. Entry point only — not a dead end.',
              highlight: false,
            },
          ].map(row => (
            <div key={row.fmt} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: row.highlight ? YT_RED : 'rgba(0,56,69,0.7)', marginBottom: 3 }}>{row.fmt}</div>
              <div style={{ fontSize: 10.5, color: 'rgba(0,56,69,0.6)', lineHeight: 1.5 }}>{row.detail}</div>
            </div>
          ))}
          <div style={{ padding: '6px 10px', background: 'rgba(255,0,0,0.05)', borderRadius: 8, fontSize: 11, color: 'rgba(0,56,69,0.6)' }}>
            <span style={{ fontWeight: 700 }}>Cadence: </span>1 long-form per fortnight + 1 Short per week. Consistency beats volume.
          </div>
        </Section>

        {/* Content rules */}
        <Section title="Content rules (all videos)">
          {rule('SEO first — primary keyword in title (first 60 chars), first 2 sentences of description and tags')}
          {rule('Custom thumbnail with consultant face, warm expression and text overlay — never auto-generated')}
          {rule('Chapter timestamps mandatory for all videos over 4 minutes')}
          {rule('Auto-captions reviewed and corrected before publishing — clinical terms frequently mistranscribed')}
          {rule('End screens link to at least 2 related videos — session depth is a key ranking signal')}
          {rule('All videos added to the correct playlist on upload')}
          {rule('Every Short derived from a long-form section — Shorts are the funnel top, not a dead end')}
          {rule('Satisfaction over length — tightly edited 7 minutes beats padded 15 minutes')}
          {rule('Never edit after publishing — create a pinned comment for minor corrections instead')}
          {rule('Respond to every comment within 48 hours of publishing')}
          <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(255,0,0,0.05)', borderRadius: 8, fontSize: 11, color: 'rgba(0,56,69,0.6)' }}>
            <span style={{ fontWeight: 700 }}>Playlists: </span>Cataract Surgery · Oculoplastic Surgery · Eye Conditions Explained · Meet Our Consultants · Patient Stories · Shorts
          </div>
        </Section>

        {/* Active flags */}
        <Section title="Active flags" defaultOpen>
          {flag(<><PostRef id="P146" color={YT_RED} /> (Susan): requires PS01 filming before scheduling — also feeds <PostRef id="P78" color={YT_RED} /> (Facebook) and <PostRef id="P67" color={YT_RED} /> (Instagram)</>)}
          {flag(<><PostRef id="P147" color={YT_RED} /> (James): requires PS02 filming</>)}
          {flag(<><PostRef id="P148" color={YT_RED} /> (Anna): requires PS03 filming — also feeds <PostRef id="P61" color={YT_RED} /> (Instagram)</>)}
          {flag(<><PostRef id="P149" color={YT_RED} /> (glaucoma patient): requires PS04 filming and patient consent</>)}
          {flag(<><PostRef id="P153" color={YT_RED} /> (retinal detachment): SEEK URGENT CARE notice must appear in first frame before publishing</>)}
          {flag(<><PostRef id="P138" color={YT_RED} />, <PostRef id="P139" color={YT_RED} />, <PostRef id="P140" color={YT_RED} />: topics confirmed, full scripts pending — do not schedule until scripts approved</>)}
          {flag('YouTube channel must be set up (handle, playlists, channel art, trailer) before first video upload')}
          {flag(<><PostRef id="P145" color={YT_RED} /> (Elion): 90-second cut also serves as YouTube channel trailer — export separately</>)}
        </Section>

        {/* Top SEO keywords */}
        <Section title="Top SEO keywords by video">
          {[
            { kw: 'Cataract surgery Kent', video: 'P134' },
            { kw: 'Drooping eyelid medical or cosmetic', video: 'P135' },
            { kw: 'Glaucoma newly diagnosed', video: 'P136' },
            { kw: 'Retinal detachment symptoms', video: 'P137' },
            { kw: 'Corneal transplant explained', video: 'P138' },
            { kw: 'Dry eye IPL treatment', video: 'P139' },
            { kw: 'Multifocal lens implant', video: 'P140' },
            { kw: 'Diabetic retinopathy treatment', video: 'P141' },
          ].map(row => (
            <div key={row.kw} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 10.5, color: 'rgba(0,56,69,0.65)', flex: 1, lineHeight: 1.4 }}>{row.kw}</span>
              <PostRef id={row.video} color={YT_RED} size={10} label={row.video} />
            </div>
          ))}
        </Section>

        {/* Pre-publishing checklist */}
        <Section title="Pre-publishing checklist">
          {[
            'Title under 60 characters with primary keyword front-loaded',
            'Description includes keyword in first two sentences',
            'Description includes CES phone number and at least one URL',
            'Chapter timestamps added for all videos over 4 minutes',
            'Auto-captions reviewed and corrected',
            'Custom thumbnail created (face, expression, text overlay)',
            'End screens link to at least two related videos',
            'Video added to the correct playlist',
            '8 to 12 tags added (mix of broad and niche)',
            'No health outcome guarantees in title or description',
            'No slow intros or unnecessary padding',
            'Team member available to reply to comments within 48 hours',
          ].map(item => (
            <div key={item} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
              <div style={{ width: 13, height: 13, border: `1.5px solid rgba(255,0,0,0.3)`, borderRadius: 3, flexShrink: 0, marginTop: 1, background: '#fff' }} />
              <span style={{ fontSize: 10.5, color: 'rgba(0,56,69,0.65)', lineHeight: 1.45 }}>{item}</span>
            </div>
          ))}
        </Section>

        <div style={{ marginTop: 14, padding: '8px 10px', background: YT_LIGHT, borderRadius: 8, fontSize: 10, color: 'rgba(204,0,0,0.8)', fontWeight: 600, textAlign: 'center' }}>
          Full video list: ces_youtube_posts.md
        </div>
      </div>
    </div>
  )
}
