import type { ReactNode } from 'react'
import { useStore } from '../store'
import { resolveItem, type ItemId } from '../ia'
import { LEVELS, skillById, type Level } from '../data'

/** Plain page title from the client’s label. Any slogan goes underneath, never instead. */
export function PageHeader({ item, title, sub, children }: { item?: ItemId; title?: string; sub?: string; children?: ReactNode }) {
  const { tenant } = useStore()
  const resolved = item ? resolveItem(tenant, item) : null
  return (
    <div className="page-header">
      <div>
        <h1 tabIndex={-1}>{title ?? resolved?.label}</h1>
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

export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div className="progress" role="img" aria-label={label}>
      <div className="progress-bar" style={{ width: `${value}%` }} />
    </div>
  )
}

export function Card({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={'card' + (className ? ' ' + className : '')}>{children}</section>
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>
}
