import { Link } from 'react-router-dom'
import { ADMIN_TOOLS } from '../ia'
import { PageHeader } from '../components/ui'

export function Admin() {
  return (
    <>
      <PageHeader item="admin" sub="Where your organisation sets up Fuel50. Only admins can open it, and leaving it takes you back to where you were." />
      <section aria-labelledby="moved-h">
        <h2 id="moved-h" className="section-first">Moved out of the employee experience</h2>
        <p className="page-sub">These used to sit alongside employees’ own tools. In the proposed IA they live only here, so employees’ menus hold only what’s theirs.</p>
        <ul className="moved-list">
          {ADMIN_TOOLS.map(t => (
            <li key={t.name}>
              <strong>{t.name}</strong><span className="meta">{t.does}</span>
            </li>
          ))}
        </ul>
      </section>
      <p className="meta admin-note">The admin tools themselves are out of scope for this prototype.</p>
    </>
  )
}

export function NotFound() {
  return (<><PageHeader title="Page not found" sub="It may have moved, or your organisation may not use it." /><Link to="/">Go to Home</Link></>)
}
