# Design review

A deep review of the wayfinding prototype. The review kept the IA as it was; later rounds in the same session changed it on request (see “IA changes” and “Session log”). Two independent passes: a design review (heuristics, journey walk at 1440 and 390 wide) and a mechanical one (Impeccable detector, computed spacing, type and contrast). Both ran on the original commit, `c95a710`.

**Verdict.** The structure was clearly authored for this product: the email deep link, “since your last visit”, rating only three skills, one next step, and “Back to your skills results” only make sense for Fuel50. The visual layer wasn’t: every block was the same card with a magenta eyebrow, 13 font sizes, 14 different gaps, and nothing led except the hero. Usability had one blocker (mobile navigation) and a cluster of trust breaks at the end of the journey.

## Scores (before)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Finishing the assessment and sending an application dropped focus with no announcement |
| 2 | Match with the real world | 3 | Email said “quarterly review” for a six-monthly cycle; no level definitions |
| 3 | User control and freedom | 2 | Apply dialog: no Escape, backdrop click lost what you typed |
| 4 | Consistency and standards | 2 | Hard-coded labels leaked through client renames; card metadata above the title on some cards and below it on others |
| 5 | Error prevention | 2 | “Yes, I’ve told Priya” was discarded, then the next step told her to tell Priya |
| 6 | Recognition over recall | 3 | Menus were buttons, not links (no URL, no open in new tab) |
| 7 | Flexibility and efficiency | 3 | “self assessment” (with a space) found nothing; no arrow keys in menus that claimed `role=menu` |
| 8 | Aesthetic and minimalist design | 3 | Home showed the next step three times |
| 9 | Error recovery | 1 | Search’s empty state was a dead end; disabled buttons didn’t say why |
| 10 | Help and documentation | 3 | “How Fuel50 is organised” sat at the bottom, below the fold for first-timers |
| | **Total** | **25/40** | Acceptable: solid structure, rough edges at the high-stakes moments |

The detector found 2 issues in source (a 5px coloured side border on the “since” card; a declared Inter font that never loaded) and 7 on Home in the browser (two eyebrows above headings, gradient fills, a straggling line, an unbalanced heading). Contrast passed everywhere in the default state.

## Fixed

### Blocker
- **[P0] Mobile navigation.** At 390px, `overflow-x: auto` on the top bar clipped every menu and pushed search, the next step and the account menu off-screen. The top bar now wraps: spaces on a second row, menus full width, search as an icon, and the next step kept with a hidden-but-announced “Next:”. Gutters drop to 16px.

### Journey and trust
- **[P1] The next step contradicted the user.** Applications now store whether the manager knows. If they do, no reminder. If not, the step says “You said you’d let Priya know”, and Plan has an “I’ve told Priya” action.
- **[P1] First visits got returner copy** (“Since your last visit”, “carry over from your last ratings”). First visits now have no prior ratings, Skills asks you to rate all 18 (“about 8 minutes”), and gig suggestions wait until there are ratings to base them on.
- **[P1] First-visit Home duplicated itself, and Northbank’s next step disagreed with its own “Start here”.** `nextStep()` now follows the client’s `startHere` order. Home leads with “Start here” as the hero, the next step inline on step 1, and the IA guide directly under it.
- **[P1] Apply was not a real modal.** It is now a native `<dialog>`: focus starts on the first answer, Escape and Cancel close it, and what you typed survives closing. It says what happens next (“Marcus Lee will reply within a week. Priya gets a copy”) and why Send is disabled. Focus returns to “Applied · view in your plan”.
- **[P1] Focus was lost after Finish and between rating steps.** Each new skill’s heading takes focus, finishing focuses the new page title, and a toast confirms “Sent to Priya Shah”. The last button now says “Send to Priya” rather than “Finish”, because that’s what it does.
- About me now shows the values you picked, not fixed sample text. On a first visit, the other exercises say “Not done yet”.
- “Ask for feedback” only ever added a goal. It now says “Add a feedback goal” and shows when it’s done.

### Labels and copy
- **[P1] Every key noun is now one setting.** The IA gained *terms* (skill, role, path, gig, mentor, course, vacancy, plan, review, mentee). Item labels and descriptions are templates over them, and all copy uses them: toasts, next steps, search result types, empty states, CTAs. Under Northbank, “Talents”, “coach” and “journeys” now reach descriptions and running copy, not just the nav. Before, about 15 places leaked canonical names.
- Rating shows what each level means (“Skilled: you do it well on your own”), shows “Last time” instead of “Your rating in 12 December”, and puts “Not relevant to me” apart from the scale.
- Skill rows say why in a few words (“New to your role”, “Description changed”) instead of repeating the summary card; unrated rows say “Rate”, not “Change”.
- Email: “six-monthly review”, not “quarterly”.
- Search: hyphens match spaces (“self assessment” finds the email’s “self-assessment”), and matches no longer start mid-word (“rate” no longer finds “Strategy”). The placeholder no longer promises people it can’t find. The empty state offers pages to go to, and the footer shows the keys.
- “Where you left off” says “View”, not “Pick up” (it was usually something finished). Home’s gig list marks ones you’ve applied for and drops “New”.
- CTAs are sentence case through the client’s labels (“Explore career paths”, “Open your development plan”).

### Accessibility
- Menus are disclosure navigation built from real links, with `aria-current`. Escape returns focus to the button that opened them (found from the open menu, because Safari doesn’t focus buttons on click). The `role=menu` that promised arrow keys is gone.
- Skill ratings’ person picker uses `aria-pressed` buttons, not a tablist with no panel. Rating dots are 28px with a visible boundary. On mobile, each skill gets its own row with the level names under the dots. Finishing one person offers “Next: Mei Chen”.
- Card titles are headings. Progress bars are decorative, so screen readers hear the readiness numbers once, not twice.
- Toasts pause while hovered or focused, so their links can be used.
- `accent-color` brands native radios and checkboxes. Selection, focus rings and underline offsets are themed.

### Visual system and spacing
- **One scale.** Spacing is a 4px unit (`--s-1…--s-16`) with deliberate steps: 4–12 inside a group, 20–32 between groups, 48 between sections. Type is a 1.2 ratio from 16px: 7 sizes instead of 13. Card padding is symmetric (24). Skill rows, cards and the page share one inner edge.
- **Hierarchy without eyebrows.** All 19 eyebrow kickers are gone. Cards use a quiet label heading with the value carrying the weight. The hero has more room and 32px of separation from what follows.
- **Collisions fixed.** Grids and card lists no longer butt into the next block (measured 0px before). Home no longer has 64px of dead space where breadcrumbs would be. The return banner no longer shifts the breadcrumbs. Page actions align with the H1 rather than floating mid-subtitle.
- The coloured side border and the gradient progress bars are solid now (the gradient logo mark was later replaced by Fuel50’s logo). Unicode glyph icons (⌕ ▾ × ← →) are replaced with one drawn stroke set.

### The prototype sidebar
The bottom-right panel is now a launcher (`\` or the *Prototype* button) for a sidebar. The page makes room for it rather than being covered.
1. **Scenario**: visit type, client configuration, restart.
2. **Labels**: every space name and key noun (singular and plural). The plural follows the singular until you type your own. If the active client overrides a word, the sidebar says so.
3. **Design**: every variable the stylesheet reads (10 colours, 6 type, 5 spacing, 3 layout, 4 shape, 2 motion), with live sliders, colour pickers, per-value reset and a count of changes.

**Copy changes** exports `{ design, content }`. `npm run tweak` reads it from the clipboard, prints a coloured diff, validates every key and range (suggesting near misses) and writes `design.json` and `content.json`. The sidebar’s draft then empties itself. If the browser blocks the clipboard, the JSON appears in a box to copy by hand.

After the fixes the detector reports nothing, and the typecheck and build pass. The returner journey was re-walked end to end at 1440 and 390 in headless Chrome, along with first visit, Northbank, weekly manager, the sidebar and a real `tweak` round trip, with no console errors. I didn’t re-score the heuristics independently.

## IA changes
Applied after the review, on request. The top-level structure is now three spaces (Home · Explore · My team, plus Admin), down from four; the items are the same, and Explore gained an overview.
- **Every space has a page**, listed first in its menu as “Overview”. Explore gained one: one tile per item with a live status (“5 open · 1 grows Data-driven decision making”) under a card naming your biggest gap. My team’s landing is now its overview. A space’s own page is titled with the space’s name, its breadcrumb ends at the space, and every space crumb is a link. In search these pages appear under the space’s name, which also finds a renamed space.
- **“Team” inside “My team”** (“Home / My team / Team”) is now that space’s **Overview**, titled “My team”.
- **“Reviews and ratings” → “Skill ratings”** (`{skill.one} ratings`, so Northbank gets “Talent ratings”). “reviews” and “reviews and ratings” stay as search synonyms.
- **My growth is folded into Home.** Skills, Target roles, Plan and About me are Home’s items, so every journey starts at Home and there’s no second “mine” space to cross between. Home’s menu lists Overview (the Home page) then those four; the breadcrumb reads “Home / Skills”; the Home page shows each with where it stands, plus your role and manager. `/growth` redirects Home, “my growth” still finds it in search, and “Your profile” in the account menu opens About me. URLs under `/growth/` are unchanged.
- **“My plan” → “Plan”**, removing the double “My”. Copy says “your plan” (“Open your plan”, “Add to your plan”). “my plan” stays a synonym.
- **“goals”** now belongs to Plan only; Target roles keeps “career goals”.
- **The two meanings of “role”** are resolved by convention: the `role` term is the career noun (target roles, open roles), and “your role” meaning someone’s current job stays plain English. Renaming the term to “position” gives “Target positions” without touching “New to your role”.

## Also fixed
- Vacancies say “closes in 18 days” (or “tomorrow”, “today”) instead of a date; the data stores days remaining, like gigs’ “posted N days ago”.
- The top bar uses Fuel50’s own logo (`src/assets/fuel50-logo.svg`, from fuel50.com), linking Home with no hover change.
- Target roles shows every gap on one shared scale: a five-step staircase from “Not relevant” to “Expert”, green for what you have, coral for what’s left, hatched when not rated yet, with the target outlined. Unrated skills no longer read as “Not relevant to me → Advanced”.
- Each option on a gap shows its reach: how many levels of your rated gaps it works on (“+3” for a gig that grows two gap skills). Two or more is tinted; the strongest on the page (`bestAction()`) is filled. It measures reach, not a promised gain.
- The Admin page lists what the IA moves out of the employee experience (Skills Studio, Talent Blueprint, Role Editor, reports and analytics), from one list in `src/ia.ts`. Searching for one of them explains it’s an admin tool instead of saying “Nothing found”.
- The account menu is clearer: “Your profile” without a breadcrumb under it, then a divider, then “Open Admin: Set up skills, roles and reports for your organisation” (was “Switch to Admin: For admins. Same shell, keeps your place.”).
- Skill names are sentence case (“Data-driven decision making”), matching the house style everywhere they appear.
- Home stops saying “Your last visit was 12 December” once you’ve sent your ratings this visit.

## Still open
- Fuel50’s logo red (`#ED1B2F`) doesn’t match the prototype’s magenta accent; the accent is one setting in the sidebar’s Colour section.
- URLs for Home’s items stay under `/growth/…` so old links work, but no longer match the nav.
- The admin tool descriptions on the Admin page were written in this session; check them (and whether the list is complete) against the Figma deck, which the Figma tools couldn’t read (Slides files aren’t supported).
- Action reach (“+3”) measures how much of your gaps an option works on, not levels gained; a gain model would need an assumption per action type.
- The heuristics weren’t re-scored after the fixes.
- Plurals and articles are English-only (`withArticle`, the sidebar’s auto-plural). Localised terms need grammar per language, as noted in CLAUDE.md.
- `scripts/journey.py` is updated for the new sidebar and labels but wasn’t run here (Python Playwright isn’t installed); the same journey was walked over CDP in headless Chrome.

## Session log

How this file came about, so the conversation can be cleared. Prompts are paraphrased; outcomes are what shipped.

1. **“Deep design review; keep the IA; flag usability risks and labels; make the spacing beautiful; turn the prototype menu into a sidebar (prototype controls, then every design variable); copy-changes button; `npm run tweak` to apply it. Questions first.”** Four questions, answered: refined plain (keep the colours and character); fix UI copy, only flag canonical IA labels; tokens as the source of truth; findings in `REVIEW.md`. Ran the critique as two isolated passes on a worktree of `c95a710` (design review; detector plus computed values), scored 25/40, then fixed the P0/P1s, rebuilt `styles.css` on tokens, and built the sidebar and `tweak`. One deviation from the plan: values live in `design.json` (spec and ranges in `tokens.ts`) so `tweak` merges JSON instead of rewriting TypeScript.
2. **Mid-task: “Labels in the sidebar too: one central string per key noun, used across the whole UI; ids and URLs stay internal.”** Added *terms* (`content.json`, templates in `ia.ts`, `term()` / `fill()`), moved all copy onto them, and gave the sidebar a Labels section; `tweak` writes `content.json` as well.
3. **“Fix it all.”** Applied the seven flagged IA label proposals (Explore overview, “Skill ratings”, “Plan”, team “Overview”, “goals” on Plan only, the “role” convention, and a “Profile” name that step 6 later removed), sentence-cased skill names, and stopped the “last visit” line after ratings are sent.
4. **“Explain Profile vs Overview and give choices; list what was removed from the employee experience on Admin; remove the breadcrumb in the account menu and make the Admin label clearer.”** Explained the two names and offered four ways to unify them (answered by step 6). Added the Admin tools list (from what the repo recorded) and the search explanation for admin tools. Account menu: “Your profile”, divider, “Open Admin” with a plain description.
5. **“On the gap cards, a segmented horizontal scale from not applicable to the top level, with colours, the same for all. Can actions be scored +1/+2/+3? Highlight them and make the top one primary.”** Built the staircase scale and found unrated skills were showing as “Not relevant to me”. Explained that levels gained can’t be scored honestly but reach can, and shipped reach with tiers and `bestAction()`. The message’s second part was cut off; read as “flatten My growth into Home?”, answered yes with the trade-offs, and asked.
6. **“Do that; the breadcrumb goes home.” Then: “Make this a Fuel50 logo, no hover, clicking goes home.”** Folded My growth’s summary into Home and linked its crumb to Home. Replaced the placeholder mark with Fuel50’s header logo from fuel50.com.
7. **“Vacancies: closes in X days.”** Done.
8. **“Kill the My growth nav item; route its items through Home; every journey starts at Home; Explore stays.”** My growth is no longer a space: its items belong to Home, Home’s menu lists Overview plus those items, and breadcrumbs read “Home / Skills”.
9. **“Check this file against the chat and add this log.”** This section; earlier sections corrected where later rounds had overtaken them.

**How it was verified.** The Chrome extension wasn’t connected and Python Playwright isn’t installed, so every round was checked in headless Chrome over the DevTools protocol on a separate dev server: the key journey at 1440 and 390, the other visit modes, Northbank, the sidebar and a real `tweak` round trip. Each round ended with the typecheck, the build and the Impeccable detector clean, and no console errors.

**Where things are.** `src/tokens.ts` + `src/design.json` (design variables), `src/content.json` (spaces and terms), `src/tweaks.tsx` (live draft), `src/components/ProtoPanel.tsx` + `proto.css` (sidebar), `scripts/tweak.ts`. CLAUDE.md describes the current IA and conventions.
