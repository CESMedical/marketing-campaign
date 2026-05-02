# CLAUDE.md — Project brief for Claude Code

This file tells Claude Code how this project is structured, the conventions to follow, and what's live vs. what's a placeholder.

## What this is

An internal campaign roadmap portal for **CES Medical** (UK private ophthalmology). Built by agency **Alastra**. Audience is internal: agency, clinic team, consultants. Not patient-facing.

It visualises the May–July 2026 social media campaign — 48 posts, 15 commercial-priority — in three views: Timeline (by week), Board (by status), Priority (by service).

## Stack

- **Next.js 15** with App Router, **static export** (`output: 'export'`) → deploys to Cloudflare Pages
- **React 19** (RC, pinned in package.json)
- **Tailwind CSS 3.4** — *not* v4. Cloudflare Pages stability.
- **TypeScript** strict
- **lucide-react** for icons, **clsx** for class composition
- No database, no API routes — all content from `content/*.json`

## Brand system — non-negotiable

Defined in `app/globals.css` as CSS variables, exposed through Tailwind in `tailwind.config.ts`.

| Token | Hex | Use |
|-------|-----|-----|
| `--brand-deep` | `#003845` | Primary text, deep backgrounds |
| `--brand-teal` | `#008080` | Primary accent, CTAs |
| `--brand-bg` | `#FFFFFF` | Default background |
| `--brand-bg-soft` | `#F4F7F8` | Soft cards, secondary surfaces |
| `--brand-bg-deep` | `#002A33` | Deep hero backgrounds |
| `--brand-tint-1/2/3` | `#2A6B7A` / `#66A9B0` / `#C8DEE1` | Accent steps |

Use Tailwind classes: `bg-brand-deep`, `text-brand-teal`, `border-brand-deep/10` etc. **Do not introduce hex values directly in components.**

### Fonts

- **Display:** Fraunces (Google) — placeholder until PP Telegraph licence is confirmed. Swap by changing `--font-display` in `globals.css`.
- **Body / sans:** Work Sans (Google).
- Loaded via `next/font/google` in `app/layout.tsx` so they're self-hosted at build time.

## Voice & content rules

When generating or editing post copy, follow these:

- **Avoid "premium"** — Optegra owns that positioning in UK ophthalmology.
- **Avoid ASA-risky superlatives** ("best", "leading", "most advanced") unless provable.
- **Spell out FRCOphth** the first time it appears in any post.
- Use UK regional geography: Tunbridge Wells, Maidstone, Medway, Kent — not just "near London".
- Distinguish **functional eyelid surgery** (medical, often insurance-covered) from **cosmetic** clearly.
- Phone CTAs (`tel:01732755771`) work better for the 65+ demographic on Facebook.
- Web CTAs go to either `cesmedical.co.uk` or `cespatientinformation.co.uk`. UTM-tag everything (`buildUtmUrl()` in `lib/utm.ts`).

## Architecture

```
app/                      File-based routing
  layout.tsx              Fonts, header, footer, globals
  page.tsx                Landing
  roadmap/page.tsx        Roadmap (client, Suspense-wrapped, view-switching)
  post/[slug]/page.tsx    Post detail (generateStaticParams from posts.json)
  about/page.tsx          Campaign brief

components/
  brand/Logo.tsx          Inline SVG (full + mark variants)
  layout/                 Header, Nav, Footer
  roadmap/                Filters, ViewSwitcher, three view components, PostCard
  post/                   PostHero, PostTimeline (approval), PostCTA
  ui/                     Button, Card, Tag (primitives)

lib/
  posts.ts                loadPosts, filterPosts, groupByWeek/Status/Service, getAdjacent
  format.ts               formatDate, getStatusTone, getWeekRange, pluralise
  utm.ts                  buildUtmUrl
  filters.ts              URL search param ↔ PostFilters

types/post.ts             Post, Campaign, all enums + display-label maps
content/
  posts.json              48 posts (DRAFT — to be overwritten via review)
  campaign.json           Campaign dates and metadata

public/brand/Logo_96.svg
docs/                     Reference PDFs (brand, social planner)
```

## Conventions

- **Display labels** for any enum (Pillar, Platform, Status, Service, Location) live in `types/post.ts` as `*_LABELS` maps. Always use those — never hardcode "Educational" or "Instagram" in a component.
- **Status order** is canonical: `STATUS_ORDER` in `types/post.ts`. The Board view follows it.
- **Filters** are URL-driven via `useSearchParams`. The filter bar updates the URL; the roadmap page re-reads from URL. This makes every filtered view shareable and preserves state across navigation.
- **Static export quirk:** all internal `<Link href>` and route patterns end with `/` (because `trailingSlash: true` in `next.config.mjs`). Keep this consistent.
- **Accessibility:** every section has a labelled heading; nav has `aria-label`; interactive icons have titles or `aria-label`s. The skip-link at the top of the body must be preserved.

## What's seed data, what's real

Everything in `content/posts.json` is **draft seed data** that follows the brief and brand voice. CES clinical and brand reviewers will overwrite it during the review cycle. The structure is real — the words are placeholders that pass voice rules.

The 15 commercial-priority posts (see `isCommercialPriority: true`) are distributed:
- 7 oculoplastic-eyelid surgery
- 5 cataract-multifocal lens
- 3 cataract-monofocal lens

This split is intentional and matches the strategy doc.

## Open items

- [ ] **PP Telegraph licence** — confirm with CES, then swap `--font-display` in `globals.css`.
- [ ] **Brand guideline typo** `#00080` (5 chars, invalid) → should be `#008080`. Flag back to source.
- [ ] **Domain** — pick between `roadmap.cesmedical.co.uk` (CNAME) and `*.pages.dev` default.
- [ ] **Cloudflare Access** — set on Pages project for password protection (free tier covers 50 users).
- [ ] **Locations page** (`app/locations/page.tsx`) — referenced in original architecture but not yet built. Optional. Production filming map of Pantiles/Chatham/Headcorn/Northfleet.

## Things to NOT do

- Do not add a database, API routes, or server-side rendering — static export only.
- Do not rewrite all 48 captions unless asked. They're seed data the client will replace.
- Do not introduce `framer-motion`, `radix-ui`, or other heavy deps without checking — this is a small internal tool.
- Do not change the brand colour values.
- Do not remove `trailingSlash: true` — it changes every URL in the project.
