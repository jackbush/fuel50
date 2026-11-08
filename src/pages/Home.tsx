import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { cap, fill, isLanding, resolveItem, itemsInSpace, spaceLabel, term } from '../ia'
import { gigs, LAST_VISIT, paths, person, reports, skills, targetRole, TODAY, DUE_DATE } from '../data'
import { gaps, needsAttention, nextStep, readiness, startStepDone } from '../logic'
import { Card, Icon, Progress } from '../components/ui'

export function Home() {
  const { state, tenant } = useStore()
  const step = nextStep(state, tenant)
  const top = state.mode === 'first' && !state.assessmentDone ? undefined : gaps(state)[0]
  const t = (id: Parameters<typeof term>[1], n?: number) => term(tenant, id, n)

  return (
    <>
      <div className="page-header">
        <div>
          <h1 tabIndex={-1}>{state.mode === 'first' ? `Welcome to Fuel50, ${person.first}` : `Welcome back, ${person.first}`}</h1>
          {/* “Last visit” only until she's done something on this one. */}
          <p className="page-sub">{TODAY}{state.mode === 'returner' && !state.assessmentDone && ` · Your last visit was ${LAST_VISIT}`}</p>
          <p className="meta">{person.role} · {person.location} · Manager: {person.manager}</p>
        </div>
      </div>

      {state.mode === 'first' ? <StartHere /> : (
        <Card className="next hero" label="Your next step">
          <h2>{step.title}</h2>
          <p>{step.detail}</p>
          <Link className="btn primary" to={step.path}>{step.cta}</Link>
        </Card>
      )}

      {state.mode === 'first' && <Guide />}

      {state.mode === 'leader' && (
        <Card>
          <h2 className="card-heading">{spaceLabel(tenant, 'team')}: {t('review', 1)} cycle due {DUE_DATE}</h2>
          <ul className="plain">
            {reports.map(rep => {
              const done = rep.dueSkills.every(sk => state.teamRatings[rep.id]?.[sk] !== undefined)
              return (
                <li key={rep.id}>
                  <span><strong>{rep.name}</strong> <span className="muted">· {rep.role}</span></span>
                  <span className={'status' + (done || !rep.dueSkills.length ? ' ok' : '')}>{rep.dueSkills.length === 0 ? 'Nothing due' : done ? 'Rated' : `${rep.dueSkills.length} ${t('skill', rep.dueSkills.length)} to rate`}</span>
                </li>
              )
            })}
          </ul>
          <Link className="more" to="/team/reviews">Go to {resolveItem(tenant, 'reviews')?.label.toLowerCase()} <Icon name="arrow" /></Link>
        </Card>
      )}

      {state.mode !== 'first' && state.lastAction && (
        <Card className="left-off" label="Where you left off">
          <div>
            <h2 className="card-heading">Where you left off</h2>
            <p><strong>{fill(state.lastAction.label, tenant)}</strong></p>
          </div>
          <Link className="more" to={state.lastAction.path}>View <Icon name="arrow" /></Link>
        </Card>
      )}

      <GrowthSummary />

      {state.mode !== 'leader' && top && (
        <section aria-labelledby="explore-h">
          <h2 className="section" id="explore-h">{cap(t('gig'))} that grow {top.skill.name}</h2>
          <ul className="cards">
            {gigs.filter(g => g.grow.includes(top.skill.id)).slice(0, 2).map(g => {
              const applied = state.applications.some(a => a.gigId === g.id)
              return (
                <li key={g.id}>
                  <Link to={`/explore/gigs/${g.id}`} className="card link-card">
                    <h3 className="card-title">{g.title}</h3>
                    <span className="card-meta">{g.team} · {g.weeks} weeks · posted {g.postedDaysAgo} days ago{applied && <span className="status ok">Applied</span>}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {state.mode === 'returner' && <Guide />}
    </>
  )
}

/** Everything that's yours: Home's own items, each with where it stands. Every journey starts here. */
function GrowthSummary() {
  const { state, tenant } = useStore()
  const t = (id: Parameters<typeof term>[1], n?: number) => term(tenant, id, n)
  const r = readiness(state)
  const n = needsAttention(state).length
  const active = state.applications.length + state.mentorRequests.length + state.courses.length + state.goals.length
  const status: Record<string, string> = {
    skills: state.assessmentDone ? 'Up to date' : state.mode === 'first' ? `${skills.length} to rate · due ${DUE_DATE}` : `${n} need attention · due ${DUE_DATE}`,
    targets: `${targetRole.title} · ready on ${r.ready} of ${r.total}`,
    plan: `${active} active · ${paths.filter(p => p.saved).length} saved career ${t('path', 1)}`,
    about: state.aboutDone ? state.values.join(', ') : 'Not started · about 2 minutes',
  }
  return (
    <section aria-labelledby="growth-h">
      <h2 className="section" id="growth-h">Your growth</h2>
      <div className="grid-2">
        {itemsInSpace(tenant, 'home').filter(it => !isLanding(it)).map(it => (
          <Link key={it.id} to={it.path} className="tile">
            <span className="tile-title">{it.label}</span>
            <span className="tile-desc">{it.description}</span>
            {it.id === 'targets' && <Progress value={r.pct} />}
            <span className="tile-status">{status[it.id]}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

/** A short map of the IA, for people who don't know it yet. */
function Guide() {
  const { state, tenant, dispatch } = useStore()
  if (state.guidanceHidden) return null
  const list = (sp: 'home' | 'explore') => itemsInSpace(tenant, sp).filter(i => !isLanding(i)).map(i => i.label).join(', ')
  return (
    <Card className="guide" label="How Fuel50 is organised">
      <div className="row spread">
        <h2 className="card-heading">How Fuel50 is organised</h2>
        <button className="link small" onClick={() => dispatch({ type: 'toggleGuidance' })}>Hide this</button>
      </div>
      <div className="grid-3">
        <div className="guide-col"><h3>{spaceLabel(tenant, 'home')}</h3><p className="muted small">Everything that’s yours: {list('home')}. Every journey starts here.</p></div>
        <div className="guide-col"><h3>{spaceLabel(tenant, 'explore')}</h3><p className="muted small">What you could do next: {list('explore')}.</p></div>
        <div className="guide-col"><h3>Search</h3><p className="muted small">Press <kbd>⌘K</kbd> or <kbd>/</kbd> anywhere. It knows other names for things.</p></div>
      </div>
    </Card>
  )
}

function StartHere() {
  const { state, tenant } = useStore()
  const steps = tenant.startHere.map(id => resolveItem(tenant, id)).filter(it => !!it)
  const current = steps.find(it => !startStepDone(state, it.id))
  const step = nextStep(state, tenant)
  return (
    <Card className="next hero" label="Start here">
      <h2>Start here</h2>
      <p>{steps.length} things to do first. Your organisation chose this order.</p>
      <ol className="start-list">
        {steps.map(it => {
          const done = startStepDone(state, it.id)
          const isNext = it === current
          return (
            <li key={it.id} className={(done ? 'done' : '') + (isNext ? ' is-next' : '')}>
              <div>
                <Link to={it.path}><strong>{it.label}</strong></Link>
                <span className="muted small">{isNext ? step.detail : it.description}</span>
              </div>
              {done ? <span className="status ok">Done</span> : isNext && <Link className="btn primary" to={step.path}>{step.cta}</Link>}
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
