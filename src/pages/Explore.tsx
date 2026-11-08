import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { resolveItem } from '../ia'
import { courses, gigById, gigs, mentors, paths, person, skillById, targetRole, vacancies } from '../data'
import { gaps, optionsForSkill } from '../logic'
import { Card, Empty, PageHeader, SkillChip } from '../components/ui'
import { NotFound } from './Misc'

export function Gigs() {
  const { state } = useStore()
  const top = gaps(state)[0]
  const [onlyGap, setOnlyGap] = useState(false)
  const list = onlyGap && top ? gigs.filter(g => g.grow.includes(top.skill.id)) : gigs
  return (
    <>
      <PageHeader item="gigs" />
      {top && (
        <div className="filters" role="group" aria-label="Filter gigs">
          <button className="chip-btn" aria-pressed={!onlyGap} onClick={() => setOnlyGap(false)}>All ({gigs.length})</button>
          <button className="chip-btn" aria-pressed={onlyGap} onClick={() => setOnlyGap(true)}>Grows {top.skill.name}</button>
        </div>
      )}
      <ul className="cards">
        {list.map(g => {
          const applied = state.applications.some(a => a.gigId === g.id)
          return (
            <li key={g.id}>
              <Link to={`/explore/gigs/${g.id}`} className="card link-card">
                <span className="card-kicker">{g.team} · {g.weeks} weeks · {g.hoursPerWeek} h/week{applied && ' · Applied'}</span>
                <span className="card-title">{g.title}</span>
                <span className="chips">{g.grow.map(id => <SkillChip key={id} id={id} kind="grow" />)}{g.have.map(id => <SkillChip key={id} id={id} kind="have" />)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}

export function GigDetail() {
  const { id } = useParams()
  const g = gigById(id ?? '')
  const { state, dispatch } = useStore()
  const [applying, setApplying] = useState(false)
  const [told, setTold] = useState<'yes' | 'no' | ''>('')
  if (!g) return <NotFound />
  const applied = state.applications.some(a => a.gigId === g.id)
  const other = g.grow[0] ? optionsForSkill(g.grow[0]) : null
  return (
    <>
      <PageHeader title={g.title} sub={`${g.team} · posted by ${g.owner} · ${g.weeks} weeks, about ${g.hoursPerWeek} hours a week`}>
        {applied ? <Link className="btn ghost" to="/growth/plan">Applied · view in my plan</Link> : <button className="btn primary" onClick={() => setApplying(true)}>Apply</button>}
      </PageHeader>
      <div className="grid-2">
        <Card><h2>About this gig</h2><p>{g.summary}</p></Card>
        <Card>
          <h2>How it fits you</h2>
          <p className="eyebrow">You’ve got this</p>
          <p className="chips">{g.have.map(s => <SkillChip key={s} id={s} kind="have" />)}</p>
          <p className="eyebrow">You’d grow this</p>
          <p className="chips">{g.grow.length ? g.grow.map(s => <SkillChip key={s} id={s} kind="grow" />) : <span className="muted">Nothing new; a chance to share what you know.</span>}</p>
          {g.grow.some(s => skillById(s).target > (state.ratings[s] ?? 0)) && <p className="small">Helps close a gap for <Link to="/growth/targets">{targetRole.title}</Link>.</p>}
        </Card>
      </div>
      {applying && !applied && (
        <div className="dialog-backdrop" onMouseDown={() => setApplying(false)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="apply-title" onMouseDown={e => e.stopPropagation()}>
            <h2 id="apply-title">Apply for “{g.title}”</h2>
            <fieldset className="levels">
              <legend>Have you talked to {person.manager} about it?</legend>
              <label className="level-option"><input type="radio" name="told" checked={told === 'yes'} onChange={() => setTold('yes')} /> Yes</label>
              <label className="level-option"><input type="radio" name="told" checked={told === 'no'} onChange={() => setTold('no')} /> Not yet. I’ll tell them.</label>
            </fieldset>
            <label className="field">Why you’re interested (optional)<textarea rows={3} /></label>
            <div className="row">
              <button className="btn ghost" onClick={() => setApplying(false)}>Cancel</button>
              <button className="btn primary" disabled={!told} onClick={() => { dispatch({ type: 'apply', gigId: g.id, title: g.title }); setApplying(false) }}>Send application</button>
            </div>
          </div>
        </div>
      )}
      {other && (other.mentors.length > 0 || other.courses.length > 0) && (
        <Card className="muted-card">
          <h2>Other ways to grow {skillById(g.grow[0]).name}</h2>
          <p>{other.mentors.map(m => m.name).join(', ')}{other.mentors.length && other.courses.length ? ' · ' : ''}{other.courses.map(c => c.title).join(', ')}</p>
          <p><Link to="/explore/mentors">Mentors</Link> · <Link to="/explore/learning">Learning</Link></p>
        </Card>
      )}
    </>
  )
}

export function Mentors() {
  const { state, dispatch } = useStore()
  return (
    <>
      <PageHeader item="mentors" />
      <ul className="cards">
        {mentors.map(m => {
          const asked = state.mentorRequests.includes(m.id)
          return (
            <li key={m.id}><div className="card">
              <span className="card-title">{m.name}</span>
              <span className="card-kicker">{m.role}</span>
              <p>{m.blurb}</p>
              <span className="chips">{m.skills.map(s => <SkillChip key={s} id={s} />)}</span>
              <div className="row"><button className="btn" disabled={asked} onClick={() => dispatch({ type: 'requestMentor', id: m.id, name: m.name })}>{asked ? 'Requested' : 'Ask to mentor me'}</button></div>
            </div></li>
          )
        })}
      </ul>
    </>
  )
}

export function Learning() {
  const { state, dispatch } = useStore()
  return (
    <>
      <PageHeader item="learning" />
      <ul className="cards">
        {courses.map(c => {
          const added = state.courses.includes(c.id)
          return (
            <li key={c.id}><div className="card">
              <span className="card-kicker">{c.provider} · {c.hours} h</span>
              <span className="card-title">{c.title}</span>
              <span className="chips">{c.skills.map(s => <SkillChip key={s} id={s} />)}</span>
              <div className="row"><button className="btn" disabled={added} onClick={() => dispatch({ type: 'addCourse', id: c.id, title: c.title })}>{added ? 'In your plan' : 'Add to my plan'}</button></div>
            </div></li>
          )
        })}
      </ul>
    </>
  )
}

export function CareerPaths() {
  return (
    <>
      <PageHeader item="paths" />
      {paths.map(p => (
        <Card key={p.id} className={p.saved ? 'saved' : ''}>
          <p className="eyebrow">{p.saved ? 'Saved · your target role is on this path' : 'Suggested'}</p>
          <h2>{p.title}</h2>
          <ol className="path">{p.steps.map((s, i) => <li key={s} className={i === 0 ? 'now' : s === targetRole.title ? 'target' : ''}>{s}{i === 0 && <span> (now)</span>}{s === targetRole.title && <span> (target)</span>}</li>)}</ol>
        </Card>
      ))}
    </>
  )
}

export function Vacancies() {
  const { tenant } = useStore()
  if (!resolveItem(tenant, 'vacancies')) return <><PageHeader title="Not available" sub="Your organisation doesn’t use this feature." /></>
  return (
    <>
      <PageHeader item="vacancies" />
      {vacancies.length === 0 ? <Empty>No open roles right now.</Empty> : (
        <ul className="cards">{vacancies.map(v => <li key={v.id}><div className="card"><span className="card-kicker">{v.team} · {v.location} · closes {v.closes}</span><span className="card-title">{v.title}</span></div></li>)}</ul>
      )}
    </>
  )
}
