import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore, type VisitMode } from '../store'
import { useTweaks, countAll, BASE_DESIGN } from '../tweaks'
import { CONTENT, TENANTS, TERM_IDS, cap, type SpaceId, type TermId } from '../ia'
import { GROUP_LABELS, groups, tokenIds, specFor, type GroupId, type RangeSpec, type SelectSpec } from '../tokens'
import './proto.css'

const MODES: { id: VisitMode; label: string; desc: string; start: string }[] = [
  { id: 'returner', label: 'Returner', desc: 'Back after six months, from a reminder email', start: '/start' },
  { id: 'first', label: 'First visit', desc: 'Home’s to-do follows the client’s rollout order', start: '/' },
  { id: 'leader', label: 'Weekly manager', desc: 'My team and inline reviews', start: '/team' },
]

const OPEN_KEY = 'fuel50-proto-open'
const readOpen = (): Record<string, boolean> => { try { return JSON.parse(localStorage.getItem(OPEN_KEY) ?? '{}') } catch { return {} } }

/** Prototype-only controls. Not part of the product. */
export function ProtoPanel() {
  const loc = useLocation()
  const { changes } = useTweaks()
  const [open, setOpen] = useState(loc.pathname === '/start')
  const launch = useRef<HTMLButtonElement>(null)
  const head = useRef<HTMLHeadingElement>(null)
  const count = countAll(changes)

  useEffect(() => { if (loc.pathname === '/start') setOpen(true) }, [loc.pathname])

  // “\” toggles the sidebar from anywhere you're not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '\\' || (e.target as HTMLElement)?.closest('input, textarea, select, [contenteditable]')) return
      e.preventDefault(); setOpen(o => !o)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Make room for the sidebar instead of covering the page, so changes are visible as you make them.
  useEffect(() => {
    document.documentElement.toggleAttribute('data-proto-open', open)
    return () => document.documentElement.removeAttribute('data-proto-open')
  }, [open])

  const close = () => { setOpen(false); launch.current?.focus() }
  const toggle = () => { setOpen(!open); if (!open) requestAnimationFrame(() => head.current?.focus()) }

  return (
    <>
      <button ref={launch} className="pp-launch" onClick={toggle} aria-expanded={open} aria-controls="proto-panel" title="Prototype controls ( \ )" hidden={open}>
        <Icon name="sliders" /> Prototype
        {count > 0 && <span className="pp-badge" aria-label={`${count} unsaved design changes`}>{count}</span>}
      </button>
      <aside id="proto-panel" className="pp" aria-labelledby="pp-title" hidden={!open} onKeyDown={e => { if (e.key === 'Escape' && !(e.target as HTMLElement).closest('select')) close() }}>
        <header className="pp-head">
          <div>
            <h2 id="pp-title" ref={head} tabIndex={-1}>Prototype</h2>
            <p>Not part of the product. Press <kbd>\</kbd> to toggle.</p>
          </div>
          <button className="pp-icon-btn" onClick={close} aria-label="Close prototype controls"><Icon name="close" /></button>
        </header>
        <div className="pp-scroll">
          <Scenario />
          <Labels />
          <Design />
        </div>
        <Footer />
      </aside>
    </>
  )
}

/* ---------------- sections ---------------- */

function Section({ id, title, meta, children, defaultOpen }: { id: string; title: string; meta?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(() => readOpen()[id] ?? !!defaultOpen)
  return (
    <details className="pp-sec" open={open} onToggle={e => {
      const now = (e.currentTarget as HTMLDetailsElement).open
      setOpen(now)
      try { localStorage.setItem(OPEN_KEY, JSON.stringify({ ...readOpen(), [id]: now })) } catch { /* fine */ }
    }}>
      <summary><Icon name="chevron" /><span className="pp-sec-title">{title}</span>{meta}</summary>
      <div className="pp-sec-body">{children}</div>
    </details>
  )
}

const Changed = ({ n }: { n: number }) => (n ? <span className="pp-count">{n} changed</span> : null)

function Scenario() {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const tenant = TENANTS.find(t => t.id === state.tenantId) ?? TENANTS[0]
  return (
    <Section id="scenario" title="Scenario" defaultOpen>
      <fieldset className="pp-field">
        <legend>Visit</legend>
        <div className="pp-choices">
          {MODES.map(m => (
            <label key={m.id} className="pp-choice">
              <input type="radio" name="pp-mode" checked={state.mode === m.id} onChange={() => { dispatch({ type: 'setMode', mode: m.id }); nav(m.start) }} />
              <span><strong>{m.label}</strong><small>{m.desc}</small></span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="pp-field">
        <legend>Client configuration</legend>
        <div className="pp-segment">
          {TENANTS.map(t => (
            <label key={t.id}>
              <input type="radio" name="pp-tenant" checked={state.tenantId === t.id} onChange={() => dispatch({ type: 'setTenant', id: t.id })} />
              <span>{t.name}</span>
            </label>
          ))}
        </div>
        <p className="pp-hint">{tenant.note}</p>
      </fieldset>
      <button className="pp-btn" onClick={() => { dispatch({ type: 'reset' }); nav(MODES.find(m => m.id === state.mode)!.start) }}>
        <Icon name="restart" /> Restart journey
      </button>
    </Section>
  )
}

const pluralise = (w: string) => (/[^aeiou]y$/i.test(w) ? w.slice(0, -1) + 'ies' : /(s|x|z|ch|sh)$/i.test(w) ? w + 'es' : w + 's')

function Labels() {
  const { changes, setSpace, setTerm } = useTweaks()
  const { state } = useStore()
  const config = TENANTS.find(t => t.id === state.tenantId) ?? TENANTS[0]
  const spaces = Object.keys(CONTENT.spaces) as SpaceId[]
  const n = Object.keys(changes.content?.spaces ?? {}).length + Object.keys(changes.content?.terms ?? {}).length
  const draftT = changes.content?.terms ?? {}
  const draftS = changes.content?.spaces ?? {}

  // The plural follows the singular until someone types their own. An empty field falls back to the saved word.
  const editTerm = (id: TermId, which: 0 | 1, value: string) => {
    const saved = CONTENT.terms[id]
    const [one, many] = draftT[id] ?? saved
    const autoMany = many === saved[1] || many === pluralise(one)
    if (which === 0) {
      const nextOne = value || saved[0]
      return setTerm(id, [nextOne, autoMany ? (value ? pluralise(value) : saved[1]) : many])
    }
    setTerm(id, [one, value || (one === saved[0] ? saved[1] : pluralise(one))])
  }

  return (
    <Section id="labels" title="Labels" meta={<Changed n={n} />}>
      <p className="pp-intro">Set each word once. Nav, page titles, breadcrumbs, search, next steps and copy all use it. Ids and URLs stay the same.</p>
      <h4 className="pp-sub">Spaces</h4>
      {spaces.map(id => (
        <TextRow key={id} label={cap(CONTENT.spaces[id])} id={`space-${id}`} changed={!!draftS[id]} onReset={() => setSpace(id, undefined)}
          clientNote={config.spaceLabels[id] && `${config.name.split(' ')[0]} uses “${config.spaceLabels[id]}”`}>
          <input id={`space-${id}`} className="pp-input" value={draftS[id] ?? ''} placeholder={CONTENT.spaces[id]} maxLength={40}
            onChange={e => setSpace(id, e.target.value || undefined)} />
        </TextRow>
      ))}
      <h4 className="pp-sub">Nouns <span>singular · plural</span></h4>
      {TERM_IDS.map(id => {
        const d = draftT[id]
        const client = config.terms[id]
        return (
          <TextRow key={id} label={cap(CONTENT.terms[id][0])} id={`term-${id}`} changed={!!d} onReset={() => setTerm(id, undefined)}
            clientNote={client && `${config.name.split(' ')[0]} uses “${client[1]}”, so this client won’t show your change`}>
            <div className="pp-pair">
              <input id={`term-${id}`} className="pp-input" aria-label={`${cap(CONTENT.terms[id][0])}, singular`} value={d?.[0] ?? ''} placeholder={CONTENT.terms[id][0]} maxLength={40}
                onChange={e => editTerm(id, 0, e.target.value)} />
              <input className="pp-input" aria-label={`${cap(CONTENT.terms[id][0])}, plural`} value={d?.[1] ?? ''} placeholder={CONTENT.terms[id][1]} maxLength={40}
                onChange={e => editTerm(id, 1, e.target.value)} />
            </div>
          </TextRow>
        )
      })}
    </Section>
  )
}

function TextRow({ label, id, changed, onReset, clientNote, children }: { label: string; id: string; changed: boolean; onReset: () => void; clientNote?: string | false; children: ReactNode }) {
  return (
    <div className={'pp-row pp-text' + (changed ? ' is-changed' : '')}>
      <label htmlFor={id}>{label}</label>
      {children}
      <ResetButton show={changed} label={label} onReset={onReset} />
      {clientNote && <p className="pp-hint pp-client">{clientNote}</p>}
    </div>
  )
}

function Design() {
  const { changes } = useTweaks()
  return (
    <>
      {groups.map(g => (
        <Section key={g} id={`design-${g}`} title={GROUP_LABELS[g]} meta={<Changed n={Object.keys(changes.design?.[g] ?? {}).length} />} defaultOpen={g === 'space'}>
          {tokenIds(g).map(k => <Token key={k} group={g} k={k} />)}
        </Section>
      ))}
    </>
  )
}

function Token({ group, k }: { group: GroupId; k: string }) {
  const { design, setDesign } = useTweaks()
  const spec = specFor(group, k)!
  const value = (design[group] as Record<string, number | string>)[k]
  const base = (BASE_DESIGN[group] as Record<string, number | string>)[k]
  const id = useId()
  const changed = value !== base
  const set = (v: number | string) => setDesign(group, k, v)
  const reset = () => setDesign(group, k, undefined)

  return (
    <div className={'pp-row pp-token pp-k-' + spec.kind + (changed ? ' is-changed' : '')}>
      <label htmlFor={id} title={spec.hint}>{spec.label}</label>
      {spec.kind === 'range' && <RangeInput id={id} spec={spec} value={value as number} onChange={set} />}
      {spec.kind === 'color' && <ColorInput id={id} value={value as string} onChange={set} />}
      {spec.kind === 'select' && (
        <select id={id} className="pp-input" value={value as string} onChange={e => set(e.target.value)}>
          {Object.entries((spec as SelectSpec).options).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      )}
      <ResetButton show={changed} label={spec.label} was={String(base)} onReset={reset} />
      {spec.hint && <p className="pp-hint">{spec.hint}</p>}
    </div>
  )
}

const decimals = (step: number) => (String(step).split('.')[1] ?? '').length

function RangeInput({ id, spec, value, onChange }: { id: string; spec: RangeSpec; value: number; onChange: (v: number) => void }) {
  const pct = ((value - spec.min) / (spec.max - spec.min)) * 100
  const clamp = (n: number) => Math.min(spec.max, Math.max(spec.min, +n.toFixed(decimals(spec.step))))
  return (
    <div className="pp-range">
      <input id={id} type="range" min={spec.min} max={spec.max} step={spec.step} value={value} style={{ '--pct': `${pct}%` } as React.CSSProperties}
        onChange={e => onChange(clamp(Number(e.target.value)))} />
      <span className="pp-num">
        <input type="number" aria-label={`${spec.label} value`} min={spec.min} max={spec.max} step={spec.step} value={value}
          onChange={e => { const n = Number(e.target.value); if (e.target.value !== '' && Number.isFinite(n)) onChange(clamp(n)) }} />
        {spec.unit && <span aria-hidden>{spec.unit}</span>}
      </span>
    </div>
  )
}

function ColorInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  return (
    <div className="pp-color">
      <span className="pp-swatch" style={{ background: value }}>
        <input id={id} type="color" value={value} onChange={e => onChange(e.target.value)} />
      </span>
      <input className="pp-input pp-hex" aria-label="Hex value" value={text} spellCheck={false} maxLength={7}
        onChange={e => { const v = e.target.value.trim(); setText(v); const hex = v.startsWith('#') ? v : '#' + v; if (/^#[0-9a-f]{6}$/i.test(hex)) onChange(hex.toLowerCase()) }}
        onBlur={() => setText(value)} />
    </div>
  )
}

function ResetButton({ show, label, was, onReset }: { show: boolean; label: string; was?: string; onReset: () => void }) {
  return (
    <button className="pp-reset" onClick={onReset} disabled={!show} aria-label={`Reset ${label}${was ? ` to ${was}` : ''}`} title={show ? `Reset${was ? ` to ${was}` : ''}` : undefined}>
      <Icon name="reset" />
    </button>
  )
}

function Footer() {
  const { changes, resetAll } = useTweaks()
  const n = countAll(changes)
  const [copied, setCopied] = useState<'ok' | 'manual' | null>(null)
  const json = JSON.stringify(changes, null, 2)
  useEffect(() => setCopied(null), [json])
  const copy = async () => {
    try { await navigator.clipboard.writeText(json); setCopied('ok') } catch { setCopied('manual') }
  }
  return (
    <footer className="pp-foot">
      {copied === 'manual' && (
        <label className="pp-manual">Your browser blocked the clipboard. Copy this instead:
          <textarea readOnly value={json} rows={6} onFocus={e => e.currentTarget.select()} autoFocus />
        </label>
      )}
      <p className="pp-status" aria-live="polite">
        {copied === 'ok'
          ? <><Icon name="check" /> Copied. Run <code>npm run tweak</code> to save it.</>
          : n ? <>{n} unsaved change{n === 1 ? '' : 's'} in this browser</> : 'No changes. Everything matches the saved design.'}
      </p>
      <div className="pp-foot-actions">
        <button className="pp-btn" onClick={resetAll} disabled={!n}>Reset all</button>
        <button className="pp-btn pp-primary" onClick={copy} disabled={!n}><Icon name="copy" /> Copy changes</button>
      </div>
    </footer>
  )
}

/* ---------------- icons: one 1.5px stroke set ---------------- */

const PATHS: Record<string, ReactNode> = {
  sliders: <><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" /><circle cx="15" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="17" cy="18" r="2" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  reset: <><path d="M4 12a8 8 0 1 0 2.5-5.8" /><path d="M4 4v4h4" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  restart: <><path d="M20 12a8 8 0 1 1-2.5-5.8" /><path d="M20 4v4h-4" /></>,
}

function Icon({ name }: { name: keyof typeof PATHS }) {
  return <svg className="pp-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{PATHS[name]}</svg>
}
