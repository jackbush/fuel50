/**
 * Derived state: what needs attention, readiness for the target role, and the
 * single suggested next step. Keep this the only place that decides “what next”,
 * so Home, the nav pill and end-of-task panels always agree.
 */
import { courses, gigs, mentors, reports, skills, targetRole, DUE_DATE, type Level, type Skill } from './data'
import { resolveItem, type TenantConfig, type ItemId } from './ia'
import type { State } from './store'

export function needsAttention(state: State): Skill[] {
  return skills.filter(s => s.change || state.ratings[s.id] === null)
}

export interface Gap { skill: Skill; current: Level; target: Level; size: number }

export function gaps(state: State): Gap[] {
  return skills
    .map(s => {
      const current = (state.ratings[s.id] ?? 0) as Level
      return { skill: s, current, target: s.target, size: s.target - current }
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

export interface NextStep { title: string; detail: string; path: string; cta: string }

const label = (t: TenantConfig, id: ItemId, fallback: string) => resolveItem(t, id)?.label ?? fallback

export function nextStep(state: State, tenant: TenantConfig): NextStep {
  if (state.mode === 'leader') {
    const due = reports.filter(r => r.dueSkills.some(sk => !state.teamRatings[r.id]?.[sk]))
    if (due.length)
      return { title: `Rate skills for ${due.length} ${due.length === 1 ? 'person' : 'people'}`, detail: `Due ${DUE_DATE} for your team’s review cycle.`, path: '/team/reviews', cta: 'Start rating' }
  }
  if (state.mode === 'first' && !state.aboutDone) {
    const about = label(tenant, 'about', 'About me')
    return { title: 'Start with what matters to you at work', detail: `A 5-minute exercise in ${about}. It shapes every suggestion after it.`, path: '/growth/about', cta: 'Start' }
  }
  if (!state.assessmentDone) {
    const n = needsAttention(state).length
    const sk = label(tenant, 'skills', 'Skills').toLowerCase()
    return { title: `Confirm your ${sk} by ${DUE_DATE}`, detail: `${n} need${n === 1 ? 's' : ''} your attention; the rest carry over from last time.`, path: '/growth/skills', cta: 'Review' }
  }
  const top = gaps(state)[0]
  if (top) {
    const opts = optionsForSkill(top.skill.id)
    const acted =
      state.applications.some(a => opts.gigs.some(g => g.id === a.gigId)) ||
      state.mentorRequests.some(m => opts.mentors.some(x => x.id === m)) ||
      state.courses.some(c => opts.courses.some(x => x.id === c))
    if (!acted)
      return {
        title: `Grow ${top.skill.name}`,
        detail: `Your biggest gap for ${targetRole.title}. ${opts.gigs.length} gigs, ${opts.mentors.length} mentor${opts.mentors.length === 1 ? '' : 's'}, ${opts.courses.length} courses match.`,
        path: `/growth/targets#gap-${top.skill.id}`,
        cta: 'See options',
      }
  }
  if (state.applications.length)
    return { title: 'Tell your manager about your application', detail: 'Gig owners often check with your manager. A quick heads-up helps.', path: '/growth/plan', cta: 'Open my plan' }
  return { title: 'You’re up to date', detail: 'Explore what else your skills could lead to.', path: '/explore/paths', cta: 'Explore paths' }
}
