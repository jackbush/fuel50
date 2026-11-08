# Fuel50 wayfinding prototype

Working prototype for the Fuel50 Product Design Lead take-home: “improve how people find their way around Fuel50”. Scope chosen: an **information architecture update**, with Home as the front page of the IA. The design reasoning lives in the Figma deck “Fuel50 demo digest — wayfinding exercise prep” (https://www.figma.com/slides/5HS9NF1geiDKe755EzvnFM), in its “IA proposal” section.

## Primary user and key journey

**The six-monthly returner.** Kimberley Thomas, Product Sales Manager (persona from the Fuel50 demo tenant). Her manager’s cycle sends her a reminder email. The journey:

1. `/start` — reminder email: “Self-assessment due 30 June” deep-links into Home › Skills (straight to the task, not the Home page).
2. Skills — “Since your last visit on 12 December”: 3 skills need attention; 15 carry over.
3. Rate only the 3 that need attention (pre-filled from last time where possible).
4. Done — readiness for target role + **one next step** for the biggest gap (gig · mentor · course).
5. Follow a link into Explore › Gigs — breadcrumb shows where you are; **“← Back to your skills results”** returns you.
6. Apply → it lands in Plan; Home now shows “Where you left off” and a new next step.

Other visit types (switch in the prototype sidebar): **First visit** (Home leads with “Start here”, ordered by the client’s rollout) and **Weekly manager** (My team appears; Skill ratings lets you rate a report’s skills inline, one click per skill).

## The IA model (read this before changing navigation or labels)

`src/ia.ts` is the source of truth.

- **Spaces are fixed:** Home · Explore · My team (leaders) · Admin (separate). Clients may rename a space, never remove it.
- **Every journey starts at Home.** Home holds everything that’s yours (Skills, Target roles, Plan, About me) as well as the summary page, so there’s no second “mine” space to cross between. Explore is what you could do; My team is the people you look after.
- **Items have canonical ids** (`skills`, `mentors`, `paths`…). Clients may rename, hide and reorder items (`TenantConfig`).
- **Each space has its own page**, listed first in its menu as “Overview”: the Home page, Explore’s overview, My team’s overview. That page is the item at the space’s path (`isLanding`). It is titled with the space’s name, its breadcrumb ends at the space, and search lists it under the space’s name. Menus show it first.
- **Terms are the key nouns** (skill, role, path, gig, mentor, course, vacancy, plan, review, mentee), each a `[singular, plural]` pair. The default words live in `src/content.json` with the space names; a client’s `terms` rename them. Item labels and descriptions are templates over terms (`Target {role.many}`), so renaming a noun once changes nav, titles, breadcrumbs, search, next steps, toasts and copy. Ids stay internal and in URLs. `itemLabels` is only for a page name that isn’t just its noun (Northbank’s “Coach”).
- **Never hard-code an item’s label or a key noun in UI.** Go through `resolveItem(tenant, id)` / `itemsInSpace` / `spaceLabel` / `term(tenant, id, n)`, or `<PageHeader item="…">`. Stored strings (toasts, “where you left off”) may hold `{skill.many}` placeholders; `fill()` resolves them when shown. That is what keeps everything consistent when a client renames things.
- Hidden items must disappear from nav, search and suggestions. Search explains when a query matches a hidden feature, or an admin tool (`ADMIN_TOOLS` in `src/ia.ts`, the tools moved out of employees’ menus; the Admin page lists them).
- Synonyms on each item (`talents`, `top skills`, `coach`, `journeys`…) feed search, so any client’s vocabulary finds the right page.
- Two tenants ship: `default` (canonical labels) and `northbank` (terms talent, coach, journey, development plan; items Coach, Journeys, Development plan, Personalize, Learn+; hides Vacancies; reorders Explore). Add more in `TENANTS`.

## Wayfinding patterns

- **Child items visible:** each space opens a menu listing its items with one-line descriptions (`TopNav` in `src/components/nav.tsx`).
- **Breadcrumbs** on every inner page, derived from the URL (`Breadcrumbs`).
- **Back to where you were:** any link that crosses into another module uses `<CrossLink to from="your target role">`. It stores an origin; `ReturnBanner` shows “← Back to …”. Main-nav jumps clear the origin.
- **One next step:** `nextStep()` in `src/logic.ts` is the only place that decides “what next”. Home, the nav pill, “Start here” and end-of-task panels all read it, so they always agree. On a first visit it follows the client’s `startHere` order.
- **Search everywhere:** ⌘K / Ctrl+K or `/`. One index over pages, your own stuff, opportunities and skills (`src/components/Search.tsx`).
- **Plain page titles:** the item label is the H1; no slogans as titles. Focus moves to the H1 on navigation.

## Code map

- `src/ia.ts` — spaces, items, terms, tenant configs, resolvers (`resolveTenant`, `resolveItem`, `term`, `fill`)
- `src/content.json` — default vocabulary: space names and `[singular, plural]` terms
- `src/tokens.ts` — design variables: spec (labels, ranges) and the CSS custom properties derived from them
- `src/design.json` — saved design values; `src/styles.css` reads only the variables `cssVars()` produces
- `src/tweaks.tsx` — applies design values to `:root` and holds the sidebar’s draft of changes (localStorage `fuel50-tweaks-v1`)
- `src/data.ts` — mock data (persona, 18 skills, target role, gigs, mentors, courses, paths, reports)
- `src/store.tsx` — app state (reducer + localStorage key `fuel50-proto-v2`)
- `src/logic.ts` — derived state: needs attention, gaps, readiness, next step, and each action’s reach (how many levels of your rated gaps it works on; `bestAction` picks the strongest)
- `src/components/` — `nav.tsx` (TopNav, Breadcrumbs, CrossLink, ReturnBanner, Toasts), `Search.tsx`, `ProtoPanel.tsx` + `proto.css` (prototype sidebar), `ui.tsx` (PageHeader, Card, Icon…)
- `src/pages/` — `Start` (email), `Home`, `Growth` (Home’s items: skills flow, targets, plan, about; URLs stay under `/growth/`), `Explore` (overview, gigs, mentors, learning, paths, vacancies), `Team` (overview, skill ratings, mentees), `Misc`
- `scripts/journey.py` — Playwright walkthrough that screenshots the key journey
- `scripts/tweak.ts` — saves changes copied from the sidebar into `design.json` / `content.json`

## Commands

- `npm install` then `npm run dev` (http://localhost:5173/#/start)
- `npm run build` — typecheck + production build into `dist/` (static, relative paths; HashRouter so it works on any static host)
- `npm run typecheck`
- Deploy: pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `dist/` to GitHub Pages
- `npm run tweak` — saves what the sidebar’s “Copy changes” copied (reads the clipboard; or `-- file.json`, `-- -` for stdin, `--dry-run` to preview). Validates every key and range and writes nothing if anything is wrong.

## Conventions

- React 19 + TypeScript + Vite, react-router (HashRouter). No UI library; plain CSS in `src/styles.css` using CSS variables.
- Visual design is deliberately plain. The brief scores wayfinding, not polish.
- **Design values come from variables.** Colours, type sizes, spacing, radii, shadows and motion are variables set by `cssVars()` in `src/tokens.ts`; only fixed component sizes (icons, avatar, rating dots) and white text on dark fills are literal. To add a design variable, add it to `SPEC` and `design.json`; the sidebar and `tweak` pick it up. Spacing steps are `--s-1…--s-16` (multiples of the unit); tints derive from the base colours with `color-mix`.
- **Prototype sidebar** (`\` or the Prototype button): scenario controls, then Labels, then design variables. It has its own fixed styles, so the tokens it edits never restyle it.
- Accessibility matters (the brief calls it out): semantic landmarks, `aria-current`, labelled controls, visible focus, keyboard-operable menus and search, reduced motion.
- Language: UK English, plain words, sentence case. Brand names (FuelValues etc.) only as secondary text, if at all.
- Mock everything. No backend.

## Known gaps / next ideas

- Localisation: labels per language in `TenantConfig` (structure supports it; not wired).
- “Since your last visit” is hard-coded; could derive from a last-visit timestamp and change log.
- English plurals and articles only (`withArticle`). Localising terms needs real grammar per language.
- Ratings for unchanged skills are carried over silently; consider an “older than N months” rule.
- My team › Succession and Hiring aren’t built; Admin is a placeholder.
- Instrumentation idea: return-to-origin rate (share of CrossLink journeys that end with “Back to …” rather than browser back or the logo).
