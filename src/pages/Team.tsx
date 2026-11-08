import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { cap, term } from '../ia'
import { LEVELS, reports, skillById, DUE_DATE, type Level } from '../data'
import { Card, Empty, Icon, PageHeader } from '../components/ui'

export function Team() {
  const { state, tenant } = useStore()
  return (
    <>
      <PageHeader item="team" />
      <ul className="cards">
        {reports.map(r => {
          const left = r.dueSkills.filter(s => state.teamRatings[r.id]?.[s] === undefined).length
          return (
            <li key={r.id}><div className="card">
              <h2 className="card-title">{r.name}</h2>
              <span className="card-meta">{r.role}</span>
              <p>{r.dueSkills.length === 0 ? 'Nothing due' : left ? `${left} ${term(tenant, 'skill', left)} to rate by ${DUE_DATE}` : <span className="status ok">All rated</span>}</p>
              {left > 0 && <div className="row"><Link className="btn" to={`/team/reviews?p=${r.id}`}>Rate {term(tenant, 'skill')}</Link></div>}
            </div></li>
          )
        })}
      </ul>
    </>
  )
}

/** Rate a report’s skills inline: one click per skill, no modal per skill. */
export function Reviews() {
  const { state, dispatch, tenant } = useStore()
  const due = reports.filter(r => r.dueSkills.length)
  const [params] = useSearchParams()
  const fromUrl = params.get('p')
  const [who, setWho] = useState(fromUrl && due.some(r => r.id === fromUrl) ? fromUrl : due[0]?.id)
  const rep = reports.find(r => r.id === who)
  const left = (id: string) => reports.find(r => r.id === id)!.dueSkills.filter(s => state.teamRatings[id]?.[s] === undefined).length
  const nextPerson = rep && left(rep.id) === 0 ? due.find(r => left(r.id) > 0) : undefined
  return (
    <>
      <PageHeader item="reviews" sub={`Rate each person’s ${term(tenant, 'skill')} for their current ${term(tenant, 'role', 1)}. Due ${DUE_DATE}.`} />
      <div className="filters" role="group" aria-label="Person">
        {due.map(r => (
          <button key={r.id} className="chip-btn" aria-pressed={who === r.id} onClick={() => setWho(r.id)}>
            {r.name}{left(r.id) === 0 && <Icon name="check" size={14} />}
          </button>
        ))}
      </div>
      {!rep ? <Empty>Nothing due.</Empty> : (
        <Card>
          <h2>{rep.name} <span className="muted">· {rep.role}</span></h2>
          <table className="rate-table">
            <thead><tr><th scope="col">{cap(term(tenant, 'skill', 1))}</th>{LEVELS.slice(1).map(l => <th key={l} scope="col">{l}</th>)}</tr></thead>
            <tbody>
              {rep.dueSkills.map(sid => (
                <tr key={sid}>
                  <th scope="row">{skillById(sid).name}</th>
                  {[1, 2, 3, 4].map(l => {
                    const on = state.teamRatings[rep.id]?.[sid] === l
                    return <td key={l} data-level={LEVELS[l]}><button className={'dot-btn' + (on ? ' on' : '')} aria-pressed={on} aria-label={`${skillById(sid).name}: ${LEVELS[l]}`} onClick={() => dispatch({ type: 'rateReport', reportId: rep.id, skillId: sid, level: l as Level })} /></td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="meta" aria-live="polite">
            {left(rep.id) === 0
              ? <>All rated for {rep.name.split(' ')[0]}. {nextPerson ? <button className="link" onClick={() => setWho(nextPerson.id)}>Next: {nextPerson.name}</button> : 'That’s everyone.'}</>
              : `One click per ${term(tenant, 'skill', 1)}, saved as you go.`}
          </p>
        </Card>
      )}
    </>
  )
}

export function Mentees() {
  const { tenant } = useStore()
  return (<><PageHeader item="mentees" /><Empty>You don’t have any {term(tenant, 'mentee')} yet.</Empty></>)
}
