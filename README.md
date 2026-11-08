# Fuel50 wayfinding prototype

An information-architecture concept for helping people find their way in Fuel50: three stable spaces (Home · Explore · My team), with your own stuff under Home where every journey starts, child items in the menu, global search that understands each client’s labels, breadcrumbs, a “back to where you were” link, and one suggested next step everywhere.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173/#/start. That's the start of the key journey: a reminder email.

To build a static copy: `npm run build`, then serve `dist/` from any static host (it uses relative paths and hash routing).

Pushing to `master` deploys to GitHub Pages (`.github/workflows/deploy.yml`; you can also run it by hand from the Actions tab). One-time setup: in the repo's Settings › Pages, set Source to “GitHub Actions”.

## Try this (about 3 minutes)

1. **Email → Skills.** Click “Confirm my skills”. You land straight in Home › Skills, not on the Home page, with a summary of what changed since your last visit.
2. **Rate only what changed.** “Review 3 that need attention”. The other 15 carry over.
3. **One next step.** The results show your readiness for your target role and one way to start on the biggest gap.
4. **Go and come back.** Open the gig. The breadcrumb says where you are; “← Back to your skills results” returns you.
5. **Apply.** It goes into your Plan; Home now shows where you left off and a new next step.
6. **Search.** Press ⌘K (Ctrl+K) and try “talents”, “top skills”, “coach”, “target roles”.
7. **Another client.** Open the prototype sidebar (the *Prototype* button, bottom right, or press `\`) and switch Client configuration to *Northbank (renamed)*. Every label changes consistently, Vacancies disappears, and search still finds “mentor” (now “Coach”).
8. **Other visits.** Switch Visit to *First visit* (Start here) or *Weekly manager* (My team, inline rating).
9. **Rename a noun.** In the sidebar’s *Labels*, change “skill” to “capability”. Nav, titles, breadcrumbs, search, next steps and copy all follow, and URLs don’t change.

“Restart journey” in the sidebar resets the state (it's stored in localStorage).

## Tweak the design

The sidebar’s lower sections hold every design variable the UI uses: colour, type, spacing, layout, shape and motion. Changes show live and stay in your browser. To keep them:

1. Press **Copy changes** in the sidebar.
2. Run `npm run tweak`. It reads the clipboard, shows what will change, validates it and writes `src/design.json` and `src/content.json`.

`npm run tweak -- changes.json` reads a file instead, and `--dry-run` previews without writing.

## What it is and isn't

Mock data, no backend, plain visuals on purpose. See `REVIEW.md` for the design review and what changed. Persona, role and target role come from the Fuel50 demo tenant; everything else is sample content.

See `CLAUDE.md` for the IA model and code map.
