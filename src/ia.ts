/**
 * The information architecture model.
 *
 * Principle: structure is fixed, names are the client's.
 * - SPACES are fixed. A client can rename a space but not remove it.
 * - ITEMS have a canonical id. A client can rename, hide and reorder items.
 * - TERMS are the key nouns (skill, gig, mentor…). Ids are internal and stay in
 *   URLs; the words come from `content.json`, then the client's renames. Item
 *   labels and descriptions are templates over terms (`Target {role.many}`), so
 *   renaming a noun once changes nav, titles, search, next steps and copy.
 * - Nav, search, breadcrumbs and next steps all read items through `resolveItem`,
 *   so a renamed or hidden item behaves consistently everywhere.
 */

import contentJson from './content.json'

export type SpaceId = 'home' | 'explore' | 'team' | 'admin'
export type Audience = 'everyone' | 'leader' | 'admin'

export type ItemId =
  | 'home'
  | 'skills' | 'targets' | 'plan' | 'about'
  | 'explore-overview' | 'paths' | 'gigs' | 'mentors' | 'learning' | 'vacancies'
  | 'team' | 'reviews' | 'mentees'
  | 'admin'

export type TermId = keyof typeof contentJson.terms
/** Singular and plural. */
export type Term = [one: string, many: string]
export interface Content { spaces: Record<SpaceId, string>; terms: Record<TermId, Term> }
/** The default vocabulary. Typed against the structure, so a missing space or term fails the build. */
export const CONTENT: Content = contentJson satisfies { spaces: Record<SpaceId, string>; terms: Record<TermId, string[]> } as Content
export const TERM_IDS = Object.keys(CONTENT.terms) as TermId[]

export interface ItemDef {
  id: ItemId
  space: SpaceId
  /** Template: `{skill.many}`, `{role.one}`, `{space.home}`. The first letter is capitalised. */
  label: string
  path: string
  description: string
  synonyms: string[] // other names people (and other clients) use
}

export interface SpaceDef {
  id: SpaceId
  blurb: string
  audience: Audience
  path: string
}

export const SPACES: SpaceDef[] = [
  { id: 'home', blurb: 'Everything that’s yours, and what’s next', audience: 'everyone', path: '/' },
  { id: 'explore', blurb: 'What you could do next', audience: 'everyone', path: '/explore' },
  { id: 'team', blurb: 'People you look after', audience: 'leader', path: '/team' },
  { id: 'admin', blurb: 'Configuration and reporting', audience: 'admin', path: '/admin' },
]

/** Tools taken out of employees’ menus and moved to Admin. The Admin page lists them; search finds Admin by their names. */
export const ADMIN_TOOLS = [
  { name: 'Skills Studio', does: 'Build and maintain your organisation’s skills library' },
  { name: 'Talent Blueprint', does: 'Define roles and the skills each one needs' },
  { name: 'Role Editor', does: 'Edit individual role profiles' },
  { name: 'Reports and analytics', does: 'Skills, engagement and mobility insight across the organisation' },
]

export const ITEMS: ItemDef[] = [
  { id: 'home', space: 'home', label: 'Overview', path: '/', description: 'Your summary, what’s due and one next step', synonyms: ['dashboard', 'start', 'my growth'] },

  { id: 'skills', space: 'home', label: '{skill.many}', path: '/growth/skills', description: 'Rate your {skill.many} and ask for feedback', synonyms: ['talents', 'top skills', 'competencies', 'capabilities', 'assessment', 'self-assessment', 'rate my skills', 'feedback'] },
  { id: 'targets', space: 'home', label: 'Target {role.many}', path: '/growth/targets', description: '{role.many} you’re aiming for and how close you are', synonyms: ['target roles', 'aspirations', 'next role', 'career goals'] },
  { id: 'plan', space: 'home', label: '{plan.one}', path: '/growth/plan', description: 'Saved {path.many}, applications, {mentor.many}, learning and goals', synonyms: ['my plan', 'development plan', 'my stuff', 'applications', 'saved', 'idp', 'goals'] },
  { id: 'about', space: 'home', label: 'About me', path: '/growth/about', description: 'Your values, strengths and work style', synonyms: ['profile', 'my profile', 'personalize', 'personalise', 'reflect', 'values', 'fuelvalues', 'career engagers', 'work style', 'fuelfit', 'agility'] },

  { id: 'explore-overview', space: 'explore', label: 'Overview', path: '/explore', description: 'Everything you could do next, matched to your {skill.many}', synonyms: ['opportunities', 'explore', 'browse'] },
  { id: 'paths', space: 'explore', label: 'Career {path.many}', path: '/explore/paths', description: 'Where your {skill.many} could take you', synonyms: ['journeys', 'career journeys', 'moves', 'roles'] },
  { id: 'gigs', space: 'explore', label: '{gig.many}', path: '/explore/gigs', description: 'Short projects to grow or share your {skill.many}', synonyms: ['projects', 'stretch assignments', 'marketplace', 'gig marketplace'] },
  { id: 'mentors', space: 'explore', label: '{mentor.many}', path: '/explore/mentors', description: 'People who can help you grow a {skill.one}', synonyms: ['coach', 'coaching', 'mentoring', 'mentor hub'] },
  { id: 'learning', space: 'explore', label: 'Learning', path: '/explore/learning', description: '{course.many} and resources for your {skill.many}', synonyms: ['learn+', 'learn', 'courses', 'training'] },
  { id: 'vacancies', space: 'explore', label: '{vacancy.many}', path: '/explore/vacancies', description: 'Open {role.many} in the organisation', synonyms: ['jobs', 'open roles', 'internal jobs'] },

  { id: 'team', space: 'team', label: 'Overview', path: '/team', description: 'Your reports and what they need from you', synonyms: ['team view', 'leader view', 'team coach', 'my reports'] },
  { id: 'reviews', space: 'team', label: '{skill.one} ratings', path: '/team/reviews', description: 'Rate your reports’ {skill.many} for the {review.one} cycle', synonyms: ['reviews', 'reviews and ratings', 'rate team', 'performance', 'evaluations', 'fuelfactors'] },
  { id: 'mentees', space: 'team', label: '{mentee.many}', path: '/team/mentees', description: 'People you mentor', synonyms: ['my mentees'] },

  { id: 'admin', space: 'admin', label: 'Admin', path: '/admin', description: 'Skills Studio, Talent Blueprint, Role Editor and reports', synonyms: ['configuration', 'settings', 'reports', 'analytics', 'insights', ...ADMIN_TOOLS.map(t => t.name.toLowerCase())] },
]

/** A client's configuration of the fixed structure. */
export interface TenantConfig {
  id: string
  name: string
  note: string
  spaceLabels: Partial<Record<SpaceId, string>>
  /** Renamed nouns. These flow into every item label and line of copy that uses them. */
  terms: Partial<Record<TermId, Term>>
  /** Rare per-item overrides, for when a client's page name isn't just its noun. */
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
    terms: {},
    itemLabels: {},
    hidden: [],
    order: {},
    startHere: ['about', 'skills', 'paths'],
  },
  {
    id: 'northbank',
    name: 'Northbank (renamed)',
    note: 'A bank that renames items, hides Vacancies and reorders Explore',
    spaceLabels: { explore: 'Opportunities' },
    terms: { skill: ['talent', 'talents'], mentor: ['coach', 'coaches'], path: ['journey', 'journeys'], plan: ['development plan', 'development plans'] },
    itemLabels: { mentors: 'Coach', paths: 'Journeys', plan: 'Development plan', about: 'Personalize', learning: 'Learn+' },
    hidden: ['vacancies'],
    order: { explore: ['explore-overview', 'gigs', 'mentors', 'paths', 'learning', 'vacancies'] },
    startHere: ['skills', 'about', 'gigs'],
  },
]

/** A client config with its full vocabulary filled in: defaults, then the client's renames. */
export interface Tenant extends Omit<TenantConfig, 'spaceLabels' | 'terms'> {
  spaceLabels: Record<SpaceId, string>
  terms: Record<TermId, Term>
}

export function resolveTenant(config: TenantConfig, content: Content = CONTENT): Tenant {
  return {
    ...config,
    spaceLabels: { ...content.spaces, ...config.spaceLabels },
    terms: { ...content.terms, ...config.terms },
  }
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** The word for a term: plural unless `n` is 1. */
export const term = (t: Pick<Tenant, 'terms'>, id: TermId, n = 2) => t.terms[id][n === 1 ? 0 : 1]

/** “a gig”, “an expert”. Good enough for English labels; localisation needs real grammar. */
export const withArticle = (word: string) => (/^[aeiou]/i.test(word) ? 'an ' : 'a ') + word

/** Fill `{skill.many}` / `{role.one}` / `{space.home}` placeholders from a vocabulary. */
export function fill(template: string, t: Pick<Tenant, 'terms' | 'spaceLabels'>): string {
  return template.replace(/\{(\w+)\.(\w+)\}/g, (_, a: string, b: string) =>
    a === 'space' ? t.spaceLabels[b as SpaceId] : t.terms[a as TermId][b === 'one' ? 0 : 1])
}

const label = (template: string, t: Pick<Tenant, 'terms' | 'spaceLabels'>) => cap(fill(template, t))
const CANONICAL = resolveTenant({ id: '', name: '', note: '', spaceLabels: {}, terms: {}, itemLabels: {}, hidden: [], order: {}, startHere: [] })

export interface ResolvedItem extends ItemDef {
  label: string
  canonicalLabel: string
}

export function resolveItem(tenant: Tenant, id: ItemId): ResolvedItem | null {
  const def = ITEMS.find(i => i.id === id)
  if (!def || tenant.hidden.includes(id)) return null
  return {
    ...def,
    canonicalLabel: label(def.label, CANONICAL),
    label: tenant.itemLabels[id] ?? label(def.label, tenant),
    description: label(def.description, tenant),
  }
}

export function spaceLabel(tenant: Tenant, id: SpaceId): string {
  return tenant.spaceLabels[id]
}

export function itemsInSpace(tenant: Tenant, space: SpaceId): ResolvedItem[] {
  const ids = tenant.order[space] ?? ITEMS.filter(i => i.space === space).map(i => i.id)
  return ids.map(id => resolveItem(tenant, id)).filter((x): x is ResolvedItem => !!x)
}

/** A space's own page: the item at the space's path. Its title and breadcrumb are the space's name. */
export const isLanding = (item: Pick<ItemDef, 'space' | 'path'>) => SPACES.find(s => s.id === item.space)?.path === item.path

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
