# CES Medical — Campaign Roadmap Portal

Internal roadmap portal for CES Medical's May–July 2026 social campaign. It provides authenticated access to campaign roadmaps, mutable post data, comments, strategy documents, asset uploads, and weekly digest emails.

Built with Next.js, TypeScript, Tailwind CSS, NextAuth, Prisma, and MySQL. The current deployment target is Railway using the Dockerfile and `railway.json`.

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

The production build runs as a Next.js server, not a static export.

## Database

Mutable post edits, comments, and uploaded image references are designed to use MySQL in production.
Set `DATABASE_URL` to the Railway MySQL connection string, then run:

```bash
npm run db:push
npm run db:seed
```

`db:seed` imports the current JSON posts/comments only when rows do not already exist, so it is safe to run again without overwriting live edits.

## Deploy to Railway

1. Push this repo to GitHub.
2. Create a Railway project with a MySQL service.
3. Deploy from the Dockerfile.
4. Set the required environment variables from `.env.example`.
5. Railway runs migrations and seed scripts from `railway.json` before deploy.

## Editing content

All posts live in `content/posts.json`. See `content/README.md` for the schema.

Campaign metadata lives in `content/campaign.json`.

## Brand notes

- Display font is currently **Fraunces** (Google Fonts) as a placeholder. When the **PP Telegraph** licence is confirmed, swap `--font-display` in `app/globals.css` to load it.

## Project structure

```
app/                      Next.js routes and API handlers
  (protected)/            Authenticated portal pages
  api/                    Auth, posts, comments, uploads, roadmaps
components/               UI in feature folders
content/                  posts.json, campaign.json (single source of truth)
lib/                      Data loading, filtering, formatting
types/                    TypeScript types
public/brand/             Logo SVG
```
