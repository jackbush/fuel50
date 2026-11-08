import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { cap, resolveItem, term, type TermId } from '../ia'
import { LAST_VISIT, LEVELS, LEVEL_HELP, person, skills, DUE_DATE, type Level, type Skill } from '../data'
import { gaps, needsAttention, optionsForSkill, readiness, targetRole } from '../logic'
import { Card, Icon, LevelTag, PageHeader, Progress } from '../components/ui'
import { CrossLink } from '../components/nav'

const useTerm = () => {
  const { tenant } = useStore()
  return (id: TermId, n?: number) => term(tenant, id, n)
}

/* ---------------- Skills: confirm or change ---------------- */

/** Why a skill is on the list, in a few words. The summary card says it in full. */
const flag = (s: Skill, rating: Level | null) =>
  s.change === 'new' ? 'New to your role' : s.change === 'updated' ? 'Description changed' : rating === null ? 'Not rated yet' : ''

const reason = (s: Skill, rating: Level | null) =>
  s.change === 'new' ? 'new to your role since your last visit'
    : s.change === 'updated' ? 'its description changed since you rated it'
    : rating === null ? 'you haven’t rated it yet' : ''

export function Skills() {
  const { state, dispatch } = useStore()
  const t = useTerm()
  const attention = needsAttention(state)
  const [queue, setQueue] = useState<Skill[] | null>(null)
  const [step, setStep] = useState(0)
  const [editing, setEditing] = useState<string | null>(null)
  const skillHeading = useRef<HTMLHeadingElement>(null)
  const first = state.mode === 'first'

  // Each new skill in the queue takes focus, so keyboard and screen-reader users hear which one they're rating.
  useEffect(() => { if (queue && step > 0) skillHeading.current?.focus() }, [queue, step])

  if (state.assessmentDone && !queue) return <SkillsDone />

  if (queue) {
    const s = queue[step]
    const rating = state.ratings[s.id]
    const last = s.lastRating
    const isLast = step === queue.length - 1
    return (
      <>
        <PageHeader item="skills" title={`Rate your ${t('skill')}`} sub={first ? `For ${person.role}. Your manager, ${person.manager}, will see them.` : `Only the ones that need attention. ${person.manager} will see the result.`} />
        <p className="rate-head" aria-live="polite"><span>{cap(t('skill', 1))} {step + 1} of {queue.length}</span>{queue.length < skills.length && <span>{skills.length - queue.length} more carry over</span>}</p>
        <Progress value={((step + 1) / queue.length) * 100} />
        <Card className="rate-card">
          {flag(s, last) && <p><span className="flag">{flag(s, last)}</span></p>}
          <h2 ref={skillHeading} tabIndex={-1}>{s.name}</h2>
          <p className="muted">{s.description}</p>
          <fieldset className="levels">
            <legend>Which best describes your level?</legend>
            {([1, 2, 3, 4, 0] as Level[]).map(i => (
              <label key={i} className={'level-option' + (rating === i ? ' selected' : '') + (i === 0 ? ' not-relevant' : '')}>
                <input type="radio" name={`level-${s.id}`} checked={rating === i} onChange={() => dispatch({ type: 'rate', skillId: s.id, level: i })} />
                <span className="level-name">{LEVELS[i]}<span className="level-desc">{LEVEL_HELP[i]}</span></span>
                {last === i && !first && <span className="was">Last time</span>}
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
              {isLast ? `Send to ${person.manager.split(' ')[0]}` : 'Next'}
            </button>
            {rating === null && <span className="muted small">Choose a level to continue</span>}
          </div>
        </Card>
        {queue.length < skills.length && <p className="muted small">You can change any of the others afterwards.</p>}
      </>
    )
  }

  const rest = skills.filter(s => !attention.includes(s))
  return (
    <>
      <PageHeader item="skills" />
      {first ? (
        <Card className="since" label="Your first ratings">
          <h2>Rate your {t('skill')} for {person.role}</h2>
          <p>{skills.length} {t('skill')}, about 8 minutes. {person.manager} asked for them by <strong>{DUE_DATE}</strong>. They shape the {t('gig')}, {t('mentor')} and {t('course')} we suggest.</p>
          <div className="row">
            <button className="btn primary" onClick={() => { setQueue(skills); setStep(0) }}>Start rating</button>
          </div>
        </Card>
      ) : (
        <Card className="since" label="Since your last visit">
          <h2>Since your last visit on {LAST_VISIT}</h2>
          <ul className="since-list">
            {attention.map(s => <li key={s.id}><strong>{s.name}</strong><span className="muted">{cap(reason(s, s.lastRating))}</span></li>)}
          </ul>
          <p>The other {rest.length} carry over from last time. {person.manager} asked for these by <strong>{DUE_DATE}</strong>.</p>
          <div className="row">
            <button className="btn primary" onClick={() => { setQueue(attention); setStep(0) }}>Review {attention.length} that need attention</button>
            <button className="btn ghost" onClick={() => { setQueue([...attention, ...rest]); setStep(0) }}>Review all {skills.length}</button>
          </div>
        </Card>
      )}
      <h2 className="section">Your {t('skill')} for {person.role}</h2>
      <ul className="skill-list">
        {[...attention, ...rest].map(s => {
          const rating = state.ratings[s.id]
          return (
            <li key={s.id} id={`skill-${s.id}`} className={attention.includes(s) ? 'attention' : ''}>
              <div>
                <span className="skill-name">{s.name}</span>
                {flag(s, s.lastRating) && <span className="flag inline">{flag(s, s.lastRating)}</span>}
              </div>
              {editing === s.id ? (
                <span className="row-end">
                  <select autoFocus value={rating ?? ''} aria-label={`Rating for ${s.name}`}
                    onChange={e => dispatch({ type: 'rate', skillId: s.id, level: Number(e.target.value) as Level })}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditing(null) }}>
                    <option value="" disabled>Choose…</option>
                    {LEVELS.map((l, i) => <option key={l} value={i}>{l}</option>)}
                  </select>
                  <button className="link" onClick={() => setEditing(null)}>Done</button>
                </span>
              ) : (
                <span className="row-end"><LevelTag level={rating} /><button className="link" onClick={() => setEditing(s.id)} aria-label={`${rating === null ? 'Rate' : 'Change'} ${s.name}`}>{rating === null ? 'Rate' : 'Change'}</button></span>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}

function SkillsDone() {
  const { state, tenant } = useStore()
  const t = useTerm()
  const r = readiness(state)
  const top = gaps(state)[0]
  const opts = top ? optionsForSkill(top.skill.id) : null
  const from = `your ${t('skill')} results`
  const mentorsItem = resolveItem(tenant, 'mentors'), learningItem = resolveItem(tenant, 'learning')
  return (
    <>
      <PageHeader item="skills" title={`Your ${t('skill')} are up to date`} sub={`All ${skills.length} rated and sent. ${person.manager} can see them for your review.`} />
      <div className="grid-2">
        {top && opts && (
          <Card className="next" label="Your next step">
            <h2>Grow {top.skill.name}</h2>
            <p>You’re at <strong>{LEVELS[top.current]}</strong>; {targetRole(state)} needs <strong>{LEVELS[top.target]}</strong>. Pick one way to start:</p>
            <ul className="options">
              {opts.gigs[0] && <li><CrossLink to={`/explore/gigs/${opts.gigs[0].id}`} from={from}><span className="opt-kind">{cap(t('gig', 1))}</span>{opts.gigs[0].title}<Icon name="arrow" /></CrossLink></li>}
              {opts.mentors[0] && mentorsItem && <li><CrossLink to={mentorsItem.path} from={from}><span className="opt-kind">{cap(t('mentor', 1))}</span>{opts.mentors[0].name}, {opts.mentors[0].role}<Icon name="arrow" /></CrossLink></li>}
              {opts.courses[0] && learningItem && <li><CrossLink to={learningItem.path} from={from}><span className="opt-kind">{cap(t('course', 1))}</span>{opts.courses[0].title}<Icon name="arrow" /></CrossLink></li>}
            </ul>
          </Card>
        )}
        <Card>
          <h2 className="card-heading">Your target {t('role', 1)}</h2>
          <p><strong>{targetRole(state)}</strong></p>
          <Progress value={r.pct} />
          <p className="readiness small"><span>Ready on <strong>{r.ready} of {r.total}</strong> {t('skill')}</span></p>
          <Link className="more" to={{ pathname: '/', hash: '#growth' }}>See every gap <Icon name="arrow" /></Link>
        </Card>
      </div>
      <details className="all-ratings">
        <summary>All your ratings</summary>
        <ul className="skill-list compact">
          {skills.map(s => <li key={s.id}><span className="skill-name">{s.name}</span><LevelTag level={state.ratings[s.id]} /></li>)}
        </ul>
      </details>
    </>
  )
}

/* ---------------- About me (Personalize) ---------------- */

const VALUES = ['Learning new things', 'Recognition', 'Autonomy', 'Making an impact', 'Flexibility', 'Team spirit', 'Variety', 'Security']

export function AboutMe() {
  const { state, dispatch } = useStore()
  const t = useTerm()
  const [picked, setPicked] = useState<string[]>([])
  if (!state.aboutDone) {
    return (
      <>
        <PageHeader item="about" sub="Your values. About 2 minutes." />
        <Card>
          <h2>What matters most to you at work?</h2>
          <p className="muted">Pick three. They shape the {t('role')}, {t('gig')} and {t('mentor')} we suggest.</p>
          <div className="value-grid">
            {VALUES.map(v => {
              const on = picked.includes(v)
              return <button key={v} aria-pressed={on} className={'value' + (on ? ' on' : '')} disabled={!on && picked.length >= 3} onClick={() => setPicked(on ? picked.filter(x => x !== v) : [...picked, v])}>{v}</button>
            })}
          </div>
          <div className="row">
            <button className="btn primary" disabled={picked.length < 3} onClick={() => dispatch({ type: 'completeAbout', values: picked })}>Save</button>
            <span className="muted small" aria-live="polite">{picked.length < 3 ? `${3 - picked.length} more to pick` : 'Ready to save'}</span>
          </div>
        </Card>
      </>
    )
  }
  // Only the values exercise exists in the prototype; the others show what a returner would see.
  const sample = state.mode !== 'first'
  return (
    <>
      <PageHeader item="about" />
      <div className="grid-2">
        <Card><h2 className="card-heading">Values</h2><p><strong>{state.values.join(', ')}</strong></p><p className="meta">From your values exercise</p></Card>
        <Card><h2 className="card-heading">Strengths</h2>{sample ? <><p><strong>Customer insight, stakeholder management</strong></p><p className="meta">From your strengths exercise</p></> : <p className="muted">Not done yet · about 5 minutes</p>}</Card>
        <Card><h2 className="card-heading">Work style</h2>{sample ? <><p><strong>Social and influential</strong></p><p className="meta">From your work-style exercise</p></> : <p className="muted">Not done yet · about 5 minutes</p>}</Card>
        <Card><h2 className="card-heading">Career pace</h2>{sample ? <><p><strong>Building momentum</strong></p><p className="meta">From your agility exercise</p></> : <p className="muted">Not done yet · about 3 minutes</p>}</Card>
      </div>
    </>
  )
}
