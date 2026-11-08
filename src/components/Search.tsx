import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { ITEMS, resolveItem, spaceLabel, visibleSpaces, type ItemId } from '../ia'
import { courses, gigs, mentors, paths, skills, targetRole, vacancies } from '../data'

interface Result { group: string; title: string; sub: string; path: string; via?: string; score: number }

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s+]/g, '')

function scoreText(q: string, text: string): number {
  const t = norm(text)
  if (!q) return 0
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.split(/\s+/).some(w => w.startsWith(q))) return 60
  if (t.includes(q)) return 40
  return 0
}

/**
 * One index over pages, your stuff, opportunities and skills.
 * Pages match the client’s label, the canonical label and synonyms, so
 * “talents”, “top skills” and “coach” all land somewhere, whatever this client calls it.
 */
export function useSearchIndex() {
  const { tenant, role, state } = useStore()
  return useMemo(() => {
    const spaces = visibleSpaces(role).map(s => s.id)
    return (raw: string): Result[] => {
      const q = norm(raw.trim())
      const out: Result[] = []
      for (const def of ITEMS) {
        if (!spaces.includes(def.space)) continue
        const it = resolveItem(tenant, def.id as ItemId)
        if (!it) continue // hidden by this client: not findable
        const names = [it.label, it.canonicalLabel, ...it.synonyms]
        let best = 0, via: string | undefined
        names.forEach((n, i) => { const sc = scoreText(q, n) - (i > 0 ? 5 : 0); if (sc > best) { best = sc; via = i > 0 && n.toLowerCase() !== it.label.toLowerCase() ? n : undefined } })
        best = Math.max(best, scoreText(q, it.description) / 2)
        if (best > 0) out.push({ group: 'Pages', title: it.label, sub: `${spaceLabel(tenant, def.space)} · ${it.description}`, path: it.path, via, score: best + 10 })
      }
      const mine: Result[] = [
        { group: 'Your stuff', title: targetRole.title, sub: 'Your target role', path: '/growth/targets', score: 0 },
        ...paths.filter(p => p.saved).map(p => ({ group: 'Your stuff', title: p.title, sub: 'Saved career path', path: '/explore/paths', score: 0 })),
        ...state.applications.map(a => ({ group: 'Your stuff', title: gigs.find(g => g.id === a.gigId)!.title, sub: `Gig application · ${a.status}`, path: `/explore/gigs/${a.gigId}`, score: 0 })),
      ]
      mine.forEach(m => { const sc = Math.max(scoreText(q, m.title), scoreText(q, m.sub)); if (sc) out.push({ ...m, score: sc + 5 }) })
      const opp: Result[] = [
        ...gigs.map(g => ({ group: 'Opportunities', title: g.title, sub: `Gig · ${g.team} · ${g.weeks} weeks`, path: `/explore/gigs/${g.id}`, score: 0 })),
        ...mentors.map(m => ({ group: 'Opportunities', title: m.name, sub: `Mentor · ${m.role}`, path: '/explore/mentors', score: 0 })),
        ...courses.map(c => ({ group: 'Opportunities', title: c.title, sub: `Course · ${c.provider}`, path: '/explore/learning', score: 0 })),
        ...(resolveItem(tenant, 'vacancies') ? vacancies.map(v => ({ group: 'Opportunities', title: v.title, sub: `Vacancy · ${v.location}`, path: '/explore/vacancies', score: 0 })) : []),
      ]
      opp.forEach(o => { const sc = Math.max(scoreText(q, o.title), scoreText(q, o.sub) / 2); if (sc) out.push({ ...o, score: sc }) })
      skills.forEach(s => { const sc = scoreText(q, s.name); if (sc) out.push({ group: 'Skills', title: s.name, sub: 'Your rating and what it’s needed for', path: `/growth/skills#skill-${s.id}`, score: sc }) })
      return out.sort((a, b) => b.score - a.score).slice(0, 12)
    }
  }, [tenant, role, state.applications])
}

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const search = useSearchIndex()
  const nav = useNavigate()
  const { tenant, dispatch } = useStore()
  const results = q.trim() ? search(q) : []

  useEffect(() => { if (open) { setQ(''); setI(0); setTimeout(() => input.current?.focus(), 0) } }, [open])
  if (!open) return null

  const go = (r: Result) => { dispatch({ type: 'setOrigin', origin: null }); onClose(); nav(r.path) }
  const suggestions = ['target roles', 'talents', 'coach', 'gigs', 'business development']
  let lastGroup = ''

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search" onMouseDown={e => e.stopPropagation()}>
        <input
          ref={input}
          value={q}
          placeholder="Search people, roles, gigs, skills, pages…"
          aria-label="Search"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="search-results"
          aria-activedescendant={results[i] ? `res-${i}` : undefined}
          onChange={e => { setQ(e.target.value); setI(0) }}
          onKeyDown={e => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowDown') { e.preventDefault(); setI(Math.min(i + 1, results.length - 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setI(Math.max(i - 1, 0)) }
            if (e.key === 'Enter' && results[i]) go(results[i])
          }}
        />
        {!q.trim() && (
          <div className="palette-hint">
            <p>Try:</p>
            {suggestions.map(s => <button key={s} className="chip-btn" onClick={() => setQ(s)}>{s}</button>)}
            <p className="muted small">Search understands other names for things. On this site, mentoring is called “{resolveItem(tenant, 'mentors')?.label ?? 'hidden'}”.</p>
          </div>
        )}
        {q.trim() && results.length === 0 && <p className="palette-empty">Nothing found for “{q}”.</p>}
        {q.trim() && tenant.hidden.map(id => ITEMS.find(i => i.id === id)!).filter(def => [def.label, ...def.synonyms].some(n => norm(n).startsWith(norm(q.trim())))).map(def => (
          <p key={def.id} className="palette-empty muted small">“{def.label}” isn’t used at your organisation.</p>
        ))}
        <ul id="search-results" role="listbox" className="results">
          {results.map((r, idx) => {
            const header = r.group !== lastGroup ? r.group : null
            lastGroup = r.group
            return (
              <li key={idx} role="presentation">
                {header && <p className="result-group">{header}</p>}
                <div id={`res-${idx}`} role="option" aria-selected={idx === i} className={'result' + (idx === i ? ' active' : '')} onMouseEnter={() => setI(idx)} onClick={() => go(r)}>
                  <span className="result-title">{r.title}{r.via && <span className="via"> · matched “{r.via}”</span>}</span>
                  <span className="result-sub">{r.sub}</span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
