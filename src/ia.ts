/**
 * The information architecture model.
 *
 * Principle: structure is fixed, names are the client's.
 * - SPACES are fixed. A client can rename a space but not remove it.
 * - ITEMS have a canonical id. A client can rename, hide and reorder items.
 * - Nav, search, breadcrumbs and next steps all read items through `resolveItem`,
 *   so a renamed or hidden item behaves consistently everywhere.
 */

export type SpaceId = 'home' | 'growth' | 'explore' | 'team' | 'admin'
export type Audience = 'everyone' | 'leader' | 'admin'

export type ItemId =
  | 'home'
  | 'growth-overview' | 'skills' | 'targets' | 'plan' | 'about'
  | 'paths' | 'gigs' | 'mentors' | 'learning' | 'vacancies'
  | 'team' | 'reviews' | 'mentees'
  | 'admin'

export interface ItemDef {
  id: ItemId
  space: SpaceId
  label: string // canonical default label
  path: string
  description: string
  synonyms: string[] // other names people (and other clients) use
}

export interface SpaceDef {
  id: SpaceId
  label: string
  blurb: string
  audience: Audience
  path: string
}

export const SPACES: SpaceDef[] = [
  { id: 'home', label: 'Home', blurb: 'Where you left off and what’s next', audience: 'everyone', path: '/' },
  { id: 'growth', label: 'My growth', blurb: 'Everything that’s yours', audience: 'everyone', path: '/growth' },
  { id: 'explore', label: 'Explore', blurb: 'What you could do next', audience: 'everyone', path: '/explore/gigs' },
  { id: 'team', label: 'My team', blurb: 'People you look after', audience: 'leader', path: '/team' },
  { id: 'admin', label: 'Admin', blurb: 'Configuration and reporting', audience: 'admin', path: '/admin' },
]

export const ITEMS: ItemDef[] = [
  { id: 'home', space: 'home', label: 'Home', path: '/', description: 'Your summary, what’s due and one next step', synonyms: ['dashboard', 'start'] },

  { id: 'growth-overview', space: 'growth', label: 'Overview', path: '/growth', description: 'A summary of everything that’s yours', synonyms: ['profile', 'my profile'] },
  { id: 'skills', space: 'growth', label: 'Skills', path: '/growth/skills', description: 'Rate your skills and ask for feedback', synonyms: ['talents', 'top skills', 'competencies', 'capabilities', 'assessment', 'self-assessment', 'rate my skills', 'feedback'] },
  { id: 'targets', space: 'growth', label: 'Target roles', path: '/growth/targets', description: 'Roles you’re aiming for and how close you are', synonyms: ['target roles', 'goals', 'aspirations', 'next role'] },
  { id: 'plan', space: 'growth', label: 'My plan', path: '/growth/plan', description: 'Saved paths, applications, mentors, learning and goals', synonyms: ['development plan', 'my stuff', 'applications', 'saved', 'idp', 'goals'] },
  { id: 'about', space: 'growth', label: 'About me', path: '/growth/about', description: 'Your values, strengths and work style', synonyms: ['personalize', 'personalise', 'reflect', 'values', 'fuelvalues', 'career engagers', 'work style', 'fuelfit', 'agility'] },

  { id: 'paths', space: 'explore', label: 'Career paths', path: '/explore/paths', description: 'Where your skills could take you', synonyms: ['journeys', 'career journeys', 'moves', 'roles'] },
  { id: 'gigs', space: 'explore', label: 'Gigs', path: '/explore/gigs', description: 'Short projects to grow or share your skills', synonyms: ['projects', 'stretch assignments', 'opportunities', 'marketplace'] },
  { id: 'mentors', space: 'explore', label: 'Mentors', path: '/explore/mentors', description: 'People who can help you grow a skill', synonyms: ['coach', 'coaching', 'mentoring', 'mentor hub'] },
  { id: 'learning', space: 'explore', label: 'Learning', path: '/explore/learning', description: 'Courses and resources for your skills', synonyms: ['learn+', 'learn', 'courses', 'training'] },
  { id: 'vacancies', space: 'explore', label: 'Vacancies', path: '/explore/vacancies', description: 'Open roles in the organisation', synonyms: ['jobs', 'open roles', 'internal jobs'] },

  { id: 'team', space: 'team', label: 'Team', path: '/team', description: 'Your reports and what they need from you', synonyms: ['team view', 'leader view', 'team coach'] },
  { id: 'reviews', space: 'team', label: 'Reviews and ratings', path: '/team/reviews', description: 'Rate your reports’ skills', synonyms: ['rate team', 'performance', 'evaluations', 'fuelfactors'] },
  { id: 'mentees', space: 'team', label: 'Mentees', path: '/team/mentees', description: 'People you mentor', synonyms: ['my mentees'] },

  { id: 'admin', space: 'admin', label: 'Admin', path: '/admin', description: 'Skills Studio, blueprint, reports and configuration', synonyms: ['skills studio', 'talent blueprint', 'reports', 'analytics', 'insights'] },
]

/** A client's configuration of the fixed structure. */
export interface TenantConfig {
  id: string
  name: string
  note: string
  spaceLabels: Partial<Record<SpaceId, string>>
  itemLabels: Partial<Record<ItemId, string>>
  hidden: ItemId[]
  order: Partial<Record<SpaceId, ItemId[]>>
  /** Ordered “Start here” steps for first-time visitors, set by the client’s rollout stage. */
  startHere: ItemId[]
}

export const TENANTS: TenantConfig[] = [
  {
    id: 'default',
    name: 'Default labels',
    note: 'Fuel50’s canonical names',
    spaceLabels: {},
    itemLabels: {},
    hidden: [],
    order: {},
    startHere: ['about', 'skills', 'paths'],
  },
  {
    id: 'northbank',
    name: 'Northbank (renamed)',
    note: 'A bank that renames items, hides Vacancies and reorders Explore',
    spaceLabels: { growth: 'My development', explore: 'Opportunities' },
    itemLabels: { skills: 'Talents', mentors: 'Coach', paths: 'Journeys', plan: 'Development plan', about: 'Personalize', learning: 'Learn+' },
    hidden: ['vacancies'],
    order: { explore: ['gigs', 'mentors', 'paths', 'learning', 'vacancies'] },
    startHere: ['skills', 'about', 'gigs'],
  },
]

export interface ResolvedItem extends ItemDef {
  label: string
  canonicalLabel: string
}

export function resolveItem(tenant: TenantConfig, id: ItemId): ResolvedItem | null {
  const def = ITEMS.find(i => i.id === id)
  if (!def || tenant.hidden.includes(id)) return null
  return { ...def, canonicalLabel: def.label, label: tenant.itemLabels[id] ?? def.label }
}

export function spaceLabel(tenant: TenantConfig, id: SpaceId): string {
  return tenant.spaceLabels[id] ?? SPACES.find(s => s.id === id)!.label
}

export function itemsInSpace(tenant: TenantConfig, space: SpaceId): ResolvedItem[] {
  const ids = tenant.order[space] ?? ITEMS.filter(i => i.space === space).map(i => i.id)
  return ids.map(id => resolveItem(tenant, id)).filter((x): x is ResolvedItem => !!x)
}

export type Role = 'employee' | 'leader'

export function visibleSpaces(role: Role): SpaceDef[] {
  return SPACES.filter(s => s.audience === 'everyone' || (s.audience === 'leader' && role === 'leader'))
}

/** Find the item whose path best matches a pathname (longest prefix). */
export function itemForPath(pathname: string): ItemDef | undefined {
  return [...ITEMS]
    .filter(i => (i.path === '/' ? pathname === '/' : pathname === i.path || pathname.startsWith(i.path + '/')))
    .sort((a, b) => b.path.length - a.path.length)[0]
}
