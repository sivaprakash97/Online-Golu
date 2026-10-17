# The Internet Golu

A community Bommai Golu on the web. Anyone can make a little customizable Golu doll (a Bommai) in under a minute and place it on one of the shared 9-step Golus, which stand back to back on a turning stage.

**Core loop:** see the Golu → Add your Bommai → customize → pick it up and drop it on a free spot on the steps → share. You can drag your own Bommai to another spot on its Golu later.

**Getting around the Golu** (works as soon as the page opens): drag to look around, two-finger scroll to move, pinch (or a mouse wheel) to zoom, and the **+ / − / Reset view** buttons in the corner. Movement is limited to a box around the Golu so it can't drift out of view (`BOUNDS` and the angle/distance limits in `CameraRig`, `src/three/GoluScene.jsx`).

**Turning to the other Golus:** on phones and tablets, a sideways swipe on the home screen (not while placing, where a drag that misses the doll must not turn the stage; the stage follows your finger from the start; a cue above the main button says *Swipe to see the new Golu*, in gold when the Golu facing you is full). On computers, big arrows at the screen's edges, only where there's somewhere to go ("New Golu" on the right blinks, with a glow along that edge, when the Golu facing you is full and the next one has room), the ← / → keys, or dragging on past the edge of the look-around: the stage follows your finger, and letting go far enough along (or flicking) turns it to the next Golu. Under the main button, a line says how many spots the Golu facing you has left; on a full Golu the button reads *Add yours to the new Golu* and turns the stage there on the way into the workshop.

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

### Analytics

Vercel Web Analytics is on (Analytics tab of the Vercel project). `<Analytics />` in `src/main.jsx` counts page views, and `trackEvent` in `src/lib/analytics.js` sends the custom events `workshop_opened`, `bommai_placed` (with `golu` and `step`), `bommai_moved`, `bommai_edited` and `bommai_shared`. Nothing is counted from `?sandbox`. Custom events show up under the Events tab on a Vercel Pro plan. For the Bommais already placed (per day, per Golu and step, popular outfits and so on), run `supabase/analytics.sql` in the Supabase SQL editor.

**PostHog** adds funnels, session replay and heatmaps. Create a project at posthog.com, then set `VITE_POSTHOG_KEY` (and `VITE_POSTHOG_HOST` for an EU project) in Vercel's environment variables and redeploy; without the key it stays off. Names typed into the name tag are masked in replays. Funnel: `workshop_opened` → `placing_started` → `drag_started` → `bommai_placed`. Where people get stuck: `drag_released_off_target`, `place_rejected`, `place_failed`, and `golu_turned` (`via` swipe, arrow or key) and `golu_swipe_too_short`.

## How it's built

- **Vite + React + React Three Fiber (three.js) + drei.** No other UI libraries.
- `src/data/options.js` is the whole customization catalog. A Bommai is just a set of option ids (body, skin_tone, hair, hair_color, outfit, outfit_color, face, face_extras, accessory, pose). Add an option there, and if it needs new geometry, one `case` in the matching renderer:
  - Bommais are voxel dolls drawn voxel by voxel: body, outfits and poses in `src/three/bommai/build.js`, face and hair in `head.js`, accessories in `items.js`. `src/three/voxel/mesh.js` turns each doll into one mesh. Each pose's moving parts (a waving forearm, a wobbling head for *Hands together*, cheering arms, swaying hips, a dancing body, a floating cloud) are drawn into their own grids and animated in `Bommai.jsx`. The Golu stage and its room are voxels too: steps, floor, wall, pillars, toran, garlands, banana plants and lamps in `src/three/golu/stage.js`, the pieces on the top two steps in `src/three/traditional/pieces.js` (`dev/pieces.html` shows them close up). `dev/lineup.html` (dev server only) shows rows of them: `?set=showcase` (outfits), `?set=pairs` (every colour on the two-tone outfits), `?set=hair`, `?set=poses`, `?set=faces`, `?set=items`; add `&move` to see them move.
- How an accessory is carried depends on the pose (`carryMode` in `src/three/bommai/build.js`): held up high in one hand (a cricket bat rests on the floor instead), set down as an offering for *Hands together*, gripped at the side, hung from a strap, slung on the back, or set down beside the pedestal, so every accessory/pose pair makes sense.
- **Phones and tablets:** open straight into the Golu like a computer does. Screens narrower than 900px or shorter than 500px (`SMALL_SCREEN` in `src/lib/device.js`) draw the 3D at a lower resolution. Held upright (`PORTRAIT` in `src/lib/device.js`), the workshop is one column (preview, sideways-scrolling tabs, options, a pinned *Done*) with naming as its own screen. On touch screens one finger turns the Golu, two fingers pinch to zoom and drag to move.
- All Bommais share one geometry/material cache (`src/three/prims.jsx`) so hundreds of them stay cheap.
- `src/three/golu/Golu.jsx` builds a Golu, its room and the decorations. `TRADITIONAL_SLOTS` lists the pieces on the locked steps 8 and 9 of each Golu; swap a slot's `piece` for the owner's own figurine component (for example a glTF model) without touching anything else. Each Golu has its own colours (`GOLU_THEMES` in `stage.js`: Golu 2 has peacock-blue steps and a green arch) so you can tell them apart.
- **The carousel** (`src/three/golu/Carousel.jsx`): the Golus stand round a ring facing outward (two of them back to back) and the ring turns. Whichever Golu faces you stands exactly where a lone Golu would, so the camera's shots, the spots and drag and drop all work on it unchanged; only that Golu takes clicks, and at rest the others aren't drawn. The lamps' flickering lights are fixed in the room (`GoluLights`) rather than on the turning Golus, so hiding one never changes the scene's light count (which would make every shader rebuild). Bommais carry a `golu` number; the layout, free spots and step limits are all per Golu. Placing happens on the Golu facing you; if it's full when you finish your Bommai, the stage turns to one with room. *Find my Bommai* and shared links turn to the right Golu first.
- `src/three/golu/layout.js` holds the step geometry and the **spots**. The Golu tapers (14.2 wide at the bottom, 0.6 narrower per step, 10.6 on the third row from the top) and each step's spots are evenly spaced, clustering in the middle on the upper steps. Rows without a spot get one centre-out in join order.
- `src/three/DragLayer.jsx` is drag and drop: the doll hangs from the pointer by its head and swings like a pendulum, free spots glow, the one under the pointer swells, and dropping on steps 8–9 (or anywhere that isn't a free spot) floats it back. On a crowded Golu (half its spots or fewer left) each free spot also sends up a column of light with a gold diamond bobbing above head height, so spots hidden behind the dolls on the step below are still easy to find. The top two steps show a *reserved for the deities and gods* message. When placing a new Bommai, holding it zooms the view in 30% around your finger and the zoomed view follows your finger as you carry it (a crop of the same shot, so every spot stays in reach); after the drop it zooms back out once the petals have fallen.
- Option tiles in the creator are real renders of your Bommai, generated on a hidden canvas (`src/three/Thumbnails.jsx`).
- `src/lib/store.js` is the only place that talks to Supabase.
- **Sandbox (`?sandbox` on any URL):** a practice Golu for running the flow again and again, for testing or screen recording. It starts from the real Golu, but what you add, move or edit stays in that tab and never reaches the database; reloading starts over as a first-time visitor (your real Bommai is ignored, and the *Preview* badge is hidden). Every Golu is open in the sandbox, even before the database has the second-Golu migration.

## Supabase

- Schema, RLS and realtime: `supabase/migrations/20261013000000_bommais.sql`. Seeds: `supabase/seed.sql` (regenerate from `src/data/seed.js` with `npm run seed:sql`).
- Visitors get a silent **anonymous session** (`signInAnonymously`); there is no login screen. Turn on *Authentication → Sign In / Providers → Allow anonymous sign-ins* in the Supabase dashboard.
- Steps 8 and 9 are protected in three places: the UI never offers them, a `check (step between 1 and 7)` constraint rejects them, and the insert policy repeats the rule. Clients can only insert their own row (`auth.uid() = user_id`), cannot set `seeded`/`created_at`, and cannot update or delete.
- **Spots and moving** (`supabase/migrations/20261015000000_slots_and_moving.sql`): the third row from the top (step 7) holds 9 Bommais, which leaves about one Bommai's width between neighbours, and each row further down holds one more (step *k* has 16 − *k* spots: 15 on step 1, 84 in all; `spotsOnStep` in `src/data/options.js` repeats the rule). Adds `slot` with one Bommai per spot, replaces the flat 7-per-step limit, gives existing Bommais spots, requires a spot on insert, and lets visitors move only their own Bommai (step and spot only, steps 1–7). **Deploy the app before running this migration**: from then on the database requires a spot for every new Bommai, which older builds don't send. Until it runs, the app still works (spots are assigned on screen) but moving is off.
- **Placement rules** (`supabase/migrations/20261014000000_placement_rules.sql`): each visitor places **one** Bommai, and caps each step (now by spots, see above). The UI follows the same rules: full steps can't be picked, a visitor who already has a Bommai gets *Find my Bommai* instead of *Add your Bommai*, and a full Golu says so.
- **More Golus** (`supabase/migrations/20261017000000_second_golu.sql`): adds `golu` (1 or 2, default 1, so everyone already placed stays on Golu 1), makes a spot unique per Golu, and counts each step's spots per Golu. Moving keeps a Bommai on its Golu (visitors can't update `golu`). Safe to run before or after deploying: older builds don't send `golu`, so their Bommais land on Golu 1, and newer builds show just Golu 1 (no arrows) until it has run. To open a third Golu, raise `GOLU_COUNT` in `src/data/options.js` and the `bommais_golu_open` check (and add a theme and traditional slots for it).
- **Editing your Bommai** (`supabase/migrations/20261016000000_edit_own_bommai.sql`): after *Find my Bommai*, or clicking your own Bommai, an *Edit* button reopens the workshop with your doll; saving changes its look and name tag but not its spot. The migration lets visitors update the recipe columns of their own row (the existing update policy already limits them to it). Safe to run before or after deploying; until it runs, saving says editing isn't switched on.

## Not in V1 (on purpose)

Accounts, profiles, feeds, likes, AI generation, moderation tools, admin. See the original brief in the project thread.
