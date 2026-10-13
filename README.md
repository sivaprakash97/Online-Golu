# The Internet Golu

A community Bommai Golu on the web. Anyone can make a little customizable Golu doll (a Bommai) in under a minute and place it on a shared 9-step Golu.

**Core loop:** see the Golu → Add your Bommai → customize → choose a step → watch it hop onto the step → share.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + publishable/anon key (optional)
npm run dev
```

Without Supabase env vars the app runs on an in-memory store seeded with the demo Bommais, and shows a small "Preview · not shared yet" badge. With them, every visitor sees the same Golu and new Bommais drop in live.

`npm run build` makes a normal static build in `dist/`. `npm run build:single` inlines everything into one HTML file in `dist-single/` (used for quick shareable previews).

## Hosting

Vercel project `internet-golu` is linked to this repo with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set. Every PR gets a preview deployment (visible to the Vercel account owner), and `main` deploys to production at the public `internet-golu` vercel.app domain.

## How it's built

- **Vite + React + React Three Fiber (three.js) + drei.** No other UI libraries.
- `src/data/options.js` is the whole customization catalog. A Bommai is just a set of option ids (body, skin_tone, hair, hair_color, outfit, outfit_color, face, face_extras, accessory, pose). Add an option there, and if it needs new geometry, one `case` in the matching renderer:
  - `src/three/bommai/Hair.jsx`, `Face.jsx`, `Accessory.jsx`, and outfits/poses in `Bommai.jsx`.
- All Bommais share one geometry/material cache (`src/three/prims.jsx`) so hundreds of them stay cheap.
- `src/three/golu/Golu.jsx` builds the Golu, the room and the decorations. `TRADITIONAL_SLOTS` lists the pieces on the locked steps 8 and 9; swap a slot's `piece` for the owner's own figurine component (for example a glTF model) without touching anything else.
- `src/three/golu/layout.js` lays out each step: the newest Bommai takes centre stage, the rest shuffle outward, and crowded steps compress.
- Option tiles in the creator are real renders of your Bommai, generated on a hidden canvas (`src/three/Thumbnails.jsx`).
- `src/lib/store.js` is the only place that talks to Supabase.

## Supabase

- Schema, RLS and realtime: `supabase/migrations/20261013000000_bommais.sql`. Seeds: `supabase/seed.sql` (regenerate from `src/data/seed.js` with `npm run seed:sql`).
- Visitors get a silent **anonymous session** (`signInAnonymously`); there is no login screen. Turn on *Authentication → Sign In / Providers → Allow anonymous sign-ins* in the Supabase dashboard.
- Steps 8 and 9 are protected in three places: the UI never offers them, a `check (step between 1 and 7)` constraint rejects them, and the insert policy repeats the rule. Clients can only insert their own row (`auth.uid() = user_id`), cannot set `seeded`/`created_at`, and cannot update or delete. Each anonymous visitor can place up to 5 Bommais.

## Not in V1 (on purpose)

Accounts, profiles, feeds, likes, AI generation, moderation tools, admin. See the original brief in the project thread.
