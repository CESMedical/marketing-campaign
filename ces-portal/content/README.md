# Content editing

All campaign posts live in `posts.json` in this folder. Edit that file directly to change copy, status, scheduling, or to add new posts.

## Schema (one post)

```json
{
  "id": "P01",
  "slug": "p01-campaign-launch-meet-the-ces-team",
  "title": "Campaign launch — meet the CES team",
  "pillar": "leadership",
  "platforms": ["instagram", "facebook", "linkedin"],
  "status": "live",
  "scheduledDate": "2026-05-01",
  "weekNumber": 1,
  "isCommercialPriority": false,
  "service": "brand",
  "format": "carousel",
  "caption": "...",
  "cta": {
    "label": "Follow our journey",
    "type": "save"
  },
  "productionLocation": "chatham",
  "productionLead": "leonna"
}
```

## Allowed values

- **pillar:** `educational` · `business` · `premises` · `employee` · `leadership` · `events` · `tech`
- **platforms:** any of `instagram` · `facebook` · `linkedin` · `youtube` · `x`
- **status:** `draft` → `clinical-review` → `brand-review` → `approved` → `scheduled` → `live`
- **service:** `cataract-monofocal` · `cataract-multifocal` · `cataract-edof` · `cataract-toric` · `oculoplastic-eyelid` · `glaucoma` · `dry-eye` · `general` · `brand`
- **format:** `single-image` · `carousel` · `reel` · `story` · `video` · `text`
- **cta.type:** `phone` · `web` · `dm` · `save` · `share`
- **productionLocation:** `pantiles` · `chatham` · `headcorn` · `northfleet` · `stock` · `remote`
- **productionLead:** `leonna` · `external` · `stock`

For the full type system see `types/post.ts`.

## Adding a post

1. Add a new object to the array in `posts.json`.
2. Use a unique `id` (e.g. `P49`) and a unique URL-safe `slug`.
3. Set `weekNumber` to match the `scheduledDate` (week 1 starts Friday 1 May 2026).
4. If it's a CTA-driven post pointing to a URL, add a `cta.utm` string or let `buildUtmUrl()` derive one.
5. Run `npm run build` — `generateStaticParams` will pick up the new post automatically.

## Commercial priority

Set `isCommercialPriority: true` for any post that should appear in the Priority view. The current 15 are intentionally focused on cataract lens decisions and oculoplastic eyelid conversions — adding more dilutes the focus.
