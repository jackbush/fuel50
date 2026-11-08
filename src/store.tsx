import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { person, skills, type Level } from './data'
import { TENANTS, resolveTenant, type Tenant, type Role } from './ia'
import { useTweaks } from './tweaks'

/** How someone is using Fuel50 today. Drives Home and guidance, never the structure. */
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
  courses: string[]
  goals: string[]
  aboutDone: boolean
  values: string[]
  origin: Origin | null
  lastAction: { label: string; path: string } | null
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
  courses: [],
  goals: [],
  aboutDone: true,
  values: ['Making an impact', 'Learning new things', 'Autonomy'],
  origin: null,
  // Labels may hold {term} placeholders; they're filled with the client's words when shown.
  lastAction: { label: 'Saved the “Sales leadership” career {path.one}', path: '/explore/paths' },
  guidanceHidden: false,
  teamRatings: {},
  toasts: [],
  ...keep,
})

type Action =
  | { type: 'setTenant'; id: string }
  | { type: 'setMode'; mode: VisitMode }
  | { type: 'rate'; skillId: string; level: Level }
  | { type: 'completeAssessment' }
  | { type: 'apply'; gigId: string; title: string; managerTold: boolean }
  | { type: 'markTold'; gigId: string }
  | { type: 'requestMentor'; id: string; name: string }
  | { type: 'addCourse'; id: string; title: string }
  | { type: 'addGoal'; text: string }
  | { type: 'completeAbout'; values: string[] }
  | { type: 'setOrigin'; origin: Origin | null }
  | { type: 'rateReport'; reportId: string; skillId: string; level: Level }
  | { type: 'toggleGuidance' }
  | { type: 'dismissToast'; id: number }
  | { type: 'reset' }

/** A first visit has nothing to carry over. */
const firstVisit = (keep: Partial<State>) =>
  initialState({ ...keep, mode: 'first', aboutDone: false, values: [], lastAction: null, ratings: Object.fromEntries(skills.map(s => [s.id, null])) })

let toastId = 1
const toast = (s: State, text: string, link?: Toast['link']): Toast[] => [...s.toasts, { id: toastId++, text, link }]

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'setTenant': return { ...s, tenantId: a.id }
    case 'setMode': {
      // Switching mode resets the journey so each mode starts clean.
      if (a.mode === 'first') return firstVisit({ tenantId: s.tenantId })
      return initialState({ tenantId: s.tenantId, mode: a.mode })
    }
    case 'rate': return { ...s, ratings: { ...s.ratings, [a.skillId]: a.level } }
    case 'completeAssessment':
      return {
        ...s, assessmentDone: true,
        lastAction: { label: 'Updated your {skill.many}', path: '/growth/skills' },
        toasts: toast(s, `Sent to ${person.manager}. Your {skill.many} are up to date.`),
      }
    case 'apply':
      if (s.applications.some(x => x.gigId === a.gigId)) return s
      return {
        ...s,
        applications: [...s.applications, { gigId: a.gigId, status: 'Under review', managerTold: a.managerTold }],
        lastAction: { label: `Applied for “${a.title}”`, path: `/explore/gigs/${a.gigId}` },
        toasts: toast(s, `Applied for “${a.title}”. It’s in your {plan.one}.`, { label: 'View', path: '/growth/plan' }),
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
        lastAction: { label: `Asked ${a.name} to be your {mentor.one}`, path: '/explore/mentors' },
        toasts: toast(s, `Request sent to ${a.name}. It’s in your {plan.one}.`, { label: 'View', path: '/growth/plan' }),
      }
    case 'addCourse':
      if (s.courses.includes(a.id)) return s
      return {
        ...s,
        courses: [...s.courses, a.id],
        lastAction: { label: `Added “${a.title}” to your {plan.one}`, path: '/explore/learning' },
        toasts: toast(s, `“${a.title}” added to your {plan.one}.`, { label: 'View', path: '/growth/plan' }),
      }
    case 'addGoal':
      if (s.goals.includes(a.text)) return s
      return { ...s, goals: [...s.goals, a.text], toasts: toast(s, 'Goal added to your {plan.one}.', { label: 'View', path: '/growth/plan' }) }
    case 'completeAbout': return { ...s, aboutDone: true, values: a.values, toasts: toast(s, 'Saved. Next: rate your {skill.many}.', { label: 'Rate now', path: '/growth/skills' }) }
    case 'setOrigin': return { ...s, origin: a.origin }
    case 'rateReport':
      return { ...s, teamRatings: { ...s.teamRatings, [a.reportId]: { ...(s.teamRatings[a.reportId] ?? {}), [a.skillId]: a.level } } }
    case 'toggleGuidance': return { ...s, guidanceHidden: !s.guidanceHidden }
    case 'dismissToast': return { ...s, toasts: s.toasts.filter(t => t.id !== a.id) }
    case 'reset': return s.mode === 'first' ? firstVisit({ tenantId: s.tenantId }) : initialState({ tenantId: s.tenantId, mode: s.mode })
  }
}

const KEY = 'fuel50-proto-v2' // v2: applications record whether the manager knows

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
