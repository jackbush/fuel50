import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { LAST_VISIT, TODAY, paths, person, skills, type Level } from './data'
import { TENANTS, resolveTenant, type Tenant, type Role } from './ia'
import { useTweaks } from './tweaks'

/** How someone is using Fuel50 today. Drives Home and tasks, never the structure. */
export type VisitMode = 'first' | 'returner' | 'leader'

export interface Origin { label: string; path: string }
export interface Toast { id: number; text: string; link?: { label: string; path: string } }

export interface State {
  tenantId: string
  mode: VisitMode
  ratings: Record<string, Level | null>
  assessmentDone: boolean
  applications: { gigId: string; status: 'Under review'; managerTold: boolean }[]
  mentorRequests: string[]
  /** Your saved career path. Its second step is your target role. */
  pathId: string
  courses: string[]
  /** Hours done on courses you've started. */
  courseProgress: Record<string, number>
  aboutDone: boolean
  values: string[]
  origin: Origin | null
  /** When anything in your plan last changed; null before you've started one. */
  planUpdated: string | null
  guidanceHidden: boolean
  teamRatings: Record<string, Record<string, Level>>
  toasts: Toast[]
}

const initialRatings = () => Object.fromEntries(skills.map(s => [s.id, s.lastRating])) as Record<string, Level | null>

export const initialState = (keep?: Partial<State>): State => ({
  tenantId: 'default',
  mode: 'returner',
  ratings: initialRatings(),
  assessmentDone: false,
  applications: [],
  mentorRequests: [],
  pathId: paths[0].id,
  courses: ['first-time-leader'],
  courseProgress: { 'first-time-leader': 2 },
  aboutDone: true,
  values: ['Making an impact', 'Learning new things', 'Autonomy'],
  origin: null,
  planUpdated: LAST_VISIT,
  guidanceHidden: false,
  teamRatings: {},
  toasts: [],
  ...keep,
})

type Action =
  | { type: 'setTenant'; id: string }
  | { type: 'setPath'; id: string }
  | { type: 'setMode'; mode: VisitMode }
  | { type: 'rate'; skillId: string; level: Level }
  | { type: 'completeAssessment' }
  | { type: 'apply'; gigId: string; title: string; managerTold: boolean }
  | { type: 'markTold'; gigId: string }
  | { type: 'requestMentor'; id: string; name: string }
  | { type: 'addCourse'; id: string; title: string }
  | { type: 'completeAbout'; values: string[] }
  | { type: 'setOrigin'; origin: Origin | null }
  | { type: 'rateReport'; reportId: string; skillId: string; level: Level }
  | { type: 'toggleGuidance' }
  | { type: 'dismissToast'; id: number }
  /** A control for something out of the prototype's scope: say so instead of doing nothing. */
  | { type: 'notInPrototype'; what: string }
  | { type: 'reset' }

/** A first visit has nothing to carry over. */
const firstVisit = (keep: Partial<State>) =>
  initialState({ ...keep, mode: 'first', aboutDone: false, values: [], courses: [], courseProgress: {}, planUpdated: null, ratings: Object.fromEntries(skills.map(s => [s.id, null])) })

let toastId = 1
const toast = (s: State, text: string, link?: Toast['link']): Toast[] => [...s.toasts, { id: toastId++, text, link }]

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'setTenant': return { ...s, tenantId: a.id }
    case 'setPath': {
      const p = paths.find(x => x.id === a.id)
      if (!p || p.id === s.pathId) return s
      return { ...s, pathId: p.id, planUpdated: TODAY, toasts: toast(s, `Saved. Your target {role.one} is now ${p.steps[1]}.`, { label: 'See what to develop', path: '/#develop-h' }) }
    }
    case 'setMode': {
      // Switching mode resets the journey so each mode starts clean.
      if (a.mode === 'first') return firstVisit({ tenantId: s.tenantId })
      return initialState({ tenantId: s.tenantId, mode: a.mode })
    }
    case 'rate': return { ...s, ratings: { ...s.ratings, [a.skillId]: a.level } }
    case 'completeAssessment':
      return {
        ...s, assessmentDone: true,
        toasts: toast(s, `Sent to ${person.manager}. Your {skill.many} are up to date.`),
      }
    case 'apply':
      if (s.applications.some(x => x.gigId === a.gigId)) return s
      return {
        ...s,
        applications: [...s.applications, { gigId: a.gigId, status: 'Under review', managerTold: a.managerTold }],
        planUpdated: TODAY,
        toasts: toast(s, `Applied for “${a.title}”. It’s in your {plan.one}.`, { label: 'View', path: '/#plan' }),
      }
    case 'markTold':
      return {
        ...s,
        applications: s.applications.map(x => (x.gigId === a.gigId ? { ...x, managerTold: true } : x)),
        toasts: toast(s, `Noted. ${person.manager.split(' ')[0]} knows about it.`),
      }
    case 'requestMentor':
      if (s.mentorRequests.includes(a.id)) return s
      return {
        ...s,
        mentorRequests: [...s.mentorRequests, a.id],
        planUpdated: TODAY,
        toasts: toast(s, `Request sent to ${a.name}. It’s in your {plan.one}.`, { label: 'View', path: '/#plan' }),
      }
    case 'addCourse':
      if (s.courses.includes(a.id)) return s
      return {
        ...s,
        courses: [...s.courses, a.id],
        planUpdated: TODAY,
        toasts: toast(s, `“${a.title}” added to your {plan.one}.`, { label: 'View', path: '/#plan' }),
      }
    case 'completeAbout': return { ...s, aboutDone: true, values: a.values, toasts: toast(s, 'Saved. Next: rate your {skill.many}.', { label: 'Rate now', path: '/growth/skills' }) }
    case 'setOrigin': return { ...s, origin: a.origin }
    case 'rateReport':
      return { ...s, teamRatings: { ...s.teamRatings, [a.reportId]: { ...(s.teamRatings[a.reportId] ?? {}), [a.skillId]: a.level } } }
    case 'toggleGuidance': return { ...s, guidanceHidden: !s.guidanceHidden }
    case 'dismissToast': return { ...s, toasts: s.toasts.filter(t => t.id !== a.id) }
    case 'notInPrototype': return { ...s, toasts: toast(s, `${a.what} aren’t part of this prototype.`) }
    case 'reset': {
      const keep = { tenantId: s.tenantId }
      return s.mode === 'first' ? firstVisit(keep) : initialState({ ...keep, mode: s.mode })
    }
  }
}

const KEY = 'fuel50-proto-v4' // v4: saved path, plan date and course progress

interface Ctx { state: State; dispatch: React.Dispatch<Action>; tenant: Tenant; role: Role }
const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved) return { ...initialState(), ...JSON.parse(saved), toasts: [], origin: null } as State
    } catch { /* storage unavailable */ }
    return initialState()
  })
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ ...state, toasts: [] })) } catch { /* ignore */ }
  }, [state])
  const { content } = useTweaks()
  const config = TENANTS.find(t => t.id === state.tenantId) ?? TENANTS[0]
  const tenant = useMemo(() => resolveTenant(config, content), [config, content])
  const role: Role = state.mode === 'leader' ? 'leader' : 'employee'
  const value = useMemo(() => ({ state, dispatch, tenant, role }), [state, tenant, role])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}
