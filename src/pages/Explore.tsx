import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { cap, isLanding, itemsInSpace, resolveItem, term, type TermId } from '../ia'
import { courses, gigById, gigs, mentors, paths, person, skillById, targetRole, vacancies } from '../data'
import { gaps, optionsForSkill } from '../logic'
import { Card, Empty, Icon, PageHeader, SkillChip } from '../components/ui'
import { NotFound } from './Misc'

const useTerm = () => {
  const { tenant } = useStore()
  return (id: TermId, n?: number) => term(tenant, id, n)
}

function ChipLegend() {
  return (
    <p className="chip-legend" aria-hidden>
      <span className="grow"><i /> You’d grow</span>
      <span className="have"><i /> You already have</span>
    </p>
  )
}

/** Explore's own page: what each part holds, and what matches your biggest gap. */
export function ExploreOverview() {
  const { state, tenant } = useStore()
  const t = useTerm()
  const top = gaps(state)[0]
  const opts = top ? optionsForSkill(top.skill.id) : null
  const status: Record<string, string> = {
    paths: `${paths.length} ${t('path', paths.length)} · ${paths.filter(p => p.saved).length} saved`,
    gigs: `${gigs.length} open${top ? ` · ${opts!.gigs.length} ${opts!.gigs.length === 1 ? 'grows' : 'grow'} ${top.skill.name}` : ''}`,
    mentors: `${mentors.length} available${top ? ` · ${opts!.mentors.length} for ${top.skill.name}` : ''}`,
    learning: `${courses.length} ${t('course', courses.length)}${top ? ` · ${opts!.courses.length} for ${top.skill.name}` : ''}`,
    vacancies: `${vacancies.length} open ${t('role', vacancies.length)}`,
  }
  return (
    <>
      <PageHeader item="explore-overview" />
      {top && opts && (
        <Card className="next" label="Matched to your biggest gap">
          <h2>{top.skill.name} is your biggest gap</h2>
          <p className="muted">For {targetRole.title}. {opts.gigs.length} {t('gig', opts.gigs.length)}, {opts.mentors.length} {t('mentor', opts.mentors.length)} and {opts.courses.length} {t('course', opts.courses.length)} can help.</p>
          <Link className="more" to={`/growth/targets#gap-${top.skill.id}`}>See your options <Icon name="arrow" /></Link>
        </Card>
      )}
      <div className="grid-2">
        {itemsInSpace(tenant, 'explore').filter(i => !isLanding(i)).map(it => (
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

export function Gigs() {
  const { state } = useStore()
  const t = useTerm()
  const top = gaps(state)[0]
  const [onlyGap, setOnlyGap] = useState(false)
  const list = onlyGap && top ? gigs.filter(g => g.grow.includes(top.skill.id)) : gigs
  return (
    <>
      <PageHeader item="gigs" />
      {top && (
        <div className="filters" role="group" aria-label={`Filter ${t('gig')}`}>
          <button className="chip-btn" aria-pressed={!onlyGap} onClick={() => setOnlyGap(false)}>All ({gigs.length})</button>
          <button className="chip-btn" aria-pressed={onlyGap} onClick={() => setOnlyGap(true)}>Grows {top.skill.name}</button>
        </div>
      )}
      <ChipLegend />
      <ul className="cards">
        {list.map(g => {
          const applied = state.applications.some(a => a.gigId === g.id)
          return (
            <li key={g.id}>
              <Link to={`/explore/gigs/${g.id}`} className="card link-card">
                <h2 className="card-title">{g.title}</h2>
                <span className="card-meta">{g.team} · {g.weeks} weeks · {g.hoursPerWeek} h a week{applied && <span className="status ok">Applied</span>}</span>
                <span className="chips">
                  {g.grow.map(id => <SkillChip key={id} id={id} kind="grow" />)}
                  {g.have.map(id => <SkillChip key={id} id={id} kind="have" />)}
                </span>
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
  const { state, dispatch, tenant } = useStore()
  const t = useTerm()
  const dialog = useRef<HTMLDialogElement>(null)
  const after = useRef<HTMLAnchorElement>(null)
  // Kept outside the dialog, so closing it (by accident or not) never loses what was typed.
  const [told, setTold] = useState<'yes' | 'no' | ''>('')
  const [note, setNote] = useState('')
  const applied = !!g && state.applications.some(a => a.gigId === g.id)
  useEffect(() => { if (applied && dialog.current?.open) dialog.current.close() }, [applied])
  if (!g) return <NotFound />

  const manager = person.manager.split(' ')[0]
  const other = g.grow[0] ? optionsForSkill(g.grow[0]) : null
  const mentorsItem = resolveItem(tenant, 'mentors'), learningItem = resolveItem(tenant, 'learning'), plan = resolveItem(tenant, 'plan')
  const send = () => {
    dispatch({ type: 'apply', gigId: g.id, title: g.title, managerTold: told === 'yes' })
    requestAnimationFrame(() => after.current?.focus())
  }

  return (
    <>
      <PageHeader title={g.title} sub={`${g.team} · posted by ${g.owner} · ${g.weeks} weeks, about ${g.hoursPerWeek} hours a week`}>
        {applied
          ? <Link ref={after} className="btn done" to="/growth/plan"><Icon name="check" /> Applied · view in your {plan?.label.toLowerCase() ?? 'plan'}</Link>
          : <button className="btn primary" onClick={() => dialog.current?.showModal()}>Apply</button>}
      </PageHeader>
      <div className="grid-2">
        <Card><h2 className="card-heading">About this {t('gig', 1)}</h2><p>{g.summary}</p></Card>
        <Card>
          <h2 className="card-heading">How it fits you</h2>
          <h3 className="sub-heading">You’d grow</h3>
          <p className="chips">{g.grow.length ? g.grow.map(s => <SkillChip key={s} id={s} kind="grow" />) : <span className="muted">Nothing new; a chance to share what you know.</span>}</p>
          <h3 className="sub-heading">You already have</h3>
          <p className="chips">{g.have.map(s => <SkillChip key={s} id={s} kind="have" />)}</p>
          {g.grow.some(s => skillById(s).target > (state.ratings[s] ?? 0)) && <p className="small">Helps close a gap for <Link to="/growth/targets">{targetRole.title}</Link>.</p>}
        </Card>
      </div>
      {other && (other.mentors.length > 0 || other.courses.length > 0) && (
        <Card className="muted-card">
          <h2 className="card-heading">Other ways to grow {skillById(g.grow[0]).name}</h2>
          <ul className="plain">
            {mentorsItem && other.mentors.map(m => <li key={m.id}><span>{m.name} <span className="muted">· {cap(t('mentor', 1))}, {m.role}</span></span><Link to={mentorsItem.path}>{mentorsItem.label}</Link></li>)}
            {learningItem && other.courses.map(c => <li key={c.id}><span>{c.title} <span className="muted">· {cap(t('course', 1))}, {c.hours} h</span></span><Link to={learningItem.path}>{learningItem.label}</Link></li>)}
          </ul>
        </Card>
      )}

      <dialog ref={dialog} className="dialog" aria-labelledby="apply-title" onClick={e => { if (e.target === e.currentTarget) e.currentTarget.close() }}>
        <form method="dialog" onSubmit={e => { e.preventDefault(); if (told) send() }}>
          <h2 id="apply-title">Apply for “{g.title}”</h2>
          <p className="muted">{g.owner} will reply within a week. {manager} gets a copy, so they’re not surprised.</p>
          <fieldset className="levels">
            <legend>Have you talked to {person.manager} about it?</legend>
            <label className={'level-option' + (told === 'yes' ? ' selected' : '')}><input type="radio" name="told" autoFocus checked={told === 'yes'} onChange={() => setTold('yes')} /> Yes</label>
            <label className={'level-option' + (told === 'no' ? ' selected' : '')}><input type="radio" name="told" checked={told === 'no'} onChange={() => setTold('no')} /> Not yet. I’ll tell them.</label>
          </fieldset>
          <label className="field">Why you’re interested <span className="muted">Optional</span><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} /></label>
          <div className="row">
            {!told && <span className="muted small row-note">Answer the question to send</span>}
            <button type="button" className="btn ghost" onClick={() => dialog.current?.close()}>Cancel</button>
            <button type="submit" className="btn primary" disabled={!told}>Send application</button>
          </div>
        </form>
      </dialog>
    </>
  )
}

export function Mentors() {
  const { state, dispatch } = useStore()
  const t = useTerm()
  return (
    <>
      <PageHeader item="mentors" />
      <ul className="cards">
        {mentors.map(m => {
          const asked = state.mentorRequests.includes(m.id)
          return (
            <li key={m.id}><div className="card">
              <h2 className="card-title">{m.name}</h2>
              <span className="card-meta">{m.role}</span>
              <p>{m.blurb}</p>
              <span className="chips">{m.skills.map(s => <SkillChip key={s} id={s} />)}</span>
              <div className="row">
                <button className={'btn' + (asked ? ' done' : '')} disabled={asked} onClick={() => dispatch({ type: 'requestMentor', id: m.id, name: m.name })}>
                  {asked ? <><Icon name="check" /> Requested</> : `Ask to be my ${t('mentor', 1)}`}
                </button>
              </div>
            </div></li>
          )
        })}
      </ul>
    </>
  )
}

export function Learning() {
  const { state, dispatch, tenant } = useStore()
  const plan = 'your ' + (resolveItem(tenant, 'plan')?.label.toLowerCase() ?? 'plan')
  return (
    <>
      <PageHeader item="learning" />
      <ul className="cards">
        {courses.map(c => {
          const added = state.courses.includes(c.id)
          return (
            <li key={c.id}><div className="card">
              <h2 className="card-title">{c.title}</h2>
              <span className="card-meta">{c.provider} · {c.hours} h</span>
              <span className="chips">{c.skills.map(s => <SkillChip key={s} id={s} />)}</span>
              <div className="row">
                <button className={'btn' + (added ? ' done' : '')} disabled={added} onClick={() => dispatch({ type: 'addCourse', id: c.id, title: c.title })}>
                  {added ? <><Icon name="check" /> In {plan}</> : `Add to ${plan}`}
                </button>
              </div>
            </div></li>
          )
        })}
      </ul>
    </>
  )
}

export function CareerPaths() {
  const t = useTerm()
  return (
    <>
      <PageHeader item="paths" />
      {paths.map(p => (
        <Card key={p.id} className={p.saved ? 'saved' : ''}>
          <div className="gap-head">
            <h2 className="card-heading-lg">{p.title}</h2>
            <span className={'status' + (p.saved ? ' ok' : '')}>{p.saved ? 'Saved' : 'Suggested'}</span>
          </div>
          {p.saved && <p className="meta">Your target {t('role', 1)} is on this {t('path', 1)}.</p>}
          <ol className="path">{p.steps.map((s, i) => <li key={s} className={i === 0 ? 'now' : s === targetRole.title ? 'target' : ''}>{s}{i === 0 && <span>now</span>}{s === targetRole.title && <span>target</span>}</li>)}</ol>
        </Card>
      ))}
    </>
  )
}

const closesIn = (days: number) => (days === 0 ? 'closes today' : days === 1 ? 'closes tomorrow' : `closes in ${days} days`)

export function Vacancies() {
  const { tenant } = useStore()
  const t = useTerm()
  if (!resolveItem(tenant, 'vacancies')) return <PageHeader title="Not available" sub="Your organisation doesn’t use this feature." />
  return (
    <>
      <PageHeader item="vacancies" />
      {vacancies.length === 0 ? <Empty>No open {t('role')} right now.</Empty> : (
        <ul className="cards">{vacancies.map(v => <li key={v.id}><div className="card"><h2 className="card-title">{v.title}</h2><span className="card-meta">{v.team} · {v.location} · {closesIn(v.closesInDays)}</span></div></li>)}</ul>
      )}
    </>
  )
}
