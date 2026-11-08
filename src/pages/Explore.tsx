import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { cap, isLanding, itemsInSpace, pageTitle, resolveItem, term, type TermId } from '../ia'
import { CATALOGUE, courses, gigById, gigs, LEVELS, mentors, paths, person, skillById, skills, vacancies, type CareerPath } from '../data'
import { gaps, neededSkills, noRatingsYet, optionsForSkill, readiness, targetRole } from '../logic'
import { Card, Empty, Icon, LevelTag, PageHeader, Progress, SkillChip } from '../components/ui'
import { CrossLink } from '../components/nav'
import { NotFound } from './Misc'

const useTerm = () => {
  const { tenant } = useStore()
  return (id: TermId, n?: number) => term(tenant, id, n)
}

/** Heading and key for a list of opportunities: only the ones that help, with the skills you need highlighted. */
function HelpsHead({ noun }: { noun: TermId }) {
  const { state } = useStore()
  const t = useTerm()
  return (
    <div className="helps-head">
      <h2>{cap(t(noun))} that help your growth</h2>
      <p className="chip-legend"><span className="skill-chip need" aria-hidden>Skill</span> one {targetRole(state)} needs you to grow</p>
    </div>
  )
}

/** The rest of the catalogue: out of the prototype's scope, and it says so. */
function SearchAll({ noun }: { noun: 'gig' | 'mentor' | 'course' }) {
  const { dispatch } = useStore()
  const t = useTerm()
  const n = CATALOGUE[noun]
  return <p className="search-all"><button className="link" onClick={() => dispatch({ type: 'notInPrototype', what: 'Searches of the full catalogue' })}>Search all {n.toLocaleString('en-GB')} {t(noun, n)}</button></p>
}

/** Opportunities that use at least one skill you need, the ones using most first. */
const helping = <T,>(list: T[], skillsOf: (x: T) => string[], need: Set<string>) =>
  list.map(x => ({ x, n: skillsOf(x).filter(id => need.has(id)).length })).filter(o => o.n > 0).sort((a, b) => b.n - a.n).map(o => o.x)

/** Explore's own page: what each part holds, and what in it matches your biggest gap. */
export function ExploreOverview() {
  const { state, tenant } = useStore()
  const t = useTerm()
  const top = gaps(state)[0]
  const opts = top ? optionsForSkill(top.skill.id) : null
  const status: Record<string, string> = {
    'skill-library': `${skills.length} ${t('skill')} · ${gaps(state).length} below your target`,
    roles: `1 target · ${otherRoles(targetRole(state), !!resolveItem(tenant, 'vacancies')).length} more to look at`,
    paths: `${paths.length} ${t('path', paths.length)} · 1 saved`,
    gigs: `${gigs.length} open${top ? ` · ${opts!.gigs.length} ${opts!.gigs.length === 1 ? 'grows' : 'grow'} ${top.skill.name}` : ''}`,
    mentors: `${mentors.length} available${top ? ` · ${opts!.mentors.length} for ${top.skill.name}` : ''}`,
    learning: `${courses.length} ${t('course', courses.length)}${top ? ` · ${opts!.courses.length} for ${top.skill.name}` : ''}`,
    vacancies: `${vacancies.length} open ${t('role', vacancies.length)}`,
  }
  return (
    <>
      <PageHeader item="explore-overview" />
      <div className="grid-2">
        {itemsInSpace(tenant, 'explore').filter(i => !isLanding(i)).map(it => (
          <Link key={it.id} to={it.path} className="tile">
            <span className="tile-title">{pageTitle(tenant, it)}</span>
            <span className="tile-desc">{it.description}</span>
            <span className="tile-status">{status[it.id]}</span>
          </Link>
        ))}
      </div>
    </>
  )
}

/* ---------------- Skills and roles as things to look up (IA option B) ---------------- */

/** Explore › Skills: every skill as a thing to look up. Rating them is a task on Home. */
export function SkillLibrary() {
  const { state, tenant } = useStore()
  const t = useTerm()
  const [onlyGaps, setOnlyGaps] = useState(false)
  const g = gaps(state)
  const list = onlyGaps ? g.map(x => x.skill) : skills
  const update = resolveItem(tenant, 'skills')
  const from = `all your ${t('skill')}`
  return (
    <>
      <PageHeader item="skill-library">
        {update && <CrossLink className={'btn ' + (state.assessmentDone ? 'ghost' : 'primary')} to={update.path} from={from}>{update.label}</CrossLink>}
      </PageHeader>
      <div className="filters" role="group" aria-label={`Filter ${t('skill')}`}>
        <button className="chip-btn" aria-pressed={!onlyGaps} onClick={() => setOnlyGaps(false)}>All ({skills.length})</button>
        <button className="chip-btn" aria-pressed={onlyGaps} onClick={() => setOnlyGaps(true)}>Below your target ({g.length})</button>
      </div>
      <ul className="skill-list">
        {list.map(s => {
          const gap = g.find(x => x.skill.id === s.id)
          const o = optionsForSkill(s.id)
          const n = o.gigs.length + o.mentors.length + o.courses.length
          return (
            <li key={s.id} id={`skill-${s.id}`}>
              <div className="skill-def">
                <span className="skill-name">{s.name}</span>
                <span className="meta">{s.description}</span>
              </div>
              <span className="row-end">
                <LevelTag level={state.ratings[s.id]} />
                {gap && <span className="meta">needs {LEVELS[gap.target]}</span>}
                {gap && n > 0 && <CrossLink to={`/#gap-${s.id}`} from={from}>{n} way{n === 1 ? '' : 's'} to grow</CrossLink>}
              </span>
            </li>
          )
        })}
      </ul>
    </>
  )
}

/** Roles you could aim for, other than your own and your target: every step on a career path, then open vacancies if the client uses them. */
function otherRoles(target: string, withVacancies: boolean) {
  const titles = [...new Set([...paths.flatMap(p => p.steps), ...(withVacancies ? vacancies.map(v => v.title) : [])])]
  return titles
    .filter(title => title !== person.role && title !== target)
    .map(title => ({ title, paths: paths.filter(p => p.steps.includes(title)), vacancy: vacancies.find(v => v.title === title) }))
}

/** Explore › Roles: your target role and the others you could aim for. Closing the gaps happens on Home. */
export function Roles() {
  const { state, tenant } = useStore()
  const t = useTerm()
  const r = readiness(state)
  const target = targetRole(state)
  const pathsItem = resolveItem(tenant, 'paths'), vacanciesItem = resolveItem(tenant, 'vacancies')
  const open = (title: string) => (vacanciesItem ? vacancies.find(v => v.title === title) : undefined)
  const targetOpen = open(target)
  const from = `${t('role')}`
  return (
    <>
      <PageHeader item="roles" />
      <Card>
        <h2 className="card-heading">Your target {t('role', 1)}</h2>
        <p><strong>{target}</strong>{targetOpen && vacanciesItem && <> · <Link to={vacanciesItem.path}>open now, {closesIn(targetOpen.closesInDays)}</Link></>}</p>
        <Progress value={r.pct} />
        <p className="readiness small"><span>Ready on <strong>{r.ready} of {r.total}</strong> {t('skill')}</span></p>
        <div className="row">
          <CrossLink className="more" to="/#develop-h" from={from}>See what to develop <Icon name="arrow" /></CrossLink>
          {pathsItem && <Link className="more" to={pathsItem.path}>Change your {t('path', 1)} <Icon name="arrow" /></Link>}
        </div>
      </Card>
      <h2 className="section">Other {t('role')}</h2>
      <ul className="cards">
        {otherRoles(target, !!vacanciesItem).map(o => {
          const v = open(o.title)
          return (
            <li key={o.title}><div className="card">
              <h3 className="card-title">{o.title}</h3>
              <span className="card-meta">
                {o.paths.length > 0 && pathsItem && <>On the <Link to={pathsItem.path}>{o.paths.map(p => p.title).join(', ')}</Link> {t('path', o.paths.length)}</>}
                {o.paths.length > 0 && v && ' · '}
                {v && vacanciesItem && <Link to={vacanciesItem.path}>Open now, {closesIn(v.closesInDays)}</Link>}
              </span>
            </div></li>
          )
        })}
      </ul>
    </>
  )
}

const gigSkills = (g: { grow: string[]; have: string[] }) => [...g.grow, ...g.have]

export function Gigs() {
  const { state } = useStore()
  const need = neededSkills(state)
  return (
    <>
      <PageHeader item="gigs" />
      <HelpsHead noun="gig" />
      <ul className="cards">
        {helping(gigs, gigSkills, need).map(g => {
          const applied = state.applications.some(a => a.gigId === g.id)
          return (
            <li key={g.id}>
              <Link to={`/explore/gigs/${g.id}`} className="card link-card">
                <h3 className="card-title">{g.title}</h3>
                <span className="card-meta">{g.team} · {g.weeks} weeks · {g.hoursPerWeek} h a week{applied && <span className="status ok">Applied</span>}</span>
                <span className="chips">{gigSkills(g).map(id => <SkillChip key={id} id={id} need={need.has(id)} />)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
      <SearchAll noun="gig" />
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
  const need = neededSkills(state)
  const other = g.grow[0] ? optionsForSkill(g.grow[0]) : null
  const mentorsItem = resolveItem(tenant, 'mentors'), learningItem = resolveItem(tenant, 'learning')
  const send = () => {
    dispatch({ type: 'apply', gigId: g.id, title: g.title, managerTold: told === 'yes' })
    requestAnimationFrame(() => after.current?.focus())
  }

  return (
    <>
      <PageHeader title={g.title} sub={`${g.team} · posted by ${g.owner} · ${g.weeks} weeks, about ${g.hoursPerWeek} hours a week`}>
        {applied
          ? <Link ref={after} className="btn done" to={{ pathname: '/', hash: '#plan' }}><Icon name="check" /> Applied · view in your {t('plan', 1)}</Link>
          : <button className="btn primary" onClick={() => dialog.current?.showModal()}>Apply</button>}
      </PageHeader>
      <div className="grid-2">
        <Card><h2 className="card-heading">About this {t('gig', 1)}</h2><p>{g.summary}</p></Card>
        <Card>
          <h2 className="card-heading">{cap(t('skill'))} it uses</h2>
          <p className="chips">{gigSkills(g).map(s => <SkillChip key={s} id={s} need={need.has(s)} />)}</p>
          {gigSkills(g).some(s => need.has(s)) && <p className="small">Helps close a gap for <CrossLink to="/#growth" from={`“${g.title}”`}>{targetRole(state)}</CrossLink>.</p>}
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
  const need = neededSkills(state)
  return (
    <>
      <PageHeader item="mentors" />
      <HelpsHead noun="mentor" />
      <ul className="cards">
        {helping(mentors, m => m.skills, need).map(m => {
          const asked = state.mentorRequests.includes(m.id)
          return (
            <li key={m.id}><div className="card">
              <h3 className="card-title">{m.name}</h3>
              <span className="card-meta">{m.role}</span>
              <p>{m.blurb}</p>
              <span className="chips">{m.skills.map(s => <SkillChip key={s} id={s} need={need.has(s)} />)}</span>
              <div className="row">
                <button className={'btn' + (asked ? ' done' : '')} disabled={asked} onClick={() => dispatch({ type: 'requestMentor', id: m.id, name: m.name })}>
                  {asked ? <><Icon name="check" /> Requested</> : `Ask to be my ${t('mentor', 1)}`}
                </button>
              </div>
            </div></li>
          )
        })}
      </ul>
      <SearchAll noun="mentor" />
    </>
  )
}

export function Learning() {
  const { state, dispatch } = useStore()
  const t = useTerm()
  const plan = `your ${t('plan', 1)}`
  const need = neededSkills(state)
  return (
    <>
      <PageHeader item="learning" />
      <HelpsHead noun="course" />
      <ul className="cards">
        {helping(courses, c => c.skills, need).map(c => {
          const added = state.courses.includes(c.id)
          return (
            <li key={c.id}><div className="card">
              <h3 className="card-title">{c.title}</h3>
              <span className="card-meta">{c.provider} · {c.hours} h</span>
              <span className="chips">{c.skills.map(s => <SkillChip key={s} id={s} need={need.has(s)} />)}</span>
              <div className="row">
                <button className={'btn' + (added ? ' done' : '')} disabled={added} onClick={() => dispatch({ type: 'addCourse', id: c.id, title: c.title })}>
                  {added ? <><Icon name="check" /> In {plan}</> : `Add to ${plan}`}
                </button>
              </div>
            </div></li>
          )
        })}
      </ul>
      <SearchAll noun="course" />
    </>
  )
}

/**
 * A career path's steps: where you are now (left), the target role it sets (filling the
 * middle), and what's beyond (right). With `ready`, the target shows how ready you are,
 * as a bar along its bottom edge.
 */
export function PathSteps({ path, ready }: { path: CareerPath; ready?: { pct: number; label: ReactNode } }) {
  const [now, target, ...beyond] = path.steps
  return (
    <ol className="path">
      <li className="now">{now}<span>now</span></li>
      <li className="target">
        <span className="target-body">
          <span className="target-name">{target}<span>target</span></span>
          {ready && <span className="path-ready">{ready.label}</span>}
        </span>
        {ready && <span className="path-bar" aria-hidden><i style={{ width: `${ready.pct}%` }} /></span>}
      </li>
      {beyond.map(s => <li key={s}>{s}</li>)}
    </ol>
  )
}

/** Choose your career path. Its next step becomes your target role, and your gaps follow. */
export function CareerPaths() {
  const { state, dispatch } = useStore()
  const t = useTerm()
  // With no ratings yet, readiness would be a guess.
  const unrated = noRatingsYet(state)
  return (
    <>
      <PageHeader item="paths" />
      <fieldset className="path-choice">
        <legend className="visually-hidden">Your career {t('path', 1)}</legend>
        {paths.map(p => {
          const on = p.id === state.pathId
          const r = readiness(state, p.steps[1])
          return (
            <label key={p.id} className={'card path-option' + (on ? ' saved' : '')}>
              <input type="radio" name="career-path" checked={on} onChange={() => dispatch({ type: 'setPath', id: p.id })} />
              <span className="gap-head">
                <span className="card-heading-lg">{p.title}</span>
                {on && <span className="status ok">Saved</span>}
              </span>
              <span className="meta">Sets your target {t('role', 1)} to {p.steps[1]}.</span>
              <PathSteps path={p} ready={unrated ? undefined : { pct: r.pct, label: <>Ready on <strong>{r.ready} of {r.total}</strong> {t('skill')}</> }} />
            </label>
          )
        })}
      </fieldset>
      <div className="row">
        <button className="btn ghost" onClick={() => dispatch({ type: 'notInPrototype', what: `Custom career ${t('path')}` })}>Make a custom {t('path', 1)}</button>
      </div>
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
