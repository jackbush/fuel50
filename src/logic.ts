/**
 * Derived state: your path and target role, what needs attention, readiness, and the
 * outstanding tasks. Keep `tasks()` the only place that decides “what next”, so Home,
 * the tasks page, the account menu's count and the coach always agree.
 */
import { courses, gigs, mentors, paths, person, reports, skills, DUE_IN_DAYS, ROLE_TARGETS, type Level, type Skill } from './data'
import { cap, resolveItem, term, type Tenant, type ItemId } from './ia'
import type { State } from './store'

export const savedPath = (state: State) => paths.find(p => p.id === state.pathId) ?? paths[0]
export const targetRole = (state: State) => savedPath(state).steps[1]
/** The level a role needs in a skill: your target role unless you name another. */
export const targetFor = (state: State, s: Skill, role = targetRole(state)): Level => ROLE_TARGETS[role]?.[s.id] ?? s.target

export function needsAttention(state: State): Skill[] {
  return skills.filter(s => s.change || state.ratings[s.id] === null)
}

/** Not rated counts as level 0 in every sum; `rated` only says which it was, for labels. */
export interface Gap { skill: Skill; current: Level; target: Level; size: number; rated: boolean }

export function gaps(state: State): Gap[] {
  return skills
    .map(s => {
      const current = (state.ratings[s.id] ?? 0) as Level
      const target = targetFor(state, s)
      return { skill: s, current, target, size: target - current, rated: state.ratings[s.id] !== null }
    })
    .filter(g => g.size > 0)
    .sort((a, b) => b.size - a.size || a.skill.name.localeCompare(b.skill.name))
}

/** How many of a role's skills you already meet: your target role unless you name another. */
export function readiness(state: State, role = targetRole(state)) {
  const relevant = skills.filter(s => targetFor(state, s, role) > 0)
  const ready = relevant.filter(s => (state.ratings[s.id] ?? 0) >= targetFor(state, s, role)).length
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
 * nothing in the data can tell us. A skill that isn't rated counts from 0.
 */
export function actionsFor(state: State, skillId: string): Action[] {
  const all = gaps(state)
  const score = (ids: string[]) => {
    const hit = all.filter(g => ids.includes(g.skill.id))
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

/** Skills below what your target role needs. Opportunities highlight these. */
export const neededSkills = (state: State) => new Set(gaps(state).map(g => g.skill.id))

/** A first visit before any ratings: gaps and suggestions would be guesses. */
export const noRatingsYet = (state: State) => state.mode === 'first' && !state.assessmentDone

/** Options strong enough to recommend: two or more levels of your gaps, not yet in your plan. Strongest first. */
export function recommendedActions(state: State): Action[] {
  if (noRatingsYet(state)) return []
  const taken = (a: Action) =>
    a.kind === 'gig' ? state.applications.some(x => x.gigId === a.id) : a.kind === 'mentor' ? state.mentorRequests.includes(a.id) : state.courses.includes(a.id)
  const seen = new Map<string, Action>()
  for (const g of gaps(state)) for (const a of actionsFor(state, g.skill.id)) if (a.reach >= 2 && !taken(a)) seen.set(a.kind + a.id, a)
  return [...seen.values()].sort((a, b) => b.reach - a.reach || b.spans - a.spans)
}

export interface Task { id: string; title: string; detail: string; path: string; cta: string; due?: string }

const dueSoon = `Due in ${DUE_IN_DAYS} days`

/** Whether a first-visit step (the client's `startHere`) is done. Only some steps can be finished in the prototype. */
export const startStepDone = (state: State, id: ItemId) => (id === 'about' ? state.aboutDone : id === 'skills' ? state.assessmentDone : false)

/** Everything waiting on you, most urgent first. The first is the one next step. */
export function tasks(state: State, tenant: Tenant): Task[] {
  const t = (id: Parameters<typeof term>[1], n?: number) => term(tenant, id, n)
  const manager = person.manager.split(' ')[0]
  const out: Task[] = []
  if (state.mode === 'leader') {
    const waiting = reports.filter(r => r.dueSkills.some(sk => !state.teamRatings[r.id]?.[sk]))
    if (waiting.length)
      out.push({ id: 'team', title: `Rate ${t('skill')} for ${waiting.length} ${waiting.length === 1 ? 'person' : 'people'}`, detail: `For your team’s ${t('review', 1)} cycle.`, path: '/team/reviews', cta: 'Start rating', due: dueSoon })
  }
  // First visit: the client's rollout order.
  if (state.mode === 'first') {
    for (const id of tenant.startHere) {
      const it = resolveItem(tenant, id)
      if (!it || startStepDone(state, id)) continue
      if (id === 'about') out.push({ id, title: 'Start with what matters to you at work', detail: 'Two minutes on your values. They shape every suggestion after it.', path: it.path, cta: 'Start' })
      else if (id === 'skills') out.push({ id, due: dueSoon, title: `Rate your ${t('skill')}`, detail: `${skills.length} ${t('skill')} for ${person.role}. About 8 minutes, and you can stop any time.`, path: it.path, cta: 'Start rating' })
      else out.push({ id, title: `Look around ${it.label}`, detail: it.description + '.', path: it.path, cta: `Open ${it.label.toLowerCase()}` })
    }
  } else if (!state.assessmentDone) {
    const n = needsAttention(state).length
    out.push({ id: 'skills', due: dueSoon, title: `Update your ${t('skill')}`, detail: `${n} must be updated.`, path: '/growth/skills', cta: `Review ${n} ${t('skill', n)}` })
  }
  // Profile lives in the account menu; it's a task only while it's unfinished.
  const about = resolveItem(tenant, 'about')
  if (about && !state.aboutDone && !out.some(x => x.id === 'about'))
    out.push({ id: 'about', title: 'Tell us what matters to you at work', detail: 'Two minutes on your values. They shape every suggestion.', path: about.path, cta: 'Start' })
  const untold = state.applications.find(a => !a.managerTold)
  if (untold)
    out.push({ id: 'tell', title: `Tell ${manager} about your application`, detail: `You said you’d let ${manager} know. ${cap(t('gig', 1))} owners often check with your manager first.`, path: '/#plan', cta: `Open your ${t('plan', 1)}` })
  return out
}
