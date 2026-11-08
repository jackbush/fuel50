import { Link } from 'react-router-dom'
import { Card, PageHeader } from '../components/ui'

export function Admin() {
  return (
    <>
      <PageHeader item="admin" sub="A separate space for configuration and reporting. Out of scope for this prototype." />
      <Card><p>In the proposed IA, admin tools (Skills Studio, Talent Blueprint, Role Editor, reports) live here, not in employees’ menus. Switching in and out keeps your place.</p><Link to="/">Back to Home</Link></Card>
    </>
  )
}

export function NotFound() {
  return (<><PageHeader title="Page not found" sub="It may have moved, or your organisation may not use it." /><Link to="/">Go to Home</Link></>)
}
