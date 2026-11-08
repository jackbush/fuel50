/**
 * Mock data. Persona, role and target role come from the Fuel50 demo tenant
 * (Kimberley Thomas, Product Sales Manager → Senior Manager, Product Sales).
 * Everything else is illustrative sample content.
 */

export const TODAY = 'Monday 16 June'
export const LAST_VISIT = '12 December'
export const DUE_DATE = '24 June'
export const DUE_IN_DAYS = 8 // from TODAY

export const person = {
  name: 'Kimberley Thomas',
  first: 'Kimberley',
  role: 'Product Sales Manager',
  manager: 'Priya Shah',
  location: 'Wellington',
}

export const LEVELS = ['Not relevant to me', 'Basic', 'Skilled', 'Advanced', 'Expert'] as const
/** What each level means, shown while rating so nobody has to remember the scale. */
export const LEVEL_HELP = [
  'It isn’t part of your work',
  'You know the basics and still need guidance',
  'You do it well on your own',
  'You handle hard cases and help others',
  'People come to you; you shape how it’s done',
] as const
export type Level = 0 | 1 | 2 | 3 | 4

export interface Skill {
  id: string
  name: string
  description: string
  type: 'specialist' | 'strength' // “strength” = what some clients call talents
  lastRating: Level | null
  /** Why this skill needs attention since the last visit, if it does. */
  change?: 'new' | 'updated'
  /** Level needed for the target role. */
  target: Level
}

export const skills: Skill[] = [
  { id: 'product-knowledge', name: 'Product knowledge', description: 'Understanding our products, how they’re used and how they compare.', type: 'specialist', lastRating: 3, target: 3 },
  { id: 'sales-strategy', name: 'Sales strategy', description: 'Planning how to reach targets across accounts and segments.', type: 'specialist', lastRating: 2, target: 3 },
  { id: 'negotiation', name: 'Negotiation', description: 'Reaching agreements that work for the customer and for us.', type: 'specialist', lastRating: 3, target: 3 },
  { id: 'account-management', name: 'Account management', description: 'Growing long-term relationships with key customers.', type: 'specialist', lastRating: 3, target: 3 },
  { id: 'forecasting', name: 'Sales forecasting', description: 'Predicting revenue with enough accuracy to plan around.', type: 'specialist', lastRating: 2, target: 2 },
  { id: 'crm', name: 'CRM management', description: 'Keeping pipeline data accurate and useful.', type: 'specialist', lastRating: 3, target: 2 },
  { id: 'bizdev', name: 'Business development strategy', description: 'Finding and shaping new markets, partners and revenue streams.', type: 'specialist', lastRating: 1, target: 3 },
  { id: 'stakeholders', name: 'Stakeholder management', description: 'Keeping the right people informed and on side.', type: 'strength', lastRating: 3, target: 3 },
  { id: 'presenting', name: 'Presentation skills', description: 'Explaining ideas clearly to groups.', type: 'strength', lastRating: 3, target: 3 },
  { id: 'market-analysis', name: 'Market analysis', description: 'Reading market data to spot opportunities and threats.', type: 'specialist', lastRating: 2, target: 2 },
  { id: 'pricing', name: 'Pricing strategy', description: 'Setting prices that win business and protect margin.', type: 'specialist', lastRating: 2, target: 2 },
  { id: 'customer-insight', name: 'Customer insight', description: 'Understanding what customers need, even when they don’t say it.', type: 'strength', lastRating: 3, target: 3 },
  { id: 'leadership', name: 'Team leadership', description: 'Setting direction and helping a team do its best work.', type: 'strength', lastRating: 2, target: 3 },
  { id: 'coaching', name: 'Coaching others', description: 'Helping others grow through questions and feedback.', type: 'strength', lastRating: 2, target: 2 },
  { id: 'contracts', name: 'Contract management', description: 'Managing terms, renewals and obligations.', type: 'specialist', lastRating: 2, target: 2 },
  { id: 'data-decisions', name: 'Data-driven decision making', description: 'Using evidence, not instinct alone, to make calls.', type: 'strength', lastRating: null, change: 'new', target: 3 },
  { id: 'brand-marketing', name: 'Brand marketing', description: 'Building how customers see and feel about a brand. Now includes digital channels.', type: 'specialist', lastRating: 1, change: 'updated', target: 2 },
  { id: 'change', name: 'Change management', description: 'Helping people through new ways of working.', type: 'strength', lastRating: null, target: 2 },
]

/**
 * Each skill's `target` is what Senior Manager, Product Sales needs. Other roles a path
 * leads to differ on a few skills; everything else is the same.
 */
export const ROLE_TARGETS: Record<string, Partial<Record<string, Level>>> = {
  'Partnerships Manager': { bizdev: 4, negotiation: 4, 'market-analysis': 3, 'data-decisions': 2, 'brand-marketing': 1 },
  'Product Marketing Manager': { 'brand-marketing': 3, 'market-analysis': 3, 'customer-insight': 4, presenting: 4, 'product-knowledge': 4, 'sales-strategy': 2, bizdev: 2, leadership: 2, forecasting: 1 },
}

export interface Gig {
  id: string
  title: string
  owner: string
  team: string
  weeks: number
  hoursPerWeek: number
  summary: string
  have: string[] // skill ids you already have
  grow: string[] // skill ids you'd grow
  postedDaysAgo: number
}

export const gigs: Gig[] = [
  { id: 'apac-partners', title: 'Find three APAC channel partners', owner: 'Marcus Lee', team: 'Business Development', weeks: 8, hoursPerWeek: 4, summary: 'Shortlist and approach potential reseller partners in Australia and Singapore. You’ll build the case and lead first conversations.', have: ['negotiation', 'stakeholders'], grow: ['bizdev', 'market-analysis'], postedDaysAgo: 3 },
  { id: 'brand-refresh', title: 'Brand marketing project: product launch kit', owner: 'Ana Rodrigues', team: 'Marketing', weeks: 6, hoursPerWeek: 3, summary: 'Help marketing turn sales insight into a launch kit for the new product range.', have: ['product-knowledge', 'customer-insight'], grow: ['brand-marketing', 'bizdev'], postedDaysAgo: 9 },
  { id: 'pricing-review', title: 'Pricing review for SME accounts', owner: 'Tom Walsh', team: 'Finance', weeks: 4, hoursPerWeek: 5, summary: 'Model three pricing options for small-business accounts and test them with sales.', have: ['pricing', 'crm'], grow: ['data-decisions'], postedDaysAgo: 14 },
  { id: 'crm-cleanup', title: 'Pipeline data clean-up sprint', owner: 'Hannah Ng', team: 'Sales Operations', weeks: 2, hoursPerWeek: 6, summary: 'Two-week push to tidy pipeline data before the forecast cycle.', have: ['crm', 'forecasting'], grow: [], postedDaysAgo: 21 },
  { id: 'onboarding-buddies', title: 'Onboarding buddy for new sales hires', owner: 'Priya Shah', team: 'Sales', weeks: 12, hoursPerWeek: 1, summary: 'Be a go-to person for two new starters in their first three months.', have: ['coaching', 'product-knowledge'], grow: ['leadership'], postedDaysAgo: 5 },
]

export interface Mentor { id: string; name: string; role: string; skills: string[]; blurb: string }
export const mentors: Mentor[] = [
  { id: 'rawiri', name: 'Rawiri Te Ao', role: 'Head of Partnerships', skills: ['bizdev', 'negotiation'], blurb: 'Built our partner channel from scratch. Happy to meet monthly.' },
  { id: 'sofia', name: 'Sofia Marquez', role: 'Senior Sales Manager', skills: ['leadership', 'coaching'], blurb: 'Leads a team of 12. Likes helping first-time managers.' },
  { id: 'james', name: 'James Okafor', role: 'Insights Lead', skills: ['data-decisions', 'market-analysis'], blurb: 'Turns messy data into decisions.' },
  { id: 'ana', name: 'Ana Rodrigues', role: 'Brand Manager', skills: ['brand-marketing'], blurb: 'Runs our product launches.' },
]

export interface Course { id: string; title: string; provider: string; hours: number; skills: string[] }
export const courses: Course[] = [
  { id: 'bd-foundations', title: 'Business development foundations', provider: 'LinkedIn Learning', hours: 3, skills: ['bizdev'] },
  { id: 'partnerships', title: 'Building strategic partnerships', provider: 'Coursera', hours: 8, skills: ['bizdev', 'negotiation'] },
  { id: 'first-time-leader', title: 'From doing to leading', provider: 'Internal academy', hours: 6, skills: ['leadership', 'coaching'] },
  { id: 'data-stories', title: 'Making decisions with data', provider: 'Internal academy', hours: 2, skills: ['data-decisions'] },
  { id: 'brand-basics', title: 'Brand marketing for non-marketers', provider: 'LinkedIn Learning', hours: 2, skills: ['brand-marketing'] },
]

/** How many of each the whole organisation has. The prototype shows a matched handful. */
export const CATALOGUE = { gig: 433, mentor: 86, course: 1240 }

export interface Vacancy { id: string; title: string; team: string; location: string; closesInDays: number }
export const vacancies: Vacancy[] = [
  { id: 'v1', title: 'Senior Manager, Product Sales', team: 'Sales', location: 'Auckland', closesInDays: 18 },
  { id: 'v2', title: 'Partnerships Manager', team: 'Business Development', location: 'Wellington', closesInDays: 11 },
  { id: 'v3', title: 'Sales Operations Analyst', team: 'Sales Operations', location: 'Remote', closesInDays: 24 },
]

/** The first step is your role now; the second is the target role choosing the path sets. */
export interface CareerPath { id: string; title: string; steps: string[] }
export const paths: CareerPath[] = [
  { id: 'path-sales', title: 'Sales leadership', steps: ['Product Sales Manager', 'Senior Manager, Product Sales', 'Head of Sales'] },
  { id: 'path-partners', title: 'Partnerships', steps: ['Product Sales Manager', 'Partnerships Manager', 'Head of Partnerships'] },
  { id: 'path-marketing', title: 'Into marketing', steps: ['Product Sales Manager', 'Product Marketing Manager', 'Brand Manager'] },
]

/** Reports, for leader mode. */
export interface Report { id: string; name: string; role: string; dueSkills: string[] }
export const reports: Report[] = [
  { id: 'r1', name: 'Jordan Blake', role: 'Account Executive', dueSkills: ['negotiation', 'crm', 'customer-insight', 'forecasting'] },
  { id: 'r2', name: 'Mei Chen', role: 'Account Executive', dueSkills: ['negotiation', 'product-knowledge', 'presenting'] },
  { id: 'r3', name: 'Sam Patel', role: 'Sales Coordinator', dueSkills: [] },
]

export const skillById = (id: string) => skills.find(s => s.id === id)!
export const gigById = (id: string) => gigs.find(g => g.id === id)
