import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { LEVELS, reports, skillById, DUE_DATE, type Level } from '../data'
import { Card, Empty, PageHeader } from '../components/ui'

export function Team() {
  const { state } = useStore()
  return (
    <>
      <PageHeader item="team" />
      <ul className="cards">
        {reports.map(r => {
          const left = r.dueSkills.filter(s => state.teamRatings[r.id]?.[s] === undefined).length
          return (
            <li key={r.id}><div className="card">
              <span className="card-title">{r.name}</span>
              <span className="card-kicker">{r.role}</span>
              <p>{r.dueSkills.length === 0 ? 'Nothing due' : left ? `${left} skills to rate by ${DUE_DATE}` : 'All rated'}</p>
              {left > 0 && <Link className="btn" to={`/team/reviews?p=${r.id}`}>Rate skills</Link>}
            </div></li>
          )
        })}
      </ul>
    </>
  )
}

/** Rate a report’s skills inline: one click per skill, no modal per skill. */
export function Reviews() {
  const { state, dispatch } = useStore()
  const due = reports.filter(r => r.dueSkills.length)
  const [params] = useSearchParams()
  const fromUrl = params.get('p')
  const [who, setWho] = useState(fromUrl && due.some(r => r.id === fromUrl) ? fromUrl : due[0]?.id)
  const rep = reports.find(r => r.id === who)
  return (
    <>
      <PageHeader item="reviews" sub={`Rate each person’s skills for their current role. Due ${DUE_DATE}.`} />
      <div className="filters" role="tablist" aria-label="People">
        {due.map(r => <button key={r.id} role="tab" aria-selected={who === r.id} className="chip-btn" aria-pressed={who === r.id} onClick={() => setWho(r.id)}>{r.name}</button>)}
      </div>
      {!rep ? <Empty>Nothing due.</Empty> : (
        <Card>
          <h2>{rep.name}, {rep.role}</h2>
          <table className="rate-table">
            <thead><tr><th scope="col">Skill</th>{LEVELS.slice(1).map(l => <th key={l} scope="col">{l}</th>)}</tr></thead>
            <tbody>
              {rep.dueSkills.map(sid => (
                <tr key={sid}>
                  <th scope="row">{skillById(sid).name}</th>
                  {[1, 2, 3, 4].map(l => {
                    const on = state.teamRatings[rep.id]?.[sid] === l
                    return <td key={l}><button className={'dot-btn' + (on ? ' on' : '')} aria-pressed={on} aria-label={`${skillById(sid).name}: ${LEVELS[l]}`} onClick={() => dispatch({ type: 'rateReport', reportId: rep.id, skillId: sid, level: l as Level })} /></td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small">One click per skill, saved as you go.</p>
        </Card>
      )}
    </>
  )
}

export function Mentees() {
  return (<><PageHeader item="mentees" /><Empty>You’re not mentoring anyone yet.</Empty></>)
}
