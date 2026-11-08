import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { cap, fill, isLanding, term, itemsInSpace, spaceLabel, visibleSpaces, itemForPath, SPACES, resolveItem, type ItemId } from '../ia'
import { nextStep } from '../logic'
import { gigById, person } from '../data'
import { Icon } from './ui'
import logo from '../assets/fuel50-logo.svg'

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
  const openRef = useRef(open)
  openRef.current = open
  const loc = useLocation()
  const nav = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const current = itemForPath(loc.pathname)
  const step = nextStep(state, tenant)

  useEffect(() => setOpen(null), [loc.pathname])
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null) }
    // Escape closes the open menu and puts focus back on the button that opened it.
    // Found from the open menu, not from focus: Safari doesn't focus buttons on click.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !openRef.current) return
      ref.current?.querySelector<HTMLElement>(`[aria-controls="menu-${openRef.current}"]`)?.focus()
      setOpen(null)
    }
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [])

  // Main navigation is a deliberate jump: forget any cross-module origin.
  const clearOrigin = () => dispatch({ type: 'setOrigin', origin: null })
  const go = (path: string) => { clearOrigin(); nav(path) }

  return (
    <header className="topbar" ref={ref}>
      <a className="skip" href="#main">Skip to content</a>
      <Link className="logo" to="/" onClick={clearOrigin} aria-label={`Fuel50 ${spaceLabel(tenant, 'home')}`}>
        <img src={logo} alt="" width={174} height={60} />
      </Link>
      <nav aria-label="Main">
        <ul className="spaces">
          {visibleSpaces(role).map(sp => {
            const isCurrent = current?.space === sp.id
            const items = itemsInSpace(tenant, sp.id)
            if (items.length === 0) return null
            const expanded = open === sp.id
            return (
              <li key={sp.id} className="has-menu">
                <button
                  className={'space' + (isCurrent ? ' current' : '')}
                  aria-expanded={expanded}
                  aria-controls={`menu-${sp.id}`}
                  aria-current={isCurrent ? 'true' : undefined}
                  onClick={() => setOpen(expanded ? null : sp.id)}
                >
                  {spaceLabel(tenant, sp.id)} <span className="caret"><Icon name="chevron" size={14} /></span>
                </button>
                {expanded && (
                  <div className="menu" id={`menu-${sp.id}`}>
                    <p className="menu-blurb">{fill(sp.blurb, tenant)}</p>
                    <ul className="plain-menu">
                      {items.map(it => (
                        <li key={it.id}>
                          <Link to={it.path} onClick={clearOrigin} aria-current={current?.id === it.id ? 'page' : undefined} className={'menu-item' + (current?.id === it.id ? ' current' : '')}>
                            <span className="menu-label">{it.label}</span>
                            <span className="menu-desc">{it.description}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
      <button className="search-trigger" onClick={onSearch} aria-label="Search" aria-keyshortcuts="Control+K Meta+K /">
        <Icon name="search" /> <span className="search-text">Search pages, {term(tenant, 'gig')}, {term(tenant, 'skill')}…</span><kbd>⌘K</kbd>
      </button>
      <button
        className="next-pill"
        title={step.detail}
        // Already there: take you to the page title rather than doing nothing.
        onClick={() => (loc.pathname + loc.hash === step.path ? document.querySelector<HTMLElement>('main h1')?.focus() : go(step.path))}
      >
        <span className="dot" aria-hidden /> <span className="next-label">Next:</span> <span className="next-text">{step.title}</span>
      </button>
      <AvatarMenu open={open === 'avatar'} setOpen={o => setOpen(o ? 'avatar' : null)} onNavigate={clearOrigin} />
    </header>
  )
}

function AvatarMenu({ open, setOpen, onNavigate }: { open: boolean; setOpen: (o: boolean) => void; onNavigate: () => void }) {
  const { tenant } = useStore()
  const profile = resolveItem(tenant, 'about')
  return (
    <div className="avatar-wrap">
      <button className="avatar" aria-expanded={open} aria-controls="menu-avatar" onClick={() => setOpen(!open)} aria-label="Your account">
        {person.name.split(' ').map(p => p[0]).join('')}
      </button>
      {open && (
        <div className="menu avatar-menu" id="menu-avatar">
          <p className="menu-blurb"><strong>{person.name}</strong><br />{person.role}</p>
          <ul className="plain-menu">
            {profile && <li><Link className="menu-item" to={profile.path} onClick={onNavigate}><span className="menu-label">Your profile</span></Link></li>}
            <li role="separator" className="menu-sep" />
            {/* Only admins see this in the product; the prototype shows it so the Admin space can be reached. */}
            <li><Link className="menu-item" to="/admin" onClick={onNavigate}><span className="menu-label">Open {spaceLabel(tenant, 'admin')}</span><span className="menu-desc">Set up skills, roles and reports for your organisation</span></Link></li>
          </ul>
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
  // Every space has its own page, so the space crumb is always a link; on that page it is the last crumb.
  // Home's items need no space crumb: the first crumb is already Home.
  const crumbs: { label: string; path?: string }[] = space.id === 'home' ? [] : [{ label: spaceLabel(tenant, space.id), path: space.path }]
  if (!isLanding(item)) crumbs.push({ label: resolved?.label ?? cap(fill(item.label, tenant)), path: item.path })
  const gigMatch = loc.pathname.match(/^\/explore\/gigs\/(.+)$/)
  if (gigMatch) crumbs.push({ label: gigById(gigMatch[1])?.title ?? cap(term(tenant, 'gig', 1)) })
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
        <Icon name="back" /> Back to {o.label}
      </button>
      <button className="return-dismiss" aria-label="Dismiss" title="Dismiss" onClick={() => dispatch({ type: 'setOrigin', origin: null })}><Icon name="close" size={14} /></button>
    </div>
  )
}

export function Toasts() {
  const { state, tenant, dispatch } = useStore()
  const nav = useNavigate()
  // Hovering or focusing a toast holds it, so there's time to use its link.
  const [held, setHeld] = useState(false)
  useEffect(() => {
    if (!state.toasts.length || held) return
    const t = setTimeout(() => dispatch({ type: 'dismissToast', id: state.toasts[0].id }), 6000)
    return () => clearTimeout(t)
  }, [state.toasts, held, dispatch])
  useEffect(() => { if (!state.toasts.length) setHeld(false) }, [state.toasts.length])
  return (
    <div className="toasts" aria-live="polite" onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      {state.toasts.map(t => (
        <div key={t.id} className="toast">
          <span>{fill(t.text, tenant)}</span>
          {t.link && <button className="toast-link" onClick={() => { dispatch({ type: 'dismissToast', id: t.id }); nav(t.link!.path) }}>{t.link.label}</button>}
          <button aria-label="Dismiss" title="Dismiss" className="toast-x" onClick={() => dispatch({ type: 'dismissToast', id: t.id })}><Icon name="close" size={14} /></button>
        </div>
      ))}
    </div>
  )
}
