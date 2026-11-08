import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { cap, fill, isLanding, term, pageTitle, spaceLabel, spaceBlurb, itemsInSpace, visibleSpaces, itemForPath, SPACES, resolveItem, type ItemId } from '../ia'
import { tasks } from '../logic'
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

export function TopNav({ onSearch, onCoach }: { onSearch: () => void; onCoach: () => void }) {
  const { tenant, role, dispatch } = useStore()
  const [open, setOpen] = useState<string | null>(null)
  const openRef = useRef(open)
  openRef.current = open
  const loc = useLocation()
  const ref = useRef<HTMLDivElement>(null)
  const current = itemForPath(loc.pathname)
  const menu = itemsInSpace(tenant, 'explore')
  // Beside Your growth: the other spaces with their own top-bar link (Your team and Admin, for managers).
  const links = visibleSpaces(role).filter(sp => sp.nav === 'link' && sp.id !== 'home')

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

  return (
    <header className="topbar" ref={ref}>
      <a className="skip" href="#main">Skip to content</a>
      <Link className="logo" to="/" onClick={clearOrigin} aria-label={`Fuel50: ${spaceLabel(tenant, 'home')}`}>
        <img src={logo} alt="" width={174} height={60} />
      </Link>
      <nav aria-label="Main">
        <ul className="spaces">
          {/* The link goes Home; the chevron opens Explore. */}
          <li className="has-menu split">
            <Link to="/" onClick={clearOrigin} className={'space' + (current?.space === 'home' ? ' current' : '')} aria-current={loc.pathname === '/' ? 'page' : undefined}>{spaceLabel(tenant, 'home')}</Link>
            <button
              className={'space caret-btn' + (current?.space === 'explore' ? ' current' : '')}
              aria-expanded={open === 'more'}
              aria-controls="menu-more"
              aria-label={`More: ${menu.map(it => pageTitle(tenant, it)).join(', ')}`}
              onClick={() => setOpen(open === 'more' ? null : 'more')}
            >
              <span className="caret"><Icon name="chevron" size={16} /></span>
            </button>
            {open === 'more' && (
              <div className="menu" id="menu-more">
                <ul className="plain-menu">
                  {menu.map(it => (
                    <li key={it.id}>
                      <Link to={it.path} onClick={clearOrigin} aria-current={current?.id === it.id ? 'page' : undefined} className={'menu-item' + (current?.id === it.id ? ' current' : '')}>
                        <span className="menu-label">{pageTitle(tenant, it)}</span>
                        <span className="menu-desc">{isLanding(it) ? spaceBlurb(tenant, it.space) : it.description}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
          {links.map(sp => (
            <li key={sp.id}>
              <Link to={sp.path} onClick={clearOrigin} className={'space' + (current?.space === sp.id ? ' current' : '')} aria-current={loc.pathname === sp.path ? 'page' : current?.space === sp.id ? 'true' : undefined}>{spaceLabel(tenant, sp.id)}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <button className="search-trigger" onClick={onSearch} aria-label="Search" aria-keyshortcuts="Control+K Meta+K /">
        <Icon name="search" /> <span className="search-text">Search pages, {term(tenant, 'gig')}, {term(tenant, 'skill')}…</span>
      </button>
      <button className="coach-trigger" onClick={onCoach} aria-label="Chat to your coach">
        <Icon name="chat" size={20} /><span className="coach-text">Chat to your coach</span>
      </button>
      <AvatarMenu open={open === 'avatar'} setOpen={o => setOpen(o ? 'avatar' : null)} onNavigate={clearOrigin} />
    </header>
  )
}

function AvatarMenu({ open, setOpen, onNavigate }: { open: boolean; setOpen: (o: boolean) => void; onNavigate: () => void }) {
  const { state, tenant } = useStore()
  const profile = resolveItem(tenant, 'about'), tasksItem = resolveItem(tenant, 'tasks')
  const n = tasks(state, tenant).length
  return (
    <div className="avatar-wrap">
      <button className="avatar" aria-expanded={open} aria-controls="menu-avatar" onClick={() => setOpen(!open)} aria-label={`Your account${n ? `, ${n} outstanding task${n === 1 ? '' : 's'}` : ''}`}>
        {person.name.split(' ').map(p => p[0]).join('')}
        {n > 0 && <span className="alert-dot" aria-hidden />}
      </button>
      {open && (
        <div className="menu avatar-menu" id="menu-avatar">
          <p className="menu-blurb"><strong>{person.name}</strong><br />{person.role}</p>
          <ul className="plain-menu">
            {profile && <li><Link className="menu-item" to={profile.path} onClick={onNavigate}><span className="menu-label">{spaceLabel(tenant, 'profile')}</span><span className="menu-desc">{spaceBlurb(tenant, 'profile')}</span></Link></li>}
            {tasksItem && <li><Link className="menu-item" to={tasksItem.path} onClick={onNavigate}><span className="menu-label">{tasksItem.label} ({n}){n > 0 && <span className="alert-dot inline" aria-hidden />}</span></Link></li>}
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
