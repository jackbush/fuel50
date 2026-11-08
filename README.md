# Fuel50 wayfinding prototype

An information-architecture concept for helping people find their way in Fuel50: four stable spaces (Home · My growth · Explore · My team), your own stuff in one place, child items in the menu, global search that understands each client’s labels, breadcrumbs, a “back to where you were” link, and one suggested next step everywhere.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173/#/start. That's the start of the key journey: a reminder email.

To build a static copy: `npm run build`, then serve `dist/` from any static host (it uses relative paths and hash routing).

## Try this (about 3 minutes)

1. **Email → Skills.** Click “Confirm my skills”. You land deep in My growth › Skills, not on Home, with a summary of what changed since your last visit.
2. **Rate only what changed.** “Review 3 that need attention”. The other 15 carry over.
3. **One next step.** The results show your readiness for your target role and one way to start on the biggest gap.
4. **Go and come back.** Open the gig. The breadcrumb says where you are; “← Back to your skills results” returns you.
5. **Apply.** It goes into My plan; Home now shows where you left off and a new next step.
6. **Search.** Press ⌘K (Ctrl+K) and try “talents”, “top skills”, “coach”, “target roles”.
7. **Another client.** In the prototype controls (bottom right), switch Client config to *Northbank (renamed)*. Every label changes consistently, Vacancies disappears, and search still finds “mentor” (now “Coach”).
8. **Other visits.** Switch Visit to *First visit* (Start here) or *Weekly manager* (My team, inline rating).

“Restart journey” in the controls resets the state (it's stored in localStorage).

## What it is and isn't

Mock data, no backend, plain visuals on purpose. Persona, role and target role come from the Fuel50 demo tenant; everything else is sample content.

See `CLAUDE.md` for the IA model and code map.
