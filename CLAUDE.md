# Fuel50 wayfinding prototype

Working prototype for the Fuel50 Product Design Lead take-home: “improve how people find their way around Fuel50”. Scope chosen: an **information architecture update**, with Home as the front page of the IA. The design reasoning lives in the Figma deck “Fuel50 demo digest — wayfinding exercise prep” (https://www.figma.com/slides/5HS9NF1geiDKe755EzvnFM), in its “IA proposal” section.

## Primary user and key journey

**The six-monthly returner.** Kimberley Thomas, Product Sales Manager (persona from the Fuel50 demo tenant). Her manager’s cycle sends her a reminder email. The journey:

1. `/start` — reminder email: “Self-assessment due 30 June” deep-links into My growth › Skills (not Home).
2. Skills — “Since your last visit on 12 December”: 3 skills need attention; 15 carry over.
3. Rate only the 3 that need attention (pre-filled from last time where possible).
4. Done — readiness for target role + **one next step** for the biggest gap (gig · mentor · course).
5. Follow a link into Explore › Gigs — breadcrumb shows where you are; **“← Back to your skills results”** returns you.
6. Apply → it lands in My plan; Home now shows “Where you left off” and a new next step.

Other visit types (switch in the prototype controls): **First visit** (Home leads with “Start here”, ordered by the client’s rollout) and **Weekly manager** (My team appears; Reviews lets you rate a report’s skills inline, one click per skill).

## The IA model (read this before changing navigation or labels)

`src/ia.ts` is the source of truth.

- **Spaces are fixed:** Home · My growth · Explore · My team (leaders) · Admin (separate). Clients may rename a space, never remove it.
- **Items have canonical ids** (`skills`, `mentors`, `paths`…). Clients may rename, hide and reorder items (`TenantConfig`).
- **Never hard-code an item’s label in UI.** Always go through `resolveItem(tenant, id)` / `itemsInSpace` / `spaceLabel`, or `<PageHeader item="…">`. That is what keeps nav, search, breadcrumbs, page titles and next steps consistent when a client renames things.
- Hidden items must disappear from nav, search and suggestions. Search explains when a query matches a hidden feature.
- Synonyms on each item (`talents`, `top skills`, `coach`, `journeys`…) feed search, so any client’s vocabulary finds the right page.
- Two tenants ship: `default` (canonical labels) and `northbank` (renamed: Talents, Coach, Journeys, Development plan, Personalize, Learn+; hides Vacancies; reorders Explore). Add more in `TENANTS`.

## Wayfinding patterns

- **Child items visible:** each space opens a menu listing its items with one-line descriptions (`TopNav` in `src/components/nav.tsx`).
- **Breadcrumbs** on every inner page, derived from the URL (`Breadcrumbs`).
- **Back to where you were:** any link that crosses into another module uses `<CrossLink to from="your target role">`. It stores an origin; `ReturnBanner` shows “← Back to …”. Main-nav jumps clear the origin.
- **One next step:** `nextStep()` in `src/logic.ts` is the only place that decides “what next”. Home, the nav pill and end-of-task panels all read it, so they always agree.
- **Search everywhere:** ⌘K / Ctrl+K or `/`. One index over pages, your own stuff, opportunities and skills (`src/components/Search.tsx`).
- **Plain page titles:** the item label is the H1; no slogans as titles. Focus moves to the H1 on navigation.

## Code map

- `src/ia.ts` — spaces, items, tenant configs, resolvers
- `src/data.ts` — mock data (persona, 18 skills, target role, gigs, mentors, courses, paths, reports)
- `src/store.tsx` — app state (reducer + localStorage key `fuel50-proto-v1`)
- `src/logic.ts` — derived state: needs attention, gaps, readiness, next step
- `src/components/` — `nav.tsx` (TopNav, Breadcrumbs, CrossLink, ReturnBanner, Toasts), `Search.tsx`, `ProtoPanel.tsx`, `ui.tsx`
- `src/pages/` — `Start` (email), `Home`, `Growth` (overview, skills flow, targets, plan, about), `Explore`, `Team`, `Misc`
- `scripts/journey.py` — Playwright walkthrough that screenshots the key journey

## Commands

- `npm install` then `npm run dev` (http://localhost:5173/#/start)
- `npm run build` — typecheck + production build into `dist/` (static, relative paths; HashRouter so it works on any static host)
- `npm run typecheck`

## Conventions

- React 19 + TypeScript + Vite, react-router (HashRouter). No UI library; plain CSS in `src/styles.css` using CSS variables.
- Visual design is deliberately plain. The brief scores wayfinding, not polish.
- Accessibility matters (the brief calls it out): semantic landmarks, `aria-current`, labelled controls, visible focus, keyboard-operable menus and search, reduced motion.
- Language: UK English, plain words, sentence case. Brand names (FuelValues etc.) only as secondary text, if at all.
- Mock everything. No backend.

## Known gaps / next ideas

- Localisation: labels per language in `TenantConfig` (structure supports it; not wired).
- “Since your last visit” is hard-coded; could derive from a last-visit timestamp and change log.
- Ratings for unchanged skills are carried over silently; consider an “older than N months” rule.
- My team › Succession and Hiring aren’t built; Admin is a placeholder.
- Instrumentation idea: return-to-origin rate (share of CrossLink journeys that end with “Back to …” rather than browser back or the logo).
