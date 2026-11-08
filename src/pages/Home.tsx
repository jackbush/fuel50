import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { cap, isLanding, itemsInSpace, resolveItem, spaceBlurb, spaceLabel, term, type TermId } from '../ia'
import { courses, gigs, mentors, person } from '../data'
import { actionsFor, gaps, noRatingsYet, readiness, recommendedActions, savedPath, targetRole, tasks, type Action } from '../logic'
import { Card, Empty, Icon, LevelMeter, PageHeader, Progress } from '../components/ui'
import { CrossLink } from '../components/nav'
import { PathSteps } from './Explore'

const useTerm = () => {
  const { tenant } = useStore()
  return (id: TermId, n?: number) => term(tenant, id, n)
}

/** Home: what to do, then your growth (your path, your plan, the skills to develop). Every journey starts here. */
export function Home() {
  const { state, tenant } = useStore()
  const profile = resolveItem(tenant, 'about')
  return (
    <>
      <div className="page-header">
        <div>
          <h1 tabIndex={-1}>{state.mode === 'first' ? `Welcome to Fuel50, ${person.first}` : `Welcome back, ${person.first}`}</h1>
          <p className="meta">{profile && <><Link to={profile.path}>See your profile</Link> · </>}{person.role} · {person.location} · Manager: {person.manager}</p>
        </div>
      </div>
      <section aria-labelledby="todo-h" className="home-section">
        <h2 id="todo-h" className="home-heading">To do</h2>
        <TaskList />
      </section>
      <GrowthSection />
      {state.mode === 'first' && <Guide />}
    </>
  )
}

/** Home › Outstanding tasks: the same list, reached from the account menu. */
export function Tasks() {
  return (
    <>
      <PageHeader item="tasks" />
      <TaskList />
    </>
  )
}

/** Outstanding tasks, most urgent first. The first gets the primary button; the rest are secondary. */
function TaskList() {
  const { state, tenant } = useStore()
  const list = tasks(state, tenant)
  if (!list.length) return <Card className="task"><p className="muted">Nothing outstanding. You’re up to date.</p></Card>
  return (
    <ol className="tasks">
      {list.map((task, i) => (
        <li key={task.id} className={'card task' + (i === 0 ? ' is-first' : '')}>
          <div className="task-text">
            <h3>{task.title}{task.due && <span className="due-badge">{task.due}</span>}</h3>
            <p>{task.detail}</p>
          </div>
          <Link className={'btn ' + (i === 0 ? 'primary' : 'ghost')} to={task.path}>{task.cta}</Link>
        </li>
      ))}
    </ol>
  )
}

/** What you've started: one tile per kind of thing. A tile's name opens that part of Explore; gigs and mentors say how many are recommended. */
function Plan() {
  const { state, tenant, dispatch } = useStore()
  const t = useTerm()
  const gigsItem = resolveItem(tenant, 'gigs'), mentorsItem = resolveItem(tenant, 'mentors'), learningItem = resolveItem(tenant, 'learning')
  const manager = person.manager.split(' ')[0]
  const recs = recommendedActions(state)
  const count = (kind: Action['kind']) => recs.filter(a => a.kind === kind).length
  return (
    <div id="plan" className="home-block">
      <h3 id="plan-h" className="home-subheading">Your {t('plan', 1)}</h3>
      <p className="meta home-sub">{state.planUpdated ? `Last updated ${state.planUpdated}` : 'Nothing in it yet. What you apply for, ask for and add goes here.'}</p>
      <ul className="plan-tiles">
        {gigsItem && (
          <PlanTile title={gigsItem.label} to={gigsItem.path} recommended={count('gig')}>
            {state.applications.length === 0 ? <Empty>No applications yet.</Empty> :
              <ul className="plan-items">{state.applications.map(a => {
                const g = gigs.find(x => x.id === a.gigId)!
                return (
                  <li key={a.gigId}>
                    <Link to={`/explore/gigs/${g.id}`}>{g.title}</Link>
                    <span className="meta">{a.status}</span>
                    {!a.managerTold && <span className="meta">You said you’d tell {manager}. <button className="link" onClick={() => dispatch({ type: 'markTold', gigId: g.id })}>I’ve told {manager}</button></span>}
                  </li>
                )
              })}</ul>}
          </PlanTile>
        )}
        {mentorsItem && (
          <PlanTile title={mentorsItem.label} to={mentorsItem.path} recommended={count('mentor')}>
            {state.mentorRequests.length === 0 ? <Empty>No requests yet.</Empty> :
              <ul className="plan-items">{state.mentorRequests.map(id => { const m = mentors.find(x => x.id === id)!; return <li key={id}>{m.name}<span className="meta">Requested</span></li> })}</ul>}
          </PlanTile>
        )}
        {learningItem && (
          <PlanTile title={learningItem.label} to={learningItem.path}>
            {state.courses.length === 0 ? <Empty>Nothing added yet.</Empty> :
              <ul className="plan-items">{state.courses.map(id => {
                const c = courses.find(x => x.id === id)!
                const done = state.courseProgress[id] ?? 0
                return (
                  <li key={id}>
                    {c.title}
                    {done > 0 && <Progress value={(done / c.hours) * 100} />}
                    <span className="meta">{done > 0 ? `In progress · ${done} of ${c.hours} h` : `Not started · ${c.hours} h`}</span>
                  </li>
                )
              })}</ul>}
          </PlanTile>
        )}
      </ul>
    </div>
  )
}

function PlanTile({ title, to, recommended = 0, children }: { title: string; to?: string; recommended?: number; children: React.ReactNode }) {
  return (
    <li className="plan-tile">
      <div className="plan-tile-head">
        <h4>{to ? <Link to={to} className="tile-link">{title}<Icon name="chevron" /></Link> : title}</h4>
        {recommended > 0 && <span className="rec-badge">{recommended} recommended</span>}
      </div>
      {children}
    </li>
  )
}

/** Your growth: the path you've chosen and the role it sets, your plan, and every skill to develop on the way, biggest gap first. */
function GrowthSection() {
  const { state, tenant } = useStore()
  const t = useTerm()
  const path = savedPath(state)
  const target = targetRole(state)
  const pathsItem = resolveItem(tenant, 'paths')
  const r = readiness(state)
  // With no ratings yet, every gap would be a guess: ask for ratings first.
  const unrated = noRatingsYet(state)
  const g = unrated ? [] : gaps(state)
  const from = `your ${t('skill')} to develop`
  const skillsItem = resolveItem(tenant, 'skills')
  return (
    <section id="growth" aria-labelledby="growth-h" className="home-section">
      <h2 id="growth-h" className="home-heading">Your growth</h2>
      <Card className="saved">
        <div className="gap-head">
          <h3 className="card-heading-lg">{path.title}</h3>
          {pathsItem && <CrossLink className="more" to={pathsItem.path} from="Home">Change <Icon name="arrow" /></CrossLink>}
        </div>
        <PathSteps path={path} ready={unrated ? undefined : { pct: r.pct, label: <>Ready on <strong>{r.ready} of {r.total}</strong> {t('skill')}{!state.assessmentDone && ', from your last ratings'}</> }} />
        {unrated && <p className="meta">Rate your {t('skill')} to see how ready you are for {target}.</p>}
      </Card>
      <Plan />
      <h3 id="develop-h" className="home-subheading">{cap(t('skill'))} to develop</h3>
      {unrated && <Empty>These appear once you’ve rated your {t('skill')}.{skillsItem && <> <Link to={skillsItem.path}>Rate them now</Link></>}</Empty>}
      {!unrated && g.length === 0 && <Empty>No gaps. You’re ready for this {t('role', 1)} on every {t('skill', 1)}.</Empty>}
      {g.map(gap => {
        const actions = actionsFor(state, gap.skill.id)
        return (
          <Card key={gap.skill.id} id={`gap-${gap.skill.id}`} className="gap">
            <div className="gap-main">
              <h4>{gap.skill.name}</h4>
              <div className="gap-opts">
                {/* Highlighted: options that cover this whole gap or more (their +N at least the meter's). */}
                {actions.map(a => {
                  return (
                    <CrossLink key={a.kind + a.id} to={a.path} from={from} className={'opt' + (a.reach >= gap.size ? ' is-strong' : '')}>
                      <span className="opt-kind">{cap(t(a.kind, 1))}</span>{a.title}
                      {a.reach > 0 && <span className="reach" title={`Works on ${a.reach} level${a.reach === 1 ? '' : 's'} of your gaps`}>+{a.reach}<span className="visually-hidden"> levels of your gaps</span></span>}
                    </CrossLink>
                  )
                })}
                {!actions.length && <span className="muted">No matches yet.</span>}
              </div>
            </div>
            <LevelMeter level={gap.rated ? gap.current : null} target={gap.target} />
          </Card>
        )
      })}
    </section>
  )
}

/** A short map of the IA, for people who don't know it yet. */
function Guide() {
  const { state, tenant, dispatch } = useStore()
  if (state.guidanceHidden) return null
  const explore = itemsInSpace(tenant, 'explore').filter(i => !isLanding(i)).map(i => i.label).join(', ')
  return (
    <Card className="guide" label="How Fuel50 is organised">
      <div className="row spread">
        <h2 className="card-heading">How Fuel50 is organised</h2>
        <button className="link small" onClick={() => dispatch({ type: 'toggleGuidance' })}>Hide this</button>
      </div>
      <div className="grid-3">
        <div className="guide-col"><h3>{spaceLabel(tenant, 'home')}</h3><p className="muted small">{cap(spaceBlurb(tenant, 'home'))}. Every journey starts here.</p></div>
        <div className="guide-col"><h3>{spaceLabel(tenant, 'explore')}</h3><p className="muted small">{spaceBlurb(tenant, 'explore')}: {explore}.</p></div>
        <div className="guide-col"><h3>Search</h3><p className="muted small">Press <kbd>⌘K</kbd> or <kbd>/</kbd> anywhere. It knows other names for things.</p></div>
      </div>
    </Card>
  )
}
