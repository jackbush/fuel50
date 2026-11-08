/**
 * Live design and label tweaks from the prototype sidebar.
 *
 * `design.json` and `content.json` are the saved values. The sidebar keeps a
 * draft of changes on top of them in this browser; “Copy changes” exports the
 * draft and `npm run tweak` writes it into those files, after which the draft
 * matches the files and empties itself.
 */
import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import designJson from './design.json'
import { cssVars, diff, merge, countChanges, FONTS, type DesignChanges, type DesignValues } from './tokens'
import { CONTENT, type Content, type SpaceId, type Term, type TermId } from './ia'

export const BASE_DESIGN: DesignValues = designJson satisfies DesignValues

export interface ContentChanges { spaces?: Partial<Record<SpaceId, string>>; terms?: Partial<Record<TermId, Term>> }
export interface Changes { design?: DesignChanges; content?: ContentChanges }

const KEY = 'fuel50-tweaks-v1'

/** Drop draft entries that now match the saved files (after `npm run tweak`, or a manual edit). */
function prune(c: Changes): Changes {
  const design = diff(BASE_DESIGN, merge(BASE_DESIGN, c.design ?? {}))
  const spaces = Object.fromEntries(Object.entries(c.content?.spaces ?? {}).filter(([k, v]) => v && CONTENT.spaces[k as SpaceId] !== v))
  const terms = Object.fromEntries(Object.entries(c.content?.terms ?? {}).filter(([k, v]) => {
    const base = CONTENT.terms[k as TermId]
    return base && v && (v[0] !== base[0] || v[1] !== base[1])
  }))
  const content: ContentChanges = {}
  if (Object.keys(spaces).length) content.spaces = spaces
  if (Object.keys(terms).length) content.terms = terms
  const out: Changes = {}
  if (countChanges(design)) out.design = design
  if (content.spaces || content.terms) out.content = content
  return out
}

function save(c: Changes) {
  try { localStorage.setItem(KEY, JSON.stringify(c)) } catch { /* storage unavailable: changes last until reload */ }
}

function load(): Changes {
  try { const c = prune(JSON.parse(localStorage.getItem(KEY) ?? '{}')); save(c); return c } catch { return {} }
}

export const countAll = (c: Changes) =>
  countChanges(c.design ?? {}) + Object.keys(c.content?.spaces ?? {}).length + Object.keys(c.content?.terms ?? {}).length

const loadedFonts = new Set<string>()
function loadFont(family: string) {
  const google = FONTS[family]?.google
  if (!google || loadedFonts.has(google)) return
  loadedFonts.add(google)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${google}&display=swap`
  document.head.appendChild(link)
}

/** Write every design variable onto :root. Called before first render too, so nothing flashes. */
export function applyDesign(v: DesignValues) {
  const root = document.documentElement.style
  for (const [k, val] of Object.entries(cssVars(v))) root.setProperty(k, val)
  loadFont(v.type.family)
}
applyDesign(merge(BASE_DESIGN, load().design ?? {}))

interface Ctx {
  design: DesignValues
  content: Content
  changes: Changes
  setDesign: (group: string, key: string, value: number | string | undefined) => void
  setSpace: (id: SpaceId, value: string | undefined) => void
  setTerm: (id: TermId, value: Term | undefined) => void
  resetAll: () => void
}
const TweaksContext = createContext<Ctx | null>(null)

export function TweaksProvider({ children }: { children: ReactNode }) {
  const [changes, setChanges] = useState<Changes>(load)
  const design = useMemo(() => merge(BASE_DESIGN, changes.design ?? {}), [changes.design])
  const content = useMemo<Content>(() => ({
    spaces: { ...CONTENT.spaces, ...changes.content?.spaces },
    terms: { ...CONTENT.terms, ...changes.content?.terms },
  }), [changes.content])

  useLayoutEffect(() => applyDesign(design), [design])

  const value = useMemo<Ctx>(() => {
    const update = (fn: (c: Changes) => Changes) => setChanges(prev => {
      const next = prune(fn(structuredClone(prev)))
      save(next)
      return next
    })
    return {
      design, content, changes,
      // `undefined` resets a value to the saved one; prune drops anything equal to it.
      setDesign: (g, k, v) => update(c => {
        const set = ((c.design ??= {}) as Record<string, Record<string, unknown>>)[g] ??= {}
        if (v === undefined) delete set[k]; else set[k] = v
        return c
      }),
      setSpace: (id, v) => update(c => { const s = ((c.content ??= {}).spaces ??= {}); if (v === undefined) delete s[id]; else s[id] = v; return c }),
      setTerm: (id, v) => update(c => { const t = ((c.content ??= {}).terms ??= {}); if (v === undefined) delete t[id]; else t[id] = v; return c }),
      resetAll: () => update(() => ({})),
    }
  }, [design, content, changes])

  return <TweaksContext.Provider value={value}>{children}</TweaksContext.Provider>
}

export function useTweaks() {
  const ctx = useContext(TweaksContext)
  if (!ctx) throw new Error('useTweaks outside provider')
  return ctx
}
