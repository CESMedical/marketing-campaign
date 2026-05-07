# CES Medical — Campaign Roadmap Portal

Internal roadmap portal for CES Medical's May–July 2026 social campaign. 48 posts, three views (Timeline / Board / Priority), filterable by pillar, platform, status, service, location, and lead.

Built with Next.js 15 (static export), Tailwind 3, and TypeScript. Deploys to Cloudflare Pages.

---

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
```

Static output is written to `out/`. That's the directory Cloudflare Pages serves.

## Database

Mutable post edits, comments, and uploaded image references are designed to use MySQL in production.
Set `DATABASE_URL` to the Railway MySQL connection string, then run:

```bash
npm run db:push
npm run db:seed
```

`db:seed` imports the current JSON posts/comments only when rows do not already exist, so it is safe to run again without overwriting live edits.

## Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. In Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Select the repo. Set:
   - **Framework preset:** Next.js (Static HTML Export)
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
   - **Node version:** 20 (set as env var `NODE_VERSION=20` if needed)
4. Deploy.

To password-protect: in the Pages project → Settings → Access policy → Add Cloudflare Access. Free up to 50 users.

## Editing content

All posts live in `content/posts.json`. See `content/README.md` for the schema.

Campaign metadata lives in `content/campaign.json`.

## Brand notes

- Display font is currently **Fraunces** (Google Fonts) as a placeholder. When the **PP Telegraph** licence is confirmed, swap `--font-display` in `app/globals.css` to load it.
- The brand guideline PDF in `docs/` lists the secondary teal as `#00080` — that's a typo. The correct value (used in this build) is `#008080`. Worth flagging back to the brand source.

## Project structure

```
app/                      Next.js routes
  page.tsx                Landing
  roadmap/page.tsx        Roadmap with view switcher
  post/[slug]/page.tsx    Post detail
  about/page.tsx          Campaign brief
components/               UI in feature folders
content/                  posts.json, campaign.json (single source of truth)
lib/                      Data loading, filtering, formatting
types/                    TypeScript types
public/brand/             Logo SVG
docs/                     Reference PDFs (brand guideline, social planner)
```
