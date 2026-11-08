import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { ADMIN_TOOLS, ITEMS, SPACES, cap, fill, isLanding, itemsInSpace, pageTitle, resolveItem, spaceLabel, term, visibleSpaces } from '../ia'
import { Icon } from './ui'
import { courses, gigs, mentors, skills, vacancies } from '../data'
import { savedPath, targetRole } from '../logic'

interface Result { group: string; title: string; sub: string; path: string; via?: string; score: number }

// Hyphens count as spaces, so “self assessment” finds “self-assessment”.
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[-‐–—_/]/g, ' ').replace(/[^\w\s+]/g, '').replace(/\s+/g, ' ')

function scoreText(q: string, text: string): number {
  const t = norm(text)
  if (!q) return 0
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.split(' ').some(w => w.startsWith(q))) return 60
  // Phrases that start mid-text (“assessment due”), but not letters inside a word (“rate” in “strategy”).
  if (t.includes(' ' + q)) return 40
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
    const t = (id: Parameters<typeof term>[1], n?: number) => term(tenant, id, n)
    return (raw: string): Result[] => {
      const q = norm(raw.trim())
      const out: Result[] = []
      for (const def of ITEMS) {
        const it = resolveItem(tenant, def.id)
        if (!it || !spaces.includes(it.space)) continue // hidden by this client, or not for this person: not findable
        const landing = isLanding(it)
        // A space's own page is also found by the space's name.
        const spaceNames = SPACES.filter(sp => sp.path === def.path).map(sp => spaceLabel(tenant, sp.id))
        const names = [it.label, it.canonicalLabel, it.termLabel, ...spaceNames, ...it.synonyms]
        let best = 0, via: string | undefined
        // Out of the menu's context, “Overview” means nothing: a space's own page is found under the space's name.
        const title = pageTitle(tenant, it)
        names.forEach((n, i) => { const sc = scoreText(q, n) - (i > 0 ? 5 : 0); if (sc > best) { best = sc; via = i > 0 && n.toLowerCase() !== title.toLowerCase() ? n : undefined } })
        best = Math.max(best, scoreText(q, it.description) / 2)
        if (best > 0) out.push({ group: 'Pages', title, sub: `${landing ? it.label : spaceLabel(tenant, it.space)} · ${it.description}`, path: it.path, via, score: best + 10 })
      }
      // Your target role and path are on Home, under Your growth; each skill is in Explore › Skills.
      const skillsPath = resolveItem(tenant, 'skill-library')?.path ?? '/growth/skills'
      const mine: Result[] = [
        { group: 'Your stuff', title: targetRole(state), sub: `Your target ${t('role', 1)}`, path: '/#growth', score: 0 },
        { group: 'Your stuff', title: savedPath(state).title, sub: `Your career ${t('path', 1)}`, path: '/#growth', score: 0 },
        ...state.applications.map(a => ({ group: 'Your stuff', title: gigs.find(g => g.id === a.gigId)!.title, sub: `${cap(t('gig', 1))} application · ${a.status}`, path: `/explore/gigs/${a.gigId}`, score: 0 })),
      ]
      mine.forEach(m => { const sc = Math.max(scoreText(q, m.title), scoreText(q, m.sub)); if (sc) out.push({ ...m, score: sc + 5 }) })
      const opp: Result[] = [
        ...gigs.map(g => ({ group: 'Opportunities', title: g.title, sub: `${cap(t('gig', 1))} · ${g.team} · ${g.weeks} weeks`, path: `/explore/gigs/${g.id}`, score: 0 })),
        ...mentors.map(m => ({ group: 'Opportunities', title: m.name, sub: `${cap(t('mentor', 1))} · ${m.role}`, path: '/explore/mentors', score: 0 })),
        ...courses.map(c => ({ group: 'Opportunities', title: c.title, sub: `${cap(t('course', 1))} · ${c.provider}`, path: '/explore/learning', score: 0 })),
        ...(resolveItem(tenant, 'vacancies') ? vacancies.map(v => ({ group: 'Opportunities', title: v.title, sub: `${cap(t('vacancy', 1))} · ${v.location}`, path: '/explore/vacancies', score: 0 })) : []),
      ]
      opp.forEach(o => { const sc = Math.max(scoreText(q, o.title), scoreText(q, o.sub) / 2); if (sc) out.push({ ...o, score: sc }) })
      skills.forEach(s => { const sc = scoreText(q, s.name); if (sc) out.push({ group: cap(t('skill')), title: s.name, sub: 'Your rating and what it’s needed for', path: `${skillsPath}#skill-${s.id}`, score: sc }) })
      return out.sort((a, b) => b.score - a.score).slice(0, 12)
    }
  }, [tenant, role, state])
}

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const search = useSearchIndex()
  const nav = useNavigate()
  const { tenant, role, dispatch } = useStore()
  const results = q.trim() ? search(q) : []

  useEffect(() => { if (open) { setQ(''); setI(0); setTimeout(() => input.current?.focus(), 0) } }, [open])
  if (!open) return null

  const go = (r: Result) => { dispatch({ type: 'setOrigin', origin: null }); onClose(); nav(r.path) }
  // Other clients' words, to show that search understands them.
  const suggestions = ['target roles', 'talents', 'coach', 'self assessment', 'business development']
  const placeholder = `Search pages, ${term(tenant, 'gig')}, ${term(tenant, 'mentor')}, ${term(tenant, 'skill')}…`
  const mentorsLabel = resolveItem(tenant, 'mentors')?.label
  // Things that exist but aren't yours to open: say why, instead of “nothing found”.
  const nq = norm(q.trim())
  const explanations = !nq ? [] : [
    ...tenant.hidden.map(id => ITEMS.find(i => i.id === id)!)
      .filter(def => [fill(def.label, tenant), ...def.synonyms].some(n => norm(n).startsWith(nq)))
      .map(def => `“${fill(def.label, tenant)}” isn’t used at your organisation.`),
    ...ADMIN_TOOLS.filter(t => norm(t.name).startsWith(nq))
      .map(t => `“${t.name}” is an admin tool, so it isn’t in your menus. Your Fuel50 admin can help.`),
  ]
  let lastGroup = ''

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search" onMouseDown={e => e.stopPropagation()}>
        <div className="palette-input">
        <Icon name="search" size={20} />
        <input
          ref={input}
          value={q}
          placeholder={placeholder}
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
        </div>
        {!q.trim() && (
          <div className="palette-hint">
            <p className="muted small">Search understands other names for things{mentorsLabel && <>. Here, mentoring is called “{mentorsLabel}”</>}. Try:</p>
            <div className="chips">{suggestions.map(s => <button key={s} className="chip-btn" onClick={() => { setQ(s); input.current?.focus() }}>{s}</button>)}</div>
          </div>
        )}
        {q.trim() && results.length === 0 && !explanations.length && (
          <div className="palette-empty">
            <p>Nothing found for “{q}”. Try a shorter word, or go to:</p>
            <div className="chips">
              {visibleSpaces(role).filter(sp => sp.nav === 'menu').flatMap(sp => itemsInSpace(tenant, sp.id)).slice(0, 6).map(it => (
                <button key={it.id} className="chip-btn" onClick={() => { onClose(); dispatch({ type: 'setOrigin', origin: null }); nav(it.path) }}>{it.label}</button>
              ))}
            </div>
          </div>
        )}
        {explanations.map(text => <p key={text} className="palette-empty muted small">{text}</p>)}
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
        <p className="palette-foot" aria-hidden><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>↵</kbd> to open</span><span><kbd>esc</kbd> to close</span></p>
      </div>
    </div>
  )
}
