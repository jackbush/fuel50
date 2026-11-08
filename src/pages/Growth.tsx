import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { resolveItem, itemsInSpace } from '../ia'
import { courses, gigs, LAST_VISIT, LEVELS, mentors, paths, person, skills, targetRole, DUE_DATE, type Level, type Skill } from '../data'
import { gaps, needsAttention, optionsForSkill, readiness } from '../logic'
import { Card, Empty, LevelTag, PageHeader, Progress } from '../components/ui'
import { CrossLink } from '../components/nav'

/* ---------------- Overview ---------------- */

export function GrowthOverview() {
  const { state, tenant } = useStore()
  const r = readiness(state)
  const status: Record<string, string> = {
    skills: state.assessmentDone ? 'Up to date' : `${needsAttention(state).length} need attention · due ${DUE_DATE}`,
    targets: `${targetRole.title} · ready on ${r.ready} of ${r.total}`,
    plan: `${state.applications.length + state.mentorRequests.length + state.courses.length + state.goals.length} active · 1 saved path`,
    about: state.aboutDone ? 'Values, strengths, work style' : 'Not started',
  }
  return (
    <>
      <PageHeader title={person.name} sub={`${person.role} · ${person.location} · Manager: ${person.manager}`} />
      <div className="grid-2">
        {itemsInSpace(tenant, 'growth').filter(i => i.id !== 'growth-overview').map(it => (
          <Link key={it.id} to={it.path} className="tile">
            <span className="tile-title">{it.label}</span>
            <span className="tile-desc">{it.description}</span>
            <span className="tile-status">{status[it.id]}</span>
          </Link>
        ))}
      </div>
    </>
  )
}

/* ---------------- Skills: confirm or change ---------------- */

const reason = (s: Skill, rating: Level | null) =>
  s.change === 'new' ? 'New to your role since your last visit'
    : s.change === 'updated' ? 'Its description changed since you rated it'
    : rating === null ? 'You haven’t rated this yet' : ''

export function Skills() {
  const { state, dispatch, tenant } = useStore()
  const label = resolveItem(tenant, 'skills')?.label ?? 'Skills'
  const attention = needsAttention(state)
  const [queue, setQueue] = useState<Skill[] | null>(null)
  const [step, setStep] = useState(0)
  const [editing, setEditing] = useState<string | null>(null)

  if (state.assessmentDone && !queue) return <SkillsDone label={label} />

  if (queue) {
    const s = queue[step]
    const rating = state.ratings[s.id]
    const last = s.lastRating
    const isLast = step === queue.length - 1
    return (
      <>
        <PageHeader item="skills" title={`Rate your ${label.toLowerCase()}`} sub={`${step + 1} of ${queue.length}`} />
        <Progress value={((step + 1) / queue.length) * 100} label={`${step + 1} of ${queue.length}`} />
        <Card className="rate-card">
          {reason(s, last) && <p className="flag">{reason(s, last)}</p>}
          <h2>{s.name}</h2>
          <p className="muted">{s.description}</p>
          <fieldset className="levels">
            <legend>Which best describes your level?</legend>
            {LEVELS.map((l, i) => (
              <label key={l} className={'level-option' + (rating === i ? ' selected' : '')}>
                <input type="radio" name={`level-${s.id}`} checked={rating === i} onChange={() => dispatch({ type: 'rate', skillId: s.id, level: i as Level })} />
                <span>{l}</span>
                {last === i && <span className="was">Your rating in {LAST_VISIT}</span>}
              </label>
            ))}
          </fieldset>
          <div className="row">
            <button className="btn ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
            <button
              className="btn primary"
              disabled={rating === null}
              onClick={() => {
                if (!isLast) return setStep(step + 1)
                dispatch({ type: 'completeAssessment' })
                setQueue(null); setStep(0)
              }}
            >
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </Card>
        {queue.length < skills.length && <p className="muted small">The other {skills.length - queue.length} carry over from your last ratings. You can change any of them afterwards.</p>}
      </>
    )
  }

  const rest = skills.filter(s => !attention.includes(s))
  return (
    <>
      <PageHeader item="skills" />
      <Card className="since">
        <p className="eyebrow">Since your last visit on {LAST_VISIT}</p>
        <ul className="since-list">
          {attention.map(s => <li key={s.id}><strong>{s.name}</strong>: {reason(s, s.lastRating).toLowerCase()}</li>)}
        </ul>
        <p>{rest.length} skills carry over from your last ratings. {person.manager} asked for these by <strong>{DUE_DATE}</strong>.</p>
        <div className="row">
          <button className="btn primary" onClick={() => { setQueue(attention); setStep(0) }}>Review {attention.length} that need attention</button>
          <button className="btn ghost" onClick={() => { setQueue([...attention, ...rest]); setStep(0) }}>Review all {skills.length}</button>
        </div>
      </Card>
      <h2 className="section">Your {label.toLowerCase()} for {person.role}</h2>
      <ul className="skill-list">
        {[...attention, ...rest].map(s => (
          <li key={s.id} id={`skill-${s.id}`} className={attention.includes(s) ? 'attention' : ''}>
            <div>
              <span className="skill-name">{s.name}</span>
              {reason(s, s.lastRating) && <span className="flag inline">{reason(s, s.lastRating)}</span>}
            </div>
            {editing === s.id ? (
              <select autoFocus value={state.ratings[s.id] ?? ''} onChange={e => { dispatch({ type: 'rate', skillId: s.id, level: Number(e.target.value) as Level }); setEditing(null) }} onBlur={() => setEditing(null)} aria-label={`Rating for ${s.name}`}>
                <option value="" disabled>Choose…</option>
                {LEVELS.map((l, i) => <option key={l} value={i}>{l}</option>)}
              </select>
            ) : (
              <span className="row-end"><LevelTag level={state.ratings[s.id]} /><button className="link" onClick={() => setEditing(s.id)}>Change</button></span>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

function SkillsDone({ label }: { label: string }) {
  const { state, dispatch } = useStore()
  const r = readiness(state)
  const top = gaps(state)[0]
  const opts = top ? optionsForSkill(top.skill.id) : null
  const from = `your ${label.toLowerCase()} results`
  return (
    <>
      <PageHeader item="skills" title={`Your ${label.toLowerCase()} are up to date`} sub={`All ${skills.length} rated. ${person.manager} can see them for your review.`}>
        <button className="btn ghost" onClick={() => dispatch({ type: 'addGoal', text: 'Ask two colleagues for feedback on my top skills' })}>Ask for feedback</button>
      </PageHeader>
      <div className="grid-2">
        <Card>
          <p className="eyebrow">Your target role</p>
          <h2>{targetRole.title}</h2>
          <Progress value={r.pct} label={`Ready on ${r.ready} of ${r.total} skills`} />
          <p>Ready on <strong>{r.ready} of {r.total}</strong> skills.</p>
          <Link to="/growth/targets">See every gap →</Link>
        </Card>
        {top && opts && (
          <Card className="next">
            <p className="eyebrow">Your next step</p>
            <h2>Grow {top.skill.name}</h2>
            <p>You’re at <strong>{LEVELS[top.current]}</strong>; {targetRole.title} needs <strong>{LEVELS[top.target]}</strong>. Pick one way to start:</p>
            <ul className="options">
              {opts.gigs[0] && <li><span className="opt-kind">Gig</span><CrossLink to={`/explore/gigs/${opts.gigs[0].id}`} from={from}>{opts.gigs[0].title}</CrossLink></li>}
              {opts.mentors[0] && <li><span className="opt-kind">Mentor</span><CrossLink to="/explore/mentors" from={from}>{opts.mentors[0].name}, {opts.mentors[0].role}</CrossLink></li>}
              {opts.courses[0] && <li><span className="opt-kind">Course</span><CrossLink to="/explore/learning" from={from}>{opts.courses[0].title}</CrossLink></li>}
            </ul>
          </Card>
        )}
      </div>
      <details className="all-ratings">
        <summary>Your ratings</summary>
        <ul className="skill-list compact">
          {skills.map(s => <li key={s.id}><span className="skill-name">{s.name}</span><LevelTag level={state.ratings[s.id]} /></li>)}
        </ul>
      </details>
    </>
  )
}

/* ---------------- Target roles ---------------- */

export function TargetRoles() {
  const { state } = useStore()
  const r = readiness(state)
  const g = gaps(state)
  const saved = paths.find(p => p.saved)!
  const from = 'your target role'
  return (
    <>
      <PageHeader item="targets" />
      <Card>
        <p className="eyebrow">Aiming for · saved {targetRole.savedOn}</p>
        <h2>{targetRole.title}</h2>
        <Progress value={r.pct} label={`Ready on ${r.ready} of ${r.total}`} />
        <p>Ready on <strong>{r.ready} of {r.total}</strong> skills{!state.assessmentDone && ' (based on your last ratings)'}.</p>
        <p className="muted small">Part of your saved path: {saved.steps.join(' → ')}. <Link to="/explore/paths">Change</Link></p>
      </Card>
      <h2 className="section">Gaps, biggest first</h2>
      {g.length === 0 && <Empty>No gaps. You’re ready for this role on every skill.</Empty>}
      {g.map(gap => {
        const o = optionsForSkill(gap.skill.id)
        return (
          <Card key={gap.skill.id} id={`gap-${gap.skill.id}`} className="gap">
            <div className="gap-head">
              <h3>{gap.skill.name}</h3>
              <span className="muted">{LEVELS[gap.current]} → {LEVELS[gap.target]}</span>
            </div>
            <div className="gap-opts">
              {o.gigs.map(x => <CrossLink key={x.id} to={`/explore/gigs/${x.id}`} from={from} className="opt"><span className="opt-kind">Gig</span>{x.title}</CrossLink>)}
              {o.mentors.map(x => <CrossLink key={x.id} to="/explore/mentors" from={from} className="opt"><span className="opt-kind">Mentor</span>{x.name}</CrossLink>)}
              {o.courses.map(x => <CrossLink key={x.id} to="/explore/learning" from={from} className="opt"><span className="opt-kind">Course</span>{x.title}</CrossLink>)}
              {!o.gigs.length && !o.mentors.length && !o.courses.length && <span className="muted">No matches yet.</span>}
            </div>
          </Card>
        )
      })}
    </>
  )
}

/* ---------------- My plan ---------------- */

export function Plan() {
  const { state, tenant } = useStore()
  const gigsLabel = resolveItem(tenant, 'gigs')?.label ?? 'Gigs'
  const mentorsLabel = resolveItem(tenant, 'mentors')?.label ?? 'Mentors'
  const learningLabel = resolveItem(tenant, 'learning')?.label ?? 'Learning'
  const saved = paths.filter(p => p.saved)
  return (
    <>
      <PageHeader item="plan" />
      <div className="grid-2">
        <Card>
          <h2>Saved paths</h2>
          {saved.map(p => <p key={p.id}><Link to="/explore/paths">{p.title}</Link><br /><span className="muted small">{p.steps.join(' → ')}</span></p>)}
        </Card>
        <Card>
          <h2>{gigsLabel}</h2>
          {state.applications.length === 0 ? <Empty>No applications yet. <Link to="/explore/gigs">Browse {gigsLabel.toLowerCase()}</Link></Empty> :
            <ul className="plain">{state.applications.map(a => { const g = gigs.find(x => x.id === a.gigId)!; return <li key={a.gigId}><Link to={`/explore/gigs/${g.id}`}>{g.title}</Link> <span className="status">{a.status}</span></li> })}</ul>}
        </Card>
        <Card>
          <h2>{mentorsLabel}</h2>
          {state.mentorRequests.length === 0 ? <Empty>No requests yet. <Link to="/explore/mentors">Find a mentor</Link></Empty> :
            <ul className="plain">{state.mentorRequests.map(id => { const m = mentors.find(x => x.id === id)!; return <li key={id}>{m.name} <span className="status">Requested</span></li> })}</ul>}
        </Card>
        <Card>
          <h2>{learningLabel}</h2>
          {state.courses.length === 0 ? <Empty>Nothing added yet. <Link to="/explore/learning">Find learning</Link></Empty> :
            <ul className="plain">{state.courses.map(id => { const c = courses.find(x => x.id === id)!; return <li key={id}>{c.title} <span className="status">{c.hours} h</span></li> })}</ul>}
        </Card>
        <Card>
          <h2>Goals</h2>
          {state.goals.length === 0 ? <Empty>No goals yet.</Empty> : <ul className="plain">{state.goals.map((g, i) => <li key={i}>{g}</li>)}</ul>}
        </Card>
      </div>
    </>
  )
}

/* ---------------- About me (Personalize) ---------------- */

const VALUES = ['Learning new things', 'Recognition', 'Autonomy', 'Making an impact', 'Flexibility', 'Team spirit', 'Variety', 'Security']

export function AboutMe() {
  const { state, dispatch } = useStore()
  const [picked, setPicked] = useState<string[]>([])
  if (!state.aboutDone) {
    return (
      <>
        <PageHeader item="about" sub="Exercise 1 of 4 · about 5 minutes" />
        <Card>
          <h2>What matters most to you at work?</h2>
          <p className="muted">Pick three. It shapes the roles, gigs and mentors we suggest.</p>
          <div className="value-grid">
            {VALUES.map(v => {
              const on = picked.includes(v)
              return <button key={v} aria-pressed={on} className={'value' + (on ? ' on' : '')} disabled={!on && picked.length >= 3} onClick={() => setPicked(on ? picked.filter(x => x !== v) : [...picked, v])}>{v}</button>
            })}
          </div>
          <div className="row"><button className="btn primary" disabled={picked.length < 3} onClick={() => dispatch({ type: 'completeAbout' })}>Save</button></div>
        </Card>
      </>
    )
  }
  return (
    <>
      <PageHeader item="about" />
      <div className="grid-2">
        <Card><p className="eyebrow">Values</p><h2>Making an impact, learning, autonomy</h2><p className="muted small">From your values exercise</p></Card>
        <Card><p className="eyebrow">Strengths</p><h2>Customer insight, stakeholder management</h2><p className="muted small">From your strengths exercise</p></Card>
        <Card><p className="eyebrow">Work style</p><h2>Social and influential</h2><p className="muted small">From your work-style exercise</p></Card>
        <Card><p className="eyebrow">Career pace</p><h2>Building momentum</h2><p className="muted small">From your agility exercise</p></Card>
      </div>
    </>
  )
}
