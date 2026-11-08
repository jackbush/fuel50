/**
 * Save changes copied from the prototype sidebar into design.json and content.json.
 *
 *   npm run tweak                 read the clipboard
 *   npm run tweak -- changes.json read a file
 *   npm run tweak -- -            read stdin
 *   add --dry-run to preview without writing
 *
 * Accepts the sidebar's `{ design, content }` object, or a bare design object.
 * Validates every key and value against src/tokens.ts and content.json, and
 * writes nothing if anything is wrong.
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { SPEC, GROUP_LABELS, groups, invalid, specFor, type GroupId } from '../src/tokens.ts'

const root = (p: string) => fileURLToPath(new URL(`../src/${p}`, import.meta.url))
const DESIGN = root('design.json'), CONTENT = root('content.json')

const tty = process.stdout.isTTY && !process.env.NO_COLOR
const paint = (code: string) => (s: string) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s)
const dim = paint('2'), bold = paint('1'), green = paint('32'), red = paint('31'), yellow = paint('33')
const swatch = (hex: string) => {
  if (!tty) return ''
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
  return `\x1b[38;2;${r};${g};${b}m██\x1b[0m `
}

const args = process.argv.slice(2)
const dry = args.includes('--dry-run')
const src = args.find(a => a !== '--dry-run')

function readInput(): string {
  if (src === '-') return readFileSync(0, 'utf8')
  if (src) return readFileSync(src, 'utf8')
  const cmds = process.platform === 'darwin' ? ['pbpaste']
    : process.platform === 'win32' ? ['powershell -NoProfile -Command Get-Clipboard']
    : ['wl-paste', 'xclip -selection clipboard -o', 'xsel --clipboard --output']
  for (const cmd of cmds) {
    try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) } catch { /* try the next one */ }
  }
  fail(['Couldn’t read the clipboard. Pass a file instead: npm run tweak -- changes.json'])
}

function fail(errors: string[]): never {
  console.error(`\n${red(bold('Nothing saved.'))}\n${errors.map(e => `  ${red('✕')} ${e}`).join('\n')}\n`)
  process.exit(1)
}

/** Pull the first JSON object out of whatever was pasted (it may have a sentence around it). */
function parse(text: string): Record<string, unknown> {
  const start = text.indexOf('{'), end = text.lastIndexOf('}')
  if (start < 0 || end < start) fail(['No changes found. In the prototype, open the sidebar and press “Copy changes” first.'])
  try { return JSON.parse(text.slice(start, end + 1)) } catch (e) { fail([`That isn’t valid JSON: ${(e as Error).message}`]) }
}

const nearest = (k: string, options: string[]) => {
  const close = options.find(o => o.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(o.toLowerCase()))
  return close ? ` Did you mean “${close}”?` : ` Known: ${options.join(', ')}.`
}
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const show = (v: unknown) => (Array.isArray(v) ? v.join(' / ') : String(v))

const input = parse(readInput())
const designIn = 'design' in input || 'content' in input ? input.design : input
const contentIn = 'design' in input || 'content' in input ? input.content : undefined

const design = JSON.parse(readFileSync(DESIGN, 'utf8')) as Record<GroupId, Record<string, unknown>>
const content = JSON.parse(readFileSync(CONTENT, 'utf8')) as { spaces: Record<string, string>; terms: Record<string, [string, string]> }
const errors: string[] = []
const lines: string[] = []
let changed = 0

const row = (key: string, from: unknown, to: unknown, color = false) => {
  changed++
  const pre = color ? swatch(String(from)) : '', post = color ? swatch(String(to)) : ''
  lines.push(`  ${key.padEnd(26)} ${dim(pre + show(from))}  →  ${green(post + show(to))}`)
}

if (designIn !== undefined) {
  if (!isObj(designIn)) errors.push('“design” should be an object of groups.')
  else for (const [g, set] of Object.entries(designIn)) {
    if (!groups.includes(g as GroupId)) { errors.push(`Unknown design group “${g}”.${nearest(g, groups)}`); continue }
    if (!isObj(set)) { errors.push(`design.${g} should be an object.`); continue }
    const head = lines.length
    for (const [k, v] of Object.entries(set)) {
      const spec = specFor(g as GroupId, k)
      if (!spec) { errors.push(`Unknown token “${g}.${k}”.${nearest(k, Object.keys(SPEC[g as GroupId]))}`); continue }
      const why = invalid(spec, v)
      if (why) { errors.push(`${g}.${k} = ${JSON.stringify(v)}: ${why}.`); continue }
      if (design[g as GroupId][k] === v) continue
      row(`${spec.label}`, design[g as GroupId][k], v, spec.kind === 'color')
      design[g as GroupId][k] = v
    }
    if (lines.length > head) lines.splice(head, 0, bold(GROUP_LABELS[g as GroupId]))
  }
}

if (contentIn !== undefined) {
  if (!isObj(contentIn)) errors.push('“content” should be an object with spaces and/or terms.')
  else {
    const head = lines.length
    for (const [k, v] of Object.entries(contentIn)) {
      if (k !== 'spaces' && k !== 'terms') { errors.push(`Unknown content section “${k}”. Use “spaces” or “terms”.`); continue }
      if (!isObj(v)) { errors.push(`content.${k} should be an object.`); continue }
      for (const [id, val] of Object.entries(v)) {
        if (k === 'spaces') {
          if (!(id in content.spaces)) { errors.push(`Unknown space “${id}”.${nearest(id, Object.keys(content.spaces))}`); continue }
          if (typeof val !== 'string' || !val.trim() || val.length > 40) { errors.push(`Space “${id}” needs a label of 1–40 characters.`); continue }
          if (content.spaces[id] === val.trim()) continue
          row(`Space: ${id}`, content.spaces[id], val.trim())
          content.spaces[id] = val.trim()
        } else {
          if (!(id in content.terms)) { errors.push(`Unknown term “${id}”. Terms are fixed in the IA; you can rename them, not add them.${nearest(id, Object.keys(content.terms))}`); continue }
          if (!Array.isArray(val) || val.length !== 2 || val.some(w => typeof w !== 'string' || !w.trim() || w.length > 40)) { errors.push(`Term “${id}” needs [singular, plural], e.g. ["talent", "talents"].`); continue }
          const next = val.map(w => w.trim()) as [string, string]
          if (next.join() === content.terms[id].join()) continue
          row(`Term: ${id}`, content.terms[id], next)
          content.terms[id] = next
        }
      }
    }
    if (lines.length > head) lines.splice(head, 0, bold('Labels'))
  }
}

if (errors.length) fail(errors)
if (!changed) { console.log(`\n${yellow('Nothing to change:')} those values already match the saved design.\n`); process.exit(0) }

// Two-space JSON, with [singular, plural] pairs kept on one line.
const write = (file: string, data: unknown) => writeFileSync(file, JSON.stringify(data, null, 2).replace(/\[\n\s+("[^"]*"),\n\s+("[^"]*")\n\s+\]/g, '[$1, $2]') + '\n')

console.log(`\n${lines.join('\n')}\n`)
if (dry) { console.log(`${yellow('Dry run:')} ${changed} change${changed === 1 ? '' : 's'} not saved.\n`); process.exit(0) }
if (designIn !== undefined) write(DESIGN, design)
if (contentIn !== undefined) write(CONTENT, content)
console.log(`${green(bold(`Saved ${changed} change${changed === 1 ? '' : 's'}.`))} ${dim('The dev server reloads and the sidebar’s draft clears itself.')}\n`)
