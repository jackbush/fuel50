import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { itemsInSpace, spaceLabel, visibleSpaces, itemForPath, SPACES, resolveItem, type ItemId } from '../ia'
import { nextStep } from '../logic'
import { gigById, person } from '../data'

/** A link that crosses into another module. It remembers where you came from. */
export function CrossLink({ to, from, children, className }: { to: string; from: string; children: ReactNode; className?: string }) {
  const { dispatch } = useStore()
  const loc = useLocation()
  const nav = useNavigate()
  return (
    <a
      href={'#' + to}
      className={className}
      onClick={e => {
        e.preventDefault()
        dispatch({ type: 'setOrigin', origin: { label: from, path: loc.pathname + loc.hash } })
        nav(to)
      }}
    >
      {children}
    </a>
  )
}

export function TopNav({ onSearch }: { onSearch: () => void }) {
  const { state, tenant, role, dispatch } = useStore()
  const [open, setOpen] = useState<string | null>(null)
  const loc = useLocation()
  const nav = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const current = itemForPath(loc.pathname)
  const step = nextStep(state, tenant)

  useEffect(() => setOpen(null), [loc.pathname])
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null) }
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [])

  // Main navigation is a deliberate jump: forget any cross-module origin.
  const go = (path: string) => { dispatch({ type: 'setOrigin', origin: null }); nav(path) }

  return (
    <header className="topbar" ref={ref}>
      <a className="skip" href="#main">Skip to content</a>
      <button className="logo" onClick={() => go('/')} aria-label="Fuel50 home">
        <span className="logo-mark" aria-hidden>F</span> <span>Fuel50</span>
      </button>
      <nav aria-label="Main">
        <ul className="spaces">
          {visibleSpaces(role).map(sp => {
            const isCurrent = current?.space === sp.id
            if (sp.id === 'home')
              return (
                <li key={sp.id}>
                  <button className={'space' + (isCurrent ? ' current' : '')} aria-current={isCurrent ? 'page' : undefined} onClick={() => go('/')}>
                    {spaceLabel(tenant, 'home')}
                  </button>
                </li>
              )
            const items = itemsInSpace(tenant, sp.id)
            if (items.length === 0) return null
            const expanded = open === sp.id
            return (
              <li key={sp.id} className="has-menu">
                <button
                  className={'space' + (isCurrent ? ' current' : '')}
                  aria-expanded={expanded}
                  aria-controls={`menu-${sp.id}`}
                  onClick={() => setOpen(expanded ? null : sp.id)}
                >
                  {spaceLabel(tenant, sp.id)} <span aria-hidden className="caret">▾</span>
                </button>
                {expanded && (
                  <div className="menu" id={`menu-${sp.id}`} role="menu">
                    <p className="menu-blurb">{sp.blurb}</p>
                    {items.map(it => (
                      <button key={it.id} role="menuitem" className={'menu-item' + (current?.id === it.id ? ' current' : '')} onClick={() => go(it.path)}>
                        <span className="menu-label">{it.label}</span>
                        <span className="menu-desc">{it.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
      <button className="search-trigger" onClick={onSearch} aria-label="Search (Ctrl+K)">
        <span aria-hidden>⌕</span> Search people, roles, gigs, skills, pages…<kbd>⌘K</kbd>
      </button>
      <button className="next-pill" onClick={() => go(step.path)} title={step.detail}>
        <span className="dot" aria-hidden /> <span className="next-label">Next:</span> {step.title}
      </button>
      <AvatarMenu go={go} />
    </header>
  )
}

function AvatarMenu({ go }: { go: (p: string) => void }) {
  const [open, setOpen] = useState(false)
  const { tenant } = useStore()
  const about = resolveItem(tenant, 'about')
  return (
    <div className="avatar-wrap">
      <button className="avatar" aria-expanded={open} onClick={() => setOpen(!open)} aria-label="Your account">
        {person.name.split(' ').map(p => p[0]).join('')}
      </button>
      {open && (
        <div className="menu avatar-menu" role="menu">
          <p className="menu-blurb">{person.name}<br />{person.role}</p>
          {about && <button role="menuitem" className="menu-item" onClick={() => { setOpen(false); go('/growth') }}><span className="menu-label">My profile</span></button>}
          <button role="menuitem" className="menu-item" onClick={() => { setOpen(false); go('/admin') }}><span className="menu-label">Switch to Admin</span><span className="menu-desc">Only for admins. Same shell, keeps your place.</span></button>
          <button role="menuitem" className="menu-item" onClick={() => setOpen(false)}><span className="menu-label">Preferences</span></button>
        </div>
      )}
    </div>
  )
}

/** Breadcrumb from the URL: Space › Item › Object. Uses the client’s labels. */
export function Breadcrumbs() {
  const { tenant } = useStore()
  const loc = useLocation()
  const item = itemForPath(loc.pathname)
  if (!item || item.id === 'home') return null
  const resolved = resolveItem(tenant, item.id as ItemId)
  const space = SPACES.find(s => s.id === item.space)!
  const crumbs: { label: string; path?: string }[] = [{ label: spaceLabel(tenant, space.id), path: space.id === 'growth' ? '/growth' : undefined }]
  if (item.id !== 'growth-overview') crumbs.push({ label: resolved?.label ?? item.label, path: item.path })
  const gigMatch = loc.pathname.match(/^\/explore\/gigs\/(.+)$/)
  if (gigMatch) crumbs.push({ label: gigById(gigMatch[1])?.title ?? 'Gig' })
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol>
        <li><Link to="/">{spaceLabel(tenant, 'home')}</Link></li>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <li key={i}>
              {last || !c.path ? <span aria-current={last ? 'page' : undefined}>{c.label}</span> : <Link to={c.path}>{c.label}</Link>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Shown after a cross-module link: one click back to where you were. */
export function ReturnBanner() {
  const { state, dispatch } = useStore()
  const loc = useLocation()
  const nav = useNavigate()
  const o = state.origin
  if (!o || o.path.split('#')[0] === loc.pathname) return null
  return (
    <div className="return-banner" role="region" aria-label="Return">
      <button
        className="return-link"
        onClick={() => { dispatch({ type: 'setOrigin', origin: null }); nav(o.path) }}
      >
        ← Back to {o.label}
      </button>
      <button className="return-dismiss" aria-label="Dismiss" onClick={() => dispatch({ type: 'setOrigin', origin: null })}>×</button>
    </div>
  )
}

export function Toasts() {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  useEffect(() => {
    if (!state.toasts.length) return
    const t = setTimeout(() => dispatch({ type: 'dismissToast', id: state.toasts[0].id }), 6000)
    return () => clearTimeout(t)
  }, [state.toasts, dispatch])
  return (
    <div className="toasts" aria-live="polite">
      {state.toasts.map(t => (
        <div key={t.id} className="toast">
          <span>{t.text}</span>
          {t.link && <button className="toast-link" onClick={() => { dispatch({ type: 'dismissToast', id: t.id }); nav(t.link!.path) }}>{t.link.label}</button>}
          <button aria-label="Dismiss" className="toast-x" onClick={() => dispatch({ type: 'dismissToast', id: t.id })}>×</button>
        </div>
      ))}
    </div>
  )
}
