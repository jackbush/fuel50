/**
 * Derived state: what needs attention, readiness for the target role, and the
 * single suggested next step. Keep this the only place that decides “what next”,
 * so Home, the nav pill and end-of-task panels always agree.
 */
import { courses, gigs, mentors, person, reports, skills, targetRole, DUE_DATE, type Level, type Skill } from './data'
import { cap, resolveItem, term, type Tenant, type ItemId } from './ia'
import type { State } from './store'

export function needsAttention(state: State): Skill[] {
  return skills.filter(s => s.change || state.ratings[s.id] === null)
}

/** `rated` is false when there's no rating yet: the gap is shown, but its size is a guess. */
export interface Gap { skill: Skill; current: Level; target: Level; size: number; rated: boolean }

export function gaps(state: State): Gap[] {
  return skills
    .map(s => {
      const current = (state.ratings[s.id] ?? 0) as Level
      return { skill: s, current, target: s.target, size: s.target - current, rated: state.ratings[s.id] !== null }
    })
    .filter(g => g.size > 0)
    .sort((a, b) => b.size - a.size || a.skill.name.localeCompare(b.skill.name))
}

export function readiness(state: State) {
  const relevant = skills.filter(s => s.target > 0)
  const ready = relevant.filter(s => (state.ratings[s.id] ?? 0) >= s.target).length
  return { ready, total: relevant.length, pct: Math.round((ready / relevant.length) * 100) }
}

export function optionsForSkill(skillId: string) {
  return {
    gigs: gigs.filter(g => g.grow.includes(skillId)),
    mentors: mentors.filter(m => m.skills.includes(skillId)),
    courses: courses.filter(c => c.skills.includes(skillId)),
  }
}

export type ActionKind = 'gig' | 'mentor' | 'course'
export interface Action { kind: ActionKind; id: string; title: string; path: string; skills: string[]; reach: number; spans: number }

/**
 * How much of your gaps an action works on: the levels between your rating and the
 * target, summed over the gap skills it grows. Not a promise of levels gained, which
 * nothing in the data can tell us. Unrated skills count 0 until they're rated.
 */
export function actionsFor(state: State, skillId: string): Action[] {
  const known = gaps(state).filter(g => g.rated)
  const score = (ids: string[]) => {
    const hit = known.filter(g => ids.includes(g.skill.id))
    return { reach: hit.reduce((n, g) => n + g.size, 0), spans: hit.length }
  }
  const o = optionsForSkill(skillId)
  return [
    ...o.gigs.map(g => ({ kind: 'gig' as const, id: g.id, title: g.title, path: `/explore/gigs/${g.id}`, skills: g.grow, ...score(g.grow) })),
    ...o.mentors.map(m => ({ kind: 'mentor' as const, id: m.id, title: m.name, path: '/explore/mentors', skills: m.skills, ...score(m.skills) })),
    ...o.courses.map(c => ({ kind: 'course' as const, id: c.id, title: c.title, path: '/explore/learning', skills: c.skills, ...score(c.skills) })),
  ]
}

/** The single strongest action across all gaps: most reach, then most gaps at once, then the biggest gap first. */
export function bestAction(state: State): { action: Action; skillId: string } | undefined {
  let best: { action: Action; skillId: string } | undefined
  for (const g of gaps(state))
    for (const a of actionsFor(state, g.skill.id))
      if (a.reach > 0 && (!best || a.reach > best.action.reach || (a.reach === best.action.reach && a.spans > best.action.spans))) best = { action: a, skillId: g.skill.id }
  return best
}

export interface NextStep { title: string; detail: string; path: string; cta: string }

const label = (t: Tenant, id: ItemId, fallback: string) => resolveItem(t, id)?.label ?? fallback

/** Whether a “Start here” step is done. Only some steps can be finished in the prototype. */
export const startStepDone = (state: State, id: ItemId) => (id === 'about' ? state.aboutDone : id === 'skills' ? state.assessmentDone : false)

export function nextStep(state: State, tenant: Tenant): NextStep {
  const t = (id: Parameters<typeof term>[1], n?: number) => term(tenant, id, n)
  const manager = person.manager.split(' ')[0]
  if (state.mode === 'leader') {
    const due = reports.filter(r => r.dueSkills.some(sk => !state.teamRatings[r.id]?.[sk]))
    if (due.length)
      return { title: `Rate ${t('skill')} for ${due.length} ${due.length === 1 ? 'person' : 'people'}`, detail: `Due ${DUE_DATE} for your team’s ${t('review', 1)} cycle.`, path: '/team/reviews', cta: 'Start rating' }
  }
  // First visit: the client's rollout order decides, so Home, the pill and “Start here” agree.
  if (state.mode === 'first') {
    const id = tenant.startHere.find(id => resolveItem(tenant, id) && !startStepDone(state, id))
    if (id === 'about')
      return { title: 'Start with what matters to you at work', detail: `A 2-minute exercise in ${label(tenant, 'about', 'About me')}. It shapes every suggestion after it.`, path: '/growth/about', cta: 'Start' }
    if (id === 'skills')
      return { title: `Rate your ${t('skill')}`, detail: `${skills.length} ${t('skill')} for ${person.role}. About 8 minutes, and you can stop any time.`, path: '/growth/skills', cta: 'Start rating' }
    if (id) {
      const it = resolveItem(tenant, id)!
      return { title: `Look around ${it.label}`, detail: it.description + '.', path: it.path, cta: `Open ${it.label.toLowerCase()}` }
    }
  }
  if (!state.assessmentDone && state.mode !== 'first') {
    const n = needsAttention(state).length
    return { title: `Confirm your ${t('skill')} by ${DUE_DATE}`, detail: `${n} need${n === 1 ? 's' : ''} your attention. The rest carry over from last time.`, path: '/growth/skills', cta: `Review ${n} ${t('skill', n)}` }
  }
  const top = state.assessmentDone ? gaps(state)[0] : undefined
  if (top) {
    const opts = optionsForSkill(top.skill.id)
    const acted =
      state.applications.some(a => opts.gigs.some(g => g.id === a.gigId)) ||
      state.mentorRequests.some(m => opts.mentors.some(x => x.id === m)) ||
      state.courses.some(c => opts.courses.some(x => x.id === c))
    if (!acted)
      return {
        title: `Grow ${top.skill.name}`,
        detail: `Your biggest gap for ${targetRole.title}. ${opts.gigs.length} ${t('gig', opts.gigs.length)}, ${opts.mentors.length} ${t('mentor', opts.mentors.length)} and ${opts.courses.length} ${t('course', opts.courses.length)} can help.`,
        path: `/growth/targets#gap-${top.skill.id}`,
        cta: 'See options',
      }
  }
  const untold = state.applications.find(a => !a.managerTold)
  if (untold)
    return { title: `Tell ${manager} about your application`, detail: `You said you’d let ${manager} know. ${cap(t('gig', 1))} owners often check with your manager first.`, path: '/growth/plan', cta: `Open your ${label(tenant, 'plan', 'plan').toLowerCase()}` }
  return { title: 'You’re up to date', detail: `See where else your ${t('skill')} could take you.`, path: '/explore/paths', cta: `Explore ${label(tenant, 'paths', 'paths').toLowerCase()}` }
}
