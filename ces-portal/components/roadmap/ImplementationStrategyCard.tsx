'use client'

import { useState } from 'react'
import { Clapperboard } from 'lucide-react'
import { PostRef } from './PostRef'

const BRAND       = '#003845'
const BRAND_DARK  = '#002a33'
const BRAND_LITE  = 'rgba(0,56,69,0.06)'
const BRAND_MID   = 'rgba(0,56,69,0.65)'
const BRAND_DIM   = 'rgba(0,56,69,0.38)'

const TYPE_COLORS: Record<string, string> = {
  A: '#003845',
  B: '#008080',
  C: '#2e7d5b',
  D: '#7c3aed',
  E: '#b7791f',
}

function Section({
  title, children, defaultOpen = false,
}: {
  title: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderTop: '1px solid rgba(0,56,69,0.08)', marginTop: 12, paddingTop: 12 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, width: '100%', textAlign: 'left', marginBottom: open ? 10 : 0 }}
      >
        <span style={{ fontSize: 9, fontWeight: 800, color: BRAND_DIM, textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1 }}>{title}</span>
        <span style={{ fontSize: 10, color: BRAND_DIM }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && children}
    </div>
  )
}

function TypeBadge({ letter }: { letter: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 16, height: 16, borderRadius: 4,
      background: TYPE_COLORS[letter], color: '#fff',
      fontSize: 9, fontWeight: 800, flexShrink: 0,
    }}>{letter}</span>
  )
}

function TypeRow({ letter, name, desc }: { letter: string; name: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
      <TypeBadge letter={letter} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: BRAND }}>{name}</div>
        <div style={{ fontSize: 10, color: BRAND_MID, lineHeight: 1.4 }}>{desc}</div>
      </div>
    </div>
  )
}

function DaySection({
  day, location, label, focus, posts,
}: {
  day: number; location: string; label: string; focus: string; posts: string[]
}) {
  const color = { Chatham: '#003845', Headcorn: '#2e7d5b', 'Tunbridge Wells': '#008080' }[location] ?? BRAND
  return (
    <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(0,56,69,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: color, borderRadius: 5, padding: '2px 7px', flexShrink: 0 }}>Day {day}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: color }}>{location}</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 10, color: BRAND_MID, lineHeight: 1.4, marginBottom: 5 }}>{focus}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {posts.map(id => <PostRef key={id} id={id} color={color} size={10} />)}
      </div>
    </div>
  )
}

function Deadline({
  date, task, posts, risk,
}: {
  date: string; task: string; posts?: string[]; risk?: string
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: BRAND, background: BRAND_LITE, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{date}</span>
        {posts && <span style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {posts.map(id => <PostRef key={id} id={id} color={BRAND} size={10} />)}
        </span>}
      </div>
      <div style={{ fontSize: 10.5, color: BRAND_MID, lineHeight: 1.4, marginBottom: risk ? 2 : 0 }}>{task}</div>
      {risk && (
        <div style={{ fontSize: 9.5, color: '#b23a48', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
          <span>⚠</span> {risk}
        </div>
      )}
    </div>
  )
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
      <div style={{ width: 13, height: 13, border: '1.5px solid rgba(0,56,69,0.3)', borderRadius: 3, flexShrink: 0, marginTop: 1, background: '#fff' }} />
      <span style={{ fontSize: 10.5, color: BRAND_MID, lineHeight: 1.45 }}>{children}</span>
    </div>
  )
}

function TypeGroup({ letter, ids }: { letter: string; ids: string[] }) {
  const color = TYPE_COLORS[letter]
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
        <TypeBadge letter={letter} />
        <span style={{ fontSize: 9.5, fontWeight: 700, color: BRAND_DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {{ A: 'Consultant Snippet', B: 'Leonna Premises', C: 'Patient Story', D: 'Motion Design', E: 'Static / Stock' }[letter]}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 21 }}>
        {ids.map(id => <PostRef key={id} id={id} color={color} size={10} />)}
      </div>
    </div>
  )
}

function Flag({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
      <span style={{ color: '#f59e0b', flexShrink: 0, fontSize: 11, marginTop: 1 }}>⚑</span>
      <span style={{ fontSize: 11, color: BRAND_MID, lineHeight: 1.5 }}>{children}</span>
    </div>
  )
}

export function ImplementationStrategyCard() {
  return (
    <div style={{
      width: 300, background: '#fff', borderRadius: 20,
      boxShadow: '0 4px 32px rgba(0,56,69,0.13)',
      border: '1.5px solid rgba(0,56,69,0.1)',
      borderLeft: `6px solid ${BRAND}`,
      overflow: 'hidden', userSelect: 'none',
    }}>

      {/* Header */}
      <div style={{ background: BRAND_DARK, padding: '18px 20px', cursor: 'grab' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Clapperboard size={14} color="rgba(255,255,255,0.7)" />
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Implementation Strategy</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.35, marginBottom: 10 }}>
          Content Production and Scheduling Guide
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Active', 'May–Aug 2026', '164 Posts', '6 Filming Days'].map(b => (
            <span key={b} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}>{b}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* Intro note */}
        <div style={{ padding: '8px 10px', background: BRAND_LITE, borderRadius: 8, fontSize: 10.5, color: BRAND_MID, lineHeight: 1.55 }}>
          <span style={{ fontWeight: 700, color: BRAND }}>Never schedule a post without a confirmed asset.</span> Every post maps to one of five production types. Plan filming days against the deadlines below and confirm asset delivery before scheduling.
        </div>

        {/* Production Types */}
        <Section title="5 Production Types" defaultOpen>
          <TypeRow
            letter="A"
            name="Consultant Snippet"
            desc="Direct clip from a consultant interview. No additional filming once interviews are complete. Requires export, subtitle and crop per platform."
          />
          <TypeRow
            letter="B"
            name="Leonna Premises Reel"
            desc="Location-based reel led by Leonna. Requires a booked filming day at the relevant centre and a confirmed shot list."
          />
          <TypeRow
            letter="C"
            name="Patient Story"
            desc="First-person patient interview. Written consent required at least 4 weeks before filming. Patient must be recruited and briefed in advance."
          />
          <TypeRow
            letter="D"
            name="Motion Design"
            desc="Animated explainer or graphic. No filming required — clinical brief, design production and approval only. Typical lead time: 2 weeks."
          />
          <TypeRow
            letter="E"
            name="Static / Stock"
            desc="Carousel slide graphics, single-image posts or stock photography. Brief to design team or stock selection. Approval required before scheduling."
          />
        </Section>

        {/* Filming Days */}
        <Section title="6 Filming Days" defaultOpen>
          <DaySection
            day={1} location="Chatham" label="Consultant Interviews and Premises B-roll"
            focus="All 4 consultant interviews (Part 1 + Part 2 with outfit change). B-roll for L01. Headshot for T01 (P04). This single day is the source for all Type A posts."
            posts={['P03', 'P04', 'P07', 'P10', 'P11', 'P17', 'P18', 'P22', 'P28', 'P29', 'P30', 'P31', 'P32', 'P33', 'P36', 'P39', 'P41', 'P42', 'P43', 'P44', 'P48', 'P49', 'P50', 'P51', 'P52', 'P53', 'P54', 'P55']}
          />
          <DaySection
            day={2} location="Chatham" label="Patient Stories"
            focus="Morning: PS01 Susan (cataract). Afternoon: PS02 James (acute referral). Also capture theatre sterilisation footage for L02."
            posts={['P13', 'P12', 'P27']}
          />
          <DaySection
            day={3} location="Chatham" label="Campaign Close"
            focus="Morning: PS04 glaucoma patient. Afternoon: Leonna and team wrap (P45), Elion closing message (P47). Capture patient coordinator photo for T02 (P35)."
            posts={['P46', 'P45', 'P47', 'P35']}
          />
          <DaySection
            day={4} location="Headcorn" label="Location and Diagnostics"
            focus="Full location walk-through for L03. Consultant on camera at IOLMaster 700. Diagnostic suite B-roll. Capture general Headcorn B-roll for future use."
            posts={['P24', 'P25']}
          />
          <DaySection
            day={5} location="Tunbridge Wells" label="Oculoplastic Morning and Behind the Scenes"
            focus="Morning: oculoplastic consultant morning for L05. Afternoon: Leonna behind-the-scenes for L04."
            posts={['P21', 'P16']}
          />
          <DaySection
            day={6} location="Tunbridge Wells" label="Patient Story and Leonna Reflection"
            focus="Morning: PS03 Anna (functional ptosis). Afternoon: Leonna reflection piece for L06."
            posts={['P38', 'P40']}
          />
        </Section>

        {/* Asset Delivery Deadlines */}
        <Section title="Asset Delivery Deadlines" defaultOpen>
          <Deadline
            date="28 Apr"
            posts={['P03', 'P04']}
            task="Consultant interview Day 1 at Chatham. All 4 interviews complete. Headshot T01 captured."
            risk="All Type A posts depend on this day — no fallback if missed"
          />
          <Deadline
            date="8 May"
            posts={['P07']}
            task="L01 (theatre morning) edited and delivered. Square, vertical and landscape exports."
          />
          <Deadline
            date="19 May"
            posts={['P12']}
            task="L02 (theatre sterilisation) edited and delivered."
          />
          <Deadline
            date="22 May"
            posts={['P13']}
            task="PS01 Susan filmed and consent signed. Patient recruitment must begin this week."
            risk="Patient must be recruited ≥4 weeks before filming — start immediately"
          />
          <Deadline
            date="28 May"
            posts={['P16']}
            task="L04 (Pantiles behind the scenes) edited and delivered."
          />
          <Deadline
            date="5 Jun"
            posts={['P21']}
            task="L05 (oculoplastic morning, Tunbridge Wells) edited and delivered."
          />
          <Deadline
            date="11 Jun"
            posts={['P24']}
            task="L03 (Headcorn walk-through) edited and delivered. Landscape export for YouTube."
          />
          <Deadline
            date="16 Jun"
            posts={['P27']}
            task="PS02 James (acute referral) filmed and consent signed."
            risk="Patient recruitment must begin by 19 May"
          />
          <Deadline
            date="30 Jun"
            posts={['P31', 'P35']}
            task="Consultant interview snippets for P31 exported. T02 patient coordinator photograph delivered."
          />
          <Deadline
            date="5 Jul"
            posts={['P38']}
            task="PS03 Anna (functional ptosis) filmed and consent signed."
            risk="Patient recruitment must begin by 7 June — commercial priority post"
          />
          <Deadline
            date="10 Jul"
            posts={['P40']}
            task="L06 (Leonna reflection, Tunbridge Wells) edited and delivered."
          />
          <Deadline
            date="22 Jul"
            posts={['P45', 'P46', 'P47']}
            task="L07 team wrap (P45) and Elion closing (P47) delivered. PS04 glaucoma patient filmed and consented."
          />
        </Section>

        {/* Active Flags */}
        <Section title="Active Flags" defaultOpen>
          <Flag>Patient recruitment for <PostRef id="P13" color="#f59e0b" /> (Susan) must begin this week — 22 May filming deadline</Flag>
          <Flag><PostRef id="P38" color="#f59e0b" /> (Anna, ptosis): commercial priority — patient recruitment needed by 7 June. Also feeds <PostRef id="P148" color="#f59e0b" /> (YouTube)</Flag>
          <Flag><PostRef id="P46" color="#f59e0b" /> (glaucoma patient): consent and recruitment needed before 22 July filming. Also feeds <PostRef id="P149" color="#f59e0b" /> (YouTube)</Flag>
          <Flag>YouTube channel must be live (handle, playlists, channel art, trailer) before <PostRef id="P134" color="#f59e0b" /> publishes</Flag>
          <Flag><PostRef id="P162" color="#f59e0b" /> (retinal detachment): SEEK URGENT CARE notice must appear in first frame before publishing</Flag>
          <Flag>All captions reviewed for ASA compliance before any post goes live</Flag>
          <Flag>UTM links tested on all CTA URLs before campaign launch</Flag>
        </Section>

        {/* Pre-launch Checklist */}
        <Section title="Pre-Launch Checklist">
          <div style={{ fontSize: 9, fontWeight: 800, color: BRAND_DIM, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Content</div>
          <Check>All 4 consultant interviews filmed, edited and exported (square, vertical, landscape)</Check>
          <Check>All interview snippets tagged with post IDs and filed in shared drive</Check>
          <Check>Patient stories PS01–PS04 filmed, consented and exported</Check>
          <Check>All motion design scripts approved by clinical team before production</Check>
          <Check>All carousel slide graphics approved by CES before scheduling</Check>
          <Check>All captions reviewed for ASA compliance, brand voice and grammar</Check>
          <Check>Subtitle review complete — all clinical terms checked for accuracy</Check>

          <div style={{ fontSize: 9, fontWeight: 800, color: BRAND_DIM, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, marginTop: 10 }}>Technical</div>
          <Check>YouTube channel live: handle, channel art, intro trailer (export P145 separately)</Check>
          <Check>All YouTube playlists created before first upload</Check>
          <Check>UTM parameters tested on all CTA web links</Check>
          <Check>cespatientinformation.co.uk pages live for all linked services</Check>
          <Check>cesmedical.co.uk service pages checked for Chatham, Headcorn and Tunbridge Wells</Check>
          <Check>Facebook page complete: business category, phone 01732 757771, CTA button live</Check>
          <Check>Instagram bio updated and link-in-bio page live</Check>

          <div style={{ fontSize: 9, fontWeight: 800, color: BRAND_DIM, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, marginTop: 10 }}>Operational</div>
          <Check>Content calendar confirmed with Leonna and CES clinic team</Check>
          <Check>All platform scheduling tools authenticated and tested</Check>
          <Check>Comment moderation plan agreed for YouTube (48-hour reply target)</Check>
          <Check>Patient consent forms filed securely for PS01–PS04</Check>
          <Check>Instagram grid reviewed for visual consistency at launch week</Check>
          <Check>Native Facebook versions prepared for all cross-posted Reels (no watermarks)</Check>
          <Check>LinkedIn personal profiles reviewed: Elion, Kopsachilis, Qureshi, Shahid, Leonna</Check>
        </Section>

        {/* Posts by Production Type */}
        <Section title="Posts by Production Type">
          <div style={{ padding: '6px 8px', background: BRAND_LITE, borderRadius: 6, fontSize: 10, color: BRAND_MID, marginBottom: 10 }}>
            Confirm every post&apos;s asset is in-hand before adding to the scheduler. Type A posts can only be produced after filming Day 1.
          </div>

          <TypeGroup
            letter="A"
            ids={['P03', 'P04', 'P10', 'P11', 'P17', 'P18', 'P22', 'P25', 'P28', 'P29', 'P30', 'P31', 'P32', 'P33', 'P36', 'P39', 'P41', 'P42', 'P43', 'P44', 'P48', 'P49', 'P50', 'P51', 'P52', 'P53', 'P54', 'P55']}
          />
          <TypeGroup
            letter="B"
            ids={['P07', 'P12', 'P16', 'P21', 'P24', 'P40', 'P45', 'P47']}
          />
          <TypeGroup
            letter="C"
            ids={['P13', 'P27', 'P38', 'P46']}
          />
          <TypeGroup
            letter="D"
            ids={['P14', 'P15', 'P20', 'P26', 'P34', 'P160', 'P162', 'P163', 'P164']}
          />
          <TypeGroup
            letter="E"
            ids={['P01', 'P02', 'P05', 'P06', 'P08', 'P09', 'P19', 'P23', 'P37']}
          />
        </Section>

        <div style={{ marginTop: 14, padding: '8px 10px', background: BRAND_LITE, borderRadius: 8, fontSize: 10, color: BRAND_MID, fontWeight: 600, textAlign: 'center' }}>
          Asset schedule: SCHEDULE_ENTRIES in lib/videography-content.ts
        </div>
      </div>
    </div>
  )
}
