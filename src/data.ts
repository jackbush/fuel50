/**
 * Mock data. Persona, role and target role come from the Fuel50 demo tenant
 * (Kimberley Thomas, Product Sales Manager → Senior Manager, Product Sales).
 * Everything else is illustrative sample content.
 */

export const TODAY = 'Monday 16 June'
export const LAST_VISIT = '12 December'
export const DUE_DATE = '30 June'

export const person = {
  name: 'Kimberley Thomas',
  first: 'Kimberley',
  role: 'Product Sales Manager',
  manager: 'Priya Shah',
  location: 'Wellington',
}

export const LEVELS = ['Not relevant to me', 'Basic', 'Skilled', 'Advanced', 'Expert'] as const
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
  { id: 'product-knowledge', name: 'Product Knowledge', description: 'Understanding our products, how they’re used and how they compare.', type: 'specialist', lastRating: 3, target: 3 },
  { id: 'sales-strategy', name: 'Sales Strategy', description: 'Planning how to reach targets across accounts and segments.', type: 'specialist', lastRating: 2, target: 3 },
  { id: 'negotiation', name: 'Negotiation', description: 'Reaching agreements that work for the customer and for us.', type: 'specialist', lastRating: 3, target: 3 },
  { id: 'account-management', name: 'Account Management', description: 'Growing long-term relationships with key customers.', type: 'specialist', lastRating: 3, target: 3 },
  { id: 'forecasting', name: 'Sales Forecasting', description: 'Predicting revenue with enough accuracy to plan around.', type: 'specialist', lastRating: 2, target: 2 },
  { id: 'crm', name: 'CRM Management', description: 'Keeping pipeline data accurate and useful.', type: 'specialist', lastRating: 3, target: 2 },
  { id: 'bizdev', name: 'Business Development Strategy', description: 'Finding and shaping new markets, partners and revenue streams.', type: 'specialist', lastRating: 1, target: 3 },
  { id: 'stakeholders', name: 'Stakeholder Management', description: 'Keeping the right people informed and on side.', type: 'strength', lastRating: 3, target: 3 },
  { id: 'presenting', name: 'Presentation Skills', description: 'Explaining ideas clearly to groups.', type: 'strength', lastRating: 3, target: 3 },
  { id: 'market-analysis', name: 'Market Analysis', description: 'Reading market data to spot opportunities and threats.', type: 'specialist', lastRating: 2, target: 2 },
  { id: 'pricing', name: 'Pricing Strategy', description: 'Setting prices that win business and protect margin.', type: 'specialist', lastRating: 2, target: 2 },
  { id: 'customer-insight', name: 'Customer Insight', description: 'Understanding what customers need, even when they don’t say it.', type: 'strength', lastRating: 3, target: 3 },
  { id: 'leadership', name: 'Team Leadership', description: 'Setting direction and helping a team do its best work.', type: 'strength', lastRating: 2, target: 3 },
  { id: 'coaching', name: 'Coaching Others', description: 'Helping others grow through questions and feedback.', type: 'strength', lastRating: 2, target: 2 },
  { id: 'contracts', name: 'Contract Management', description: 'Managing terms, renewals and obligations.', type: 'specialist', lastRating: 2, target: 2 },
  { id: 'data-decisions', name: 'Data-Driven Decision Making', description: 'Using evidence, not instinct alone, to make calls.', type: 'strength', lastRating: null, change: 'new', target: 3 },
  { id: 'brand-marketing', name: 'Brand Marketing', description: 'Building how customers see and feel about a brand. Now includes digital channels.', type: 'specialist', lastRating: 1, change: 'updated', target: 2 },
  { id: 'change', name: 'Change Management', description: 'Helping people through new ways of working.', type: 'strength', lastRating: null, target: 2 },
]

export const targetRole = {
  id: 'snr-mgr-product-sales',
  title: 'Senior Manager, Product Sales',
  function: 'Sales',
  savedOn: '12 December',
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

export interface Vacancy { id: string; title: string; team: string; location: string; closes: string }
export const vacancies: Vacancy[] = [
  { id: 'v1', title: 'Senior Manager, Product Sales', team: 'Sales', location: 'Auckland', closes: '4 July' },
  { id: 'v2', title: 'Partnerships Manager', team: 'Business Development', location: 'Wellington', closes: '27 June' },
  { id: 'v3', title: 'Sales Operations Analyst', team: 'Sales Operations', location: 'Remote', closes: '10 July' },
]

export interface CareerPath { id: string; title: string; steps: string[]; saved: boolean }
export const paths: CareerPath[] = [
  { id: 'path-sales', title: 'Sales leadership', steps: ['Product Sales Manager', 'Senior Manager, Product Sales', 'Head of Sales'], saved: true },
  { id: 'path-partners', title: 'Partnerships', steps: ['Product Sales Manager', 'Partnerships Manager', 'Head of Partnerships'], saved: false },
  { id: 'path-marketing', title: 'Into marketing', steps: ['Product Sales Manager', 'Product Marketing Manager', 'Brand Manager'], saved: false },
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
