import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { skills, type Level } from './data'
import { TENANTS, type TenantConfig, type Role } from './ia'

/** How someone is using Fuel50 today. Drives Home and guidance, never the structure. */
export type VisitMode = 'first' | 'returner' | 'leader'

export interface Origin { label: string; path: string }
export interface Toast { id: number; text: string; link?: { label: string; path: string } }

export interface State {
  tenantId: string
  mode: VisitMode
  ratings: Record<string, Level | null>
  assessmentDone: boolean
  applications: { gigId: string; status: 'Under review' }[]
  mentorRequests: string[]
  courses: string[]
  goals: string[]
  aboutDone: boolean
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
  origin: null,
  lastAction: { label: 'Saved the “Sales leadership” career path', path: '/explore/paths' },
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
  | { type: 'apply'; gigId: string; title: string }
  | { type: 'requestMentor'; id: string; name: string }
  | { type: 'addCourse'; id: string; title: string }
  | { type: 'addGoal'; text: string }
  | { type: 'completeAbout' }
  | { type: 'setOrigin'; origin: Origin | null }
  | { type: 'rateReport'; reportId: string; skillId: string; level: Level }
  | { type: 'toggleGuidance' }
  | { type: 'dismissToast'; id: number }
  | { type: 'reset' }

let toastId = 1
const toast = (s: State, text: string, link?: Toast['link']): Toast[] => [...s.toasts, { id: toastId++, text, link }]

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'setTenant': return { ...s, tenantId: a.id }
    case 'setMode': {
      // Switching mode resets the journey so each mode starts clean.
      const fresh = initialState({ tenantId: s.tenantId, mode: a.mode })
      if (a.mode === 'first') return { ...fresh, aboutDone: false, lastAction: null }
      return fresh
    }
    case 'rate': return { ...s, ratings: { ...s.ratings, [a.skillId]: a.level } }
    case 'completeAssessment':
      return { ...s, assessmentDone: true, lastAction: { label: 'Updated your skills', path: '/growth/skills' } }
    case 'apply':
      if (s.applications.some(x => x.gigId === a.gigId)) return s
      return {
        ...s,
        applications: [...s.applications, { gigId: a.gigId, status: 'Under review' }],
        lastAction: { label: `Applied for “${a.title}”`, path: `/explore/gigs/${a.gigId}` },
        toasts: toast(s, `Applied for “${a.title}”. It’s in your plan.`, { label: 'View my plan', path: '/growth/plan' }),
      }
    case 'requestMentor':
      if (s.mentorRequests.includes(a.id)) return s
      return {
        ...s,
        mentorRequests: [...s.mentorRequests, a.id],
        lastAction: { label: `Asked ${a.name} to mentor you`, path: '/explore/mentors' },
        toasts: toast(s, `Request sent to ${a.name}. It’s in your plan.`, { label: 'View my plan', path: '/growth/plan' }),
      }
    case 'addCourse':
      if (s.courses.includes(a.id)) return s
      return {
        ...s,
        courses: [...s.courses, a.id],
        lastAction: { label: `Added “${a.title}” to your plan`, path: '/explore/learning' },
        toasts: toast(s, `“${a.title}” added to your plan.`, { label: 'View my plan', path: '/growth/plan' }),
      }
    case 'addGoal': return { ...s, goals: [...s.goals, a.text], toasts: toast(s, 'Goal added to your plan.') }
    case 'completeAbout': return { ...s, aboutDone: true, toasts: toast(s, 'Saved. Next: rate your skills.', { label: 'Rate my skills', path: '/growth/skills' }) }
    case 'setOrigin': return { ...s, origin: a.origin }
    case 'rateReport':
      return { ...s, teamRatings: { ...s.teamRatings, [a.reportId]: { ...(s.teamRatings[a.reportId] ?? {}), [a.skillId]: a.level } } }
    case 'toggleGuidance': return { ...s, guidanceHidden: !s.guidanceHidden }
    case 'dismissToast': return { ...s, toasts: s.toasts.filter(t => t.id !== a.id) }
    case 'reset': return initialState({ tenantId: s.tenantId, mode: s.mode, ...(s.mode === 'first' ? { aboutDone: false, lastAction: null } : {}) })
  }
}

const KEY = 'fuel50-proto-v1'

interface Ctx { state: State; dispatch: React.Dispatch<Action>; tenant: TenantConfig; role: Role }
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
  const tenant = TENANTS.find(t => t.id === state.tenantId) ?? TENANTS[0]
  const role: Role = state.mode === 'leader' ? 'leader' : 'employee'
  const value = useMemo(() => ({ state, dispatch, tenant, role }), [state, tenant, role])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}
