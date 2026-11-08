import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { resolveItem, itemsInSpace, spaceLabel } from '../ia'
import { gigs, LAST_VISIT, person, reports, targetRole, TODAY, DUE_DATE } from '../data'
import { gaps, needsAttention, nextStep, readiness } from '../logic'
import { Card, Progress } from '../components/ui'

export function Home() {
  const { state, tenant, dispatch } = useStore()
  const step = nextStep(state, tenant)
  const r = readiness(state)
  const top = gaps(state)[0]

  return (
    <>
      <div className="page-header home-head">
        <div>
          <p className="eyebrow">{TODAY}</p>
          <h1 tabIndex={-1}>{state.mode === 'first' ? `Welcome to Fuel50, ${person.first}` : `Welcome back, ${person.first}`}</h1>
          {state.mode === 'returner' && <p className="page-sub">Your last visit was {LAST_VISIT}.</p>}
        </div>
      </div>

      <Card className="next hero">
        <p className="eyebrow">Your next step</p>
        <h2>{step.title}</h2>
        <p>{step.detail}</p>
        <Link className="btn primary" to={step.path}>{step.cta}</Link>
      </Card>

      {state.mode === 'first' && <StartHere />}

      {state.mode === 'leader' && (
        <Card>
          <p className="eyebrow">{spaceLabel(tenant, 'team')}</p>
          <h2>Review cycle: due {DUE_DATE}</h2>
          <ul className="plain">
            {reports.map(rep => {
              const done = rep.dueSkills.every(sk => state.teamRatings[rep.id]?.[sk] !== undefined)
              return <li key={rep.id}>{rep.name}, {rep.role} <span className="status">{rep.dueSkills.length === 0 ? 'Nothing due' : done ? 'Rated' : `${rep.dueSkills.length} skills to rate`}</span></li>
            })}
          </ul>
          <Link to="/team/reviews">Go to reviews →</Link>
        </Card>
      )}

      {state.mode !== 'first' && (
        <div className="grid-3">
          <Card>
            <p className="eyebrow">What’s due</p>
            {state.assessmentDone
              ? <><h3>Nothing due</h3><p className="muted">Your skills are up to date for {person.manager}.</p></>
              : <><h3>Self-assessment by {DUE_DATE}</h3><p className="muted">Asked by {person.manager}. {needsAttention(state).length} skills need attention.</p><Link to="/growth/skills">Review →</Link></>}
          </Card>
          <Card>
            <p className="eyebrow">Where you left off</p>
            {state.lastAction
              ? <><h3>{state.lastAction.label}</h3><Link to={state.lastAction.path}>Pick up →</Link></>
              : <p className="muted">Nothing yet.</p>}
            {state.applications.length > 0 && <p className="small">{state.applications.length} application{state.applications.length > 1 ? 's' : ''} under review · <Link to="/growth/plan">My plan</Link></p>}
          </Card>
          <Card>
            <p className="eyebrow">Your target role</p>
            <h3>{targetRole.title}</h3>
            <Progress value={r.pct} label={`Ready on ${r.ready} of ${r.total}`} />
            <p className="small">Ready on {r.ready} of {r.total} skills · <Link to="/growth/targets">See gaps</Link></p>
          </Card>
        </div>
      )}

      {state.mode !== 'leader' && top && (
        <section aria-labelledby="explore-h">
          <h2 className="section" id="explore-h">New gigs that grow {top.skill.name}</h2>
          <ul className="cards">
            {gigs.filter(g => g.grow.includes(top.skill.id)).slice(0, 2).map(g => (
              <li key={g.id}><Link to={`/explore/gigs/${g.id}`} className="card link-card"><span className="card-kicker">{g.team} · {g.weeks} weeks · posted {g.postedDaysAgo} days ago</span><span className="card-title">{g.title}</span></Link></li>
            ))}
          </ul>
        </section>
      )}

      {!state.guidanceHidden && state.mode !== 'leader' && (
        <Card className="guide">
          <div className="row spread"><p className="eyebrow">How Fuel50 is organised</p><button className="link" onClick={() => dispatch({ type: 'toggleGuidance' })}>Hide this</button></div>
          <div className="grid-3">
            {(['growth', 'explore'] as const).map(sp => (
              <div key={sp}>
                <h3>{spaceLabel(tenant, sp)}</h3>
                <p className="muted small">{sp === 'growth' ? 'Everything that’s yours: skills, target roles, your plan.' : 'What you could do: '}{sp === 'explore' && itemsInSpace(tenant, 'explore').map(i => i.label).join(', ')}.</p>
              </div>
            ))}
            <div><h3>Search</h3><p className="muted small">Press <kbd>⌘K</kbd> or <kbd>/</kbd> anywhere. It knows other names for things.</p></div>
          </div>
        </Card>
      )}
    </>
  )
}

function StartHere() {
  const { state, tenant } = useStore()
  const done = (id: string) => (id === 'about' ? state.aboutDone : id === 'skills' ? state.assessmentDone : false)
  return (
    <Card>
      <p className="eyebrow">Start here</p>
      <h2>Three things to do first</h2>
      <ol className="start-list">
        {tenant.startHere.map(id => {
          const it = resolveItem(tenant, id)
          if (!it) return null
          return (
            <li key={id} className={done(id) ? 'done' : ''}>
              <Link to={it.path}><strong>{it.label}</strong></Link>
              <span className="muted"> · {it.description}</span>
              {done(id) && <span className="status"> Done</span>}
            </li>
          )
        })}
      </ol>
      <p className="muted small">Your organisation chose this order for your rollout.</p>
    </Card>
  )
}
