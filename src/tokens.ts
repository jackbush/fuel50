/**
 * Design variables: what each one is, its range, and the CSS custom properties
 * it drives. Values live in `design.json`; the prototype sidebar edits them live
 * and `npm run tweak` writes copied changes back into that file.
 *
 * Pure data and functions, no DOM, so `scripts/tweak.ts` can import it too.
 */

export interface RangeSpec { kind: 'range'; label: string; min: number; max: number; step: number; unit?: string; hint?: string }
export interface ColorSpec { kind: 'color'; label: string; hint?: string }
export interface SelectSpec { kind: 'select'; label: string; options: Record<string, string>; hint?: string }
export type TokenSpec = RangeSpec | ColorSpec | SelectSpec

/** Typefaces on offer. `google` is the Google Fonts family to load, if any. */
export const FONTS: Record<string, { stack: string; google?: string }> = {
  system: { stack: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif" },
  inter: { stack: "'Inter', system-ui, sans-serif", google: 'Inter:wght@400..800' },
  'public-sans': { stack: "'Public Sans', system-ui, sans-serif", google: 'Public+Sans:wght@400..800' },
  'plex-sans': { stack: "'IBM Plex Sans', system-ui, sans-serif", google: 'IBM+Plex+Sans:wght@400;500;600;700' },
  atkinson: { stack: "'Atkinson Hyperlegible Next', system-ui, sans-serif", google: 'Atkinson+Hyperlegible+Next:wght@400..800' },
}

export const EASINGS: Record<string, string> = {
  expo: 'cubic-bezier(.16, 1, .3, 1)',
  quart: 'cubic-bezier(.25, 1, .5, 1)',
  standard: 'cubic-bezier(.2, 0, 0, 1)',
}

export const SPEC = {
  color: {
    ink: { kind: 'color', label: 'Text', hint: 'Body text and headings' },
    muted: { kind: 'color', label: 'Secondary text', hint: 'Descriptions, metadata. Keep 4.5:1 on Canvas' },
    line: { kind: 'color', label: 'Lines', hint: 'Borders and dividers' },
    canvas: { kind: 'color', label: 'Canvas', hint: 'Page background' },
    surface: { kind: 'color', label: 'Surface', hint: 'Cards, menus, dialogs' },
    accent: { kind: 'color', label: 'Accent', hint: 'Primary actions, links, current item. Tints derive from it' },
    highlight: { kind: 'color', label: 'Highlight', hint: 'Focus ring, current space, next-step dot' },
    chrome: { kind: 'color', label: 'Top bar', hint: 'Main navigation background' },
    success: { kind: 'color', label: 'Success', hint: 'Skills you have, ready states' },
    attention: { kind: 'color', label: 'Attention', hint: 'Needs attention, not rated' },
  },
  type: {
    family: { kind: 'select', label: 'Typeface', options: { system: 'System UI', inter: 'Inter', 'public-sans': 'Public Sans', 'plex-sans': 'IBM Plex Sans', atkinson: 'Atkinson Hyperlegible' } },
    size: { kind: 'range', label: 'Base size', min: 14, max: 19, step: 0.5, unit: 'px' },
    ratio: { kind: 'range', label: 'Scale ratio', min: 1.1, max: 1.4, step: 0.01, hint: 'Step between text sizes. 1.2 suits product UI' },
    leading: { kind: 'range', label: 'Line height', min: 1.3, max: 1.8, step: 0.05 },
    headingWeight: { kind: 'range', label: 'Heading weight', min: 500, max: 800, step: 50 },
    headingTracking: { kind: 'range', label: 'Heading tracking', min: -0.04, max: 0.02, step: 0.005, unit: 'em' },
  },
  space: {
    unit: { kind: 'range', label: 'Spacing unit', min: 3, max: 6, step: 0.5, unit: 'px', hint: 'Every gap is a multiple of this' },
    section: { kind: 'range', label: 'Between sections', min: 24, max: 80, step: 4, unit: 'px' },
    cardPadding: { kind: 'range', label: 'Card padding', min: 12, max: 40, step: 2, unit: 'px' },
    gridGap: { kind: 'range', label: 'Grid gap', min: 8, max: 32, step: 2, unit: 'px' },
    control: { kind: 'range', label: 'Control height', min: 32, max: 48, step: 2, unit: 'px', hint: 'Buttons and inputs. 44 meets touch guidance' },
  },
  layout: {
    width: { kind: 'range', label: 'Content width', min: 880, max: 1440, step: 20, unit: 'px' },
    gutter: { kind: 'range', label: 'Page gutter', min: 16, max: 64, step: 4, unit: 'px' },
    topbar: { kind: 'range', label: 'Top bar height', min: 52, max: 80, step: 2, unit: 'px' },
  },
  shape: {
    radius: { kind: 'range', label: 'Corner radius', min: 0, max: 20, step: 1, unit: 'px', hint: 'Small and large radii scale from this' },
    border: { kind: 'range', label: 'Border width', min: 0, max: 2, step: 0.5, unit: 'px' },
    cardShadow: { kind: 'range', label: 'Card lift', min: 0, max: 1, step: 0.05, hint: '0 is flat; menus and dialogs always lift' },
    elevation: { kind: 'range', label: 'Overlay shadow', min: 0, max: 2, step: 0.1 },
  },
  motion: {
    duration: { kind: 'range', label: 'Duration', min: 0, max: 500, step: 10, unit: 'ms', hint: 'Reduced-motion users always get none' },
    easing: { kind: 'select', label: 'Easing', options: { expo: 'Ease out (expo)', quart: 'Ease out (quart)', standard: 'Standard' } },
  },
} as const satisfies Record<string, Record<string, TokenSpec>>

export type Spec = typeof SPEC
export type GroupId = keyof Spec
type ValueOf<T> = T extends { kind: 'range' } ? number : string
/** The shape of `design.json`, inferred from the spec. */
export type DesignValues = { [G in GroupId]: { [K in keyof Spec[G]]: ValueOf<Spec[G][K]> } }
/** A partial set of changes: what the sidebar copies and `tweak` accepts. */
export type DesignChanges = { [G in GroupId]?: { [K in keyof Spec[G]]?: ValueOf<Spec[G][K]> } }

export const GROUP_LABELS: Record<GroupId, string> = {
  color: 'Colour', type: 'Type', space: 'Spacing', layout: 'Layout', shape: 'Shape', motion: 'Motion',
}

export const groups = Object.keys(SPEC) as GroupId[]
export const tokenIds = <G extends GroupId>(g: G) => Object.keys(SPEC[g]) as (keyof Spec[G] & string)[]
export const specFor = (g: GroupId, k: string): TokenSpec | undefined => (SPEC[g] as Record<string, TokenSpec>)[k]

/** Why a value is invalid for its token, or null when it's fine. */
export function invalid(spec: TokenSpec, v: unknown): string | null {
  if (spec.kind === 'color') return typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? null : 'expected a hex colour like #951986'
  if (spec.kind === 'select') return typeof v === 'string' && v in spec.options ? null : `expected one of ${Object.keys(spec.options).join(', ')}`
  if (typeof v !== 'number' || !Number.isFinite(v)) return 'expected a number'
  if (v < spec.min || v > spec.max) return `expected ${spec.min}–${spec.max}`
  return null
}

/** Merge changes into values, dropping anything that matches the base. */
export function merge(base: DesignValues, changes: DesignChanges): DesignValues {
  const out = structuredClone(base) as Record<string, Record<string, unknown>>
  for (const [g, set] of Object.entries(changes)) Object.assign(out[g], set)
  return out as DesignValues
}

/** The changes that turn `base` into `values`. Empty groups are left out. */
export function diff(base: DesignValues, values: DesignValues): DesignChanges {
  const out: Record<string, Record<string, unknown>> = {}
  for (const g of groups) {
    const a = base[g] as Record<string, unknown>, b = values[g] as Record<string, unknown>
    for (const k of Object.keys(a)) if (a[k] !== b[k]) (out[g] ??= {})[k] = b[k]
  }
  return out as DesignChanges
}

export const countChanges = (c: DesignChanges) => Object.values(c).reduce((n, set) => n + Object.keys(set ?? {}).length, 0)

const px = (n: number) => `${+n.toFixed(2)}px`

/** Every CSS custom property the stylesheet reads, derived from the values. */
export function cssVars(v: DesignValues): Record<string, string> {
  const { color: c, type: t, space: s, layout: l, shape: sh, motion: m } = v
  const mix = (a: string, pct: number, b = 'var(--surface)') => `color-mix(in oklab, ${a} ${pct}%, ${b})`
  const step = (n: number) => px(t.size * Math.pow(t.ratio, n))
  const shadowA = (a: number) => +(a * sh.elevation).toFixed(3)
  return {
    '--ink': c.ink, '--muted': c.muted, '--line': c.line, '--canvas': c.canvas, '--surface': c.surface,
    '--accent': c.accent, '--highlight': c.highlight, '--chrome': c.chrome, '--success': c.success, '--attention': c.attention,
    '--accent-tint': mix('var(--accent)', 9), '--accent-line': mix('var(--accent)', 30),
    '--accent-strong': `color-mix(in oklab, var(--accent) 82%, black)`,
    '--success-tint': mix('var(--success)', 10), '--success-line': mix('var(--success)', 28),
    '--attention-tint': mix('var(--highlight)', 10), '--attention-line': mix('var(--highlight)', 30),
    '--sunk': mix('var(--ink)', 4, 'var(--canvas)'),
    '--chrome-ink': mix('white', 84, 'var(--chrome)'), '--chrome-hover': mix('white', 9, 'var(--chrome)'),
    '--chrome-line': mix('white', 18, 'var(--chrome)'),

    '--font': FONTS[t.family]?.stack ?? FONTS.system.stack,
    '--fs-xs': step(-1.5), '--fs-sm': step(-0.75), '--fs-base': px(t.size),
    '--fs-md': step(1), '--fs-lg': step(2), '--fs-xl': step(3), '--fs-2xl': step(4),
    '--leading': String(t.leading), '--heading-weight': String(t.headingWeight), '--heading-tracking': `${t.headingTracking}em`,

    ...Object.fromEntries([1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map(n => [`--s-${n}`, px(s.unit * n)])),
    '--section': px(s.section), '--card-pad': px(s.cardPadding), '--gap': px(s.gridGap), '--control': px(s.control),

    '--width': px(l.width), '--gutter': px(l.gutter), '--topbar': px(l.topbar),

    '--r-sm': px(sh.radius * 0.6), '--r-md': px(sh.radius), '--r-lg': px(sh.radius * 1.4), '--bw': px(sh.border),
    '--card-shadow': sh.cardShadow ? `0 1px 2px rgb(27 24 32 / ${+(0.06 * sh.cardShadow).toFixed(3)}), 0 4px 16px rgb(27 24 32 / ${+(0.06 * sh.cardShadow).toFixed(3)})` : 'none',
    '--shadow-pop': `0 2px 6px rgb(20 12 24 / ${shadowA(0.08)}), 0 16px 40px rgb(20 12 24 / ${shadowA(0.16)})`,
    '--shadow-modal': `0 4px 12px rgb(20 12 24 / ${shadowA(0.1)}), 0 32px 80px rgb(20 12 24 / ${shadowA(0.28)})`,

    '--dur': `${m.duration}ms`, '--ease': EASINGS[m.easing] ?? EASINGS.expo,
  }
}
