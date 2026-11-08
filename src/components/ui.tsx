import { useEffect, useRef, type ReactNode } from 'react'
import { useStore } from '../store'
import { isLanding, resolveItem, spaceLabel, type ItemId } from '../ia'
import { LEVELS, skillById, type Level } from '../data'

/** Plain page title from the client’s label. Any slogan goes underneath, never instead. */
export function PageHeader({ item, title, sub, children }: { item?: ItemId; title?: string; sub?: ReactNode; children?: ReactNode }) {
  const { tenant } = useStore()
  const resolved = item ? resolveItem(tenant, item) : null
  const h1 = useRef<HTMLHeadingElement>(null)
  // A space's own page is titled with the space's name, matching its breadcrumb.
  const text = title ?? (resolved && (isLanding(resolved) ? spaceLabel(tenant, resolved.space) : resolved.label))
  // A page that swaps its content without a route change (a finished task) still moves focus to its title.
  // Not when the title changed because someone is renaming things in the prototype sidebar.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (!document.activeElement?.closest('.pp')) h1.current?.focus()
  }, [text])
  return (
    <div className="page-header">
      <div>
        <h1 ref={h1} tabIndex={-1}>{text}</h1>
        {(sub ?? resolved?.description) && <p className="page-sub">{sub ?? resolved?.description}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  )
}

export function SkillChip({ id, kind }: { id: string; kind?: 'have' | 'grow' }) {
  return <span className={'skill-chip' + (kind ? ' ' + kind : '')}>{skillById(id).name}</span>
}

export function LevelTag({ level }: { level: Level | null }) {
  if (level === null) return <span className="level none">Not rated</span>
  return <span className={'level l' + level}>{LEVELS[level]}</span>
}

/** Decorative bar; the numbers are always written next to it, so assistive tech skips it. */
export function Progress({ value }: { value: number }) {
  return (
    <div className="progress" aria-hidden>
      <div className="progress-bar" style={{ width: `${value}%` }} />
    </div>
  )
}

export function Card({ children, className, id, label }: { children: ReactNode; className?: string; id?: string; label?: string }) {
  return <section id={id} aria-label={label} className={'card' + (className ? ' ' + className : '')}>{children}</section>
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>
}

/* One stroke icon set, drawn at 24 and shown at 16–20. */
const ICONS = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>,
  chevron: <path d="M6 9l6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  back: <path d="M19 12H5M11 18l-6-6 6-6" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
}

export function Icon({ name, size = 16 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  )
}
