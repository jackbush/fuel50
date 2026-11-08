import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore, type VisitMode } from '../store'
import { TENANTS } from '../ia'

/** Prototype-only controls. Not part of the product. */
export function ProtoPanel() {
  const { state, dispatch } = useStore()
  const loc = useLocation()
  // Open on the email start screen; collapsed elsewhere so it doesn't cover the product.
  const [open, setOpen] = useState(loc.pathname === '/start')
  useEffect(() => { if (loc.pathname === '/start') setOpen(true) }, [loc.pathname])
  const nav = useNavigate()
  const modes: { id: VisitMode; label: string; start: string }[] = [
    { id: 'returner', label: 'Returner (every ~6 months)', start: '/start' },
    { id: 'first', label: 'First visit', start: '/' },
    { id: 'leader', label: 'Weekly manager', start: '/team' },
  ]
  return (
    <aside className={'proto' + (open ? '' : ' closed')} aria-label="Prototype controls">
      <button className="proto-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? 'Hide' : 'Prototype'} controls
      </button>
      {open && (
        <div className="proto-body">
          <p className="proto-title">Prototype controls</p>
          <label>Visit
            <select value={state.mode} onChange={e => { const m = modes.find(x => x.id === e.target.value)!; dispatch({ type: 'setMode', mode: m.id }); nav(m.start) }}>
              {modes.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </label>
          <label>Client config
            <select value={state.tenantId} onChange={e => dispatch({ type: 'setTenant', id: e.target.value })}>
              {TENANTS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <p className="proto-note">{TENANTS.find(t => t.id === state.tenantId)?.note}</p>
          <div className="proto-actions">
            <button onClick={() => { dispatch({ type: 'reset' }); nav(modes.find(m => m.id === state.mode)!.start) }}>Restart journey</button>
          </div>
        </div>
      )}
    </aside>
  )
}
