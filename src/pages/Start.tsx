import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { spaceLabel, term } from '../ia'
import { person, DUE_DATE } from '../data'

/**
 * The journey’s entry point: a reminder email, outside Fuel50.
 * The returner arrives by deep link, not via Home.
 */
export function Start() {
  const nav = useNavigate()
  const { tenant, dispatch } = useStore()
  const skills = term(tenant, 'skill')
  return (
    <div className="email-stage">
      <p className="stage-note">Prototype start: the returner gets a reminder email six months after their last visit.</p>
      <article className="email" aria-label="Email">
        <header>
          <p><strong>From</strong> {person.manager} via Fuel50</p>
          <p><strong>To</strong> {person.name}</p>
          <p><strong>Subject</strong> Self-assessment due {DUE_DATE}</p>
        </header>
        <div className="email-body">
          <p>Hi {person.first},</p>
          <p>Before your six-monthly review, please confirm your {skills} in Fuel50 by <strong>{DUE_DATE}</strong>. Most of your ratings carry over from last time, so it should only take a few minutes.</p>
          <p>Thanks,<br />{person.manager.split(' ')[0]}</p>
          <button className="btn primary" onClick={() => { dispatch({ type: 'setOrigin', origin: null }); nav('/growth/skills') }}>Confirm my {skills}</button>
          <p className="small muted"><button className="link" onClick={() => nav('/')}>Or open Fuel50 {spaceLabel(tenant, 'home')} instead</button></p>
        </div>
      </article>
    </div>
  )
}
