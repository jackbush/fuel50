import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, type State } from '../store'
import { resolveItem, term, withArticle, type Tenant } from '../ia'
import { LEVELS, courses, mentors, paths, person } from '../data'
import { bestAction, gaps, optionsForSkill, readiness, savedPath, targetRole, tasks } from '../logic'
import { Icon } from './ui'

/**
 * “Chat to your career coach”: a side panel that steers your plan and growth.
 * The prototype's coach is scripted: it matches what you type to a few intents and
 * answers from your real state (path, gaps, best options, tasks). Its suggestions are
 * buttons that change your plan or take you to the page, so the conversation does something.
 */

type Act = { label: string; to?: string; run?: () => string }
interface Msg { from: 'coach' | 'you'; text: string; acts?: Act[] }

const PROMPTS = ['What should I focus on?', 'Is this the right path for me?', 'Find me a mentor', 'I only have an hour a week']

export function CoachChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, tenant, dispatch } = useStore()
  const nav = useNavigate()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  // Replies read the state at the moment they're written, not when the panel opened.
  const live = useRef({ state, tenant })
  live.current = { state, tenant }

  // Greet once, on first open; later opens carry on the same conversation.
  useEffect(() => {
    if (!open) return
    opener.current = document.activeElement as HTMLElement
    if (!msgs.length) setMsgs([greeting(state, tenant)])
    requestAnimationFrame(() => input.current?.focus())
  }, [open])
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }) }, [msgs, typing])

  if (!open) return null

  const close = () => { onClose(); opener.current?.focus() }
  const say = (text: string) => {
    if (!text.trim() || typing) return
    setMsgs(m => [...m, { from: 'you', text }])
    setDraft('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMsgs(m => [...m, reply(text, live.current.state, live.current.tenant, dispatch)])
    }, 450)
  }
  const act = (a: Act) => {
    if (a.to) { close(); nav(a.to); return }
    const result = a.run?.()
    if (result) setMsgs(m => [...m, { from: 'you', text: a.label }, { from: 'coach', text: result }])
  }
  const submit = (e: FormEvent) => { e.preventDefault(); say(draft) }

  return (
    <aside className="coach" aria-labelledby="coach-title" onKeyDown={e => { if (e.key === 'Escape') close() }}>
      <header className="coach-head">
        <div>
          <h2 id="coach-title">Career coach</h2>
          <p className="meta">Steers your {term(tenant, 'plan', 1)} and growth. Suggestions only change things when you choose them.</p>
        </div>
        <button className="icon-btn" onClick={close} aria-label="Close career coach"><Icon name="close" /></button>
      </header>
      <div className="coach-log" ref={log} role="log" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={'msg from-' + m.from}>
            <p>{m.text}</p>
            {m.acts && m.acts.length > 0 && (
              <div className="msg-acts">{m.acts.map(a => <button key={a.label} className="btn ghost small-btn" onClick={() => act(a)}>{a.label}</button>)}</div>
            )}
          </div>
        ))}
        {typing && <p className="msg from-coach typing" aria-label="Coach is typing"><span /><span /><span /></p>}
      </div>
      <div className="coach-prompts">{PROMPTS.map(p => <button key={p} className="chip-btn" onClick={() => say(p)}>{p}</button>)}</div>
      <form className="coach-form" onSubmit={submit}>
        <input ref={input} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Ask about your path, gaps or plan" aria-label="Message your career coach" />
        <button className="btn primary" type="submit" disabled={!draft.trim() || typing} aria-label="Send"><Icon name="arrow" /></button>
      </form>
    </aside>
  )
}

function greeting(state: State, tenant: Tenant): Msg {
  const r = readiness(state)
  const list = tasks(state, tenant)
  const todo = list.length ? ` First on your list: ${list[0].title.charAt(0).toLowerCase() + list[0].title.slice(1)}.` : ''
  return {
    from: 'coach',
    text: `Hi ${person.first}. You’re on the ${savedPath(state).title} ${term(tenant, 'path', 1)}, aiming for ${targetRole(state)}, and ready on ${r.ready} of ${r.total} ${term(tenant, 'skill')}.${todo} What would you like to work on?`,
    acts: list[0] ? [{ label: list[0].cta, to: list[0].path }] : [],
  }
}

type Dispatch = ReturnType<typeof useStore>['dispatch']

function reply(raw: string, state: State, tenant: Tenant, dispatch: Dispatch): Msg {
  const q = raw.toLowerCase()
  const t = (id: Parameters<typeof term>[1], n?: number) => term(tenant, id, n)
  const top = gaps(state)[0]
  const plan = t('plan', 1)

  if (/path|role|career|direction|switch|right for me/.test(q)) {
    const here = savedPath(state)
    const others = paths.filter(p => p.id !== here.id)
    return {
      from: 'coach',
      text: `You chose ${here.title}, which makes ${targetRole(state)} your target. ${others.map(p => `${p.title} leads to ${p.steps[1]}`).join('; ')}. Switching changes your target and the gaps you’re working on; nothing in your ${plan} is lost.`,
      acts: [
        ...others.map(p => ({ label: `Switch to ${p.title}`, run: () => { dispatch({ type: 'setPath', id: p.id }); return `Done. You’re aiming for ${p.steps[1]} now, and your gaps on Home have changed to match.` } })),
        ...(resolveItem(tenant, 'paths') ? [{ label: `Compare ${t('path')}`, to: resolveItem(tenant, 'paths')!.path }] : []),
      ],
    }
  }
  if (/mentor|coach|someone|person|people|talk to/.test(q)) {
    const m = top && mentors.find(x => x.skills.includes(top.skill.id) && !state.mentorRequests.includes(x.id))
    if (!m || !top) return { from: 'coach', text: `You’ve already asked everyone who matches your biggest gap. Your requests are in your ${plan}.`, acts: [{ label: `Open your ${plan}`, to: '/#plan' }] }
    return {
      from: 'coach',
      text: `For ${top.skill.name}, your biggest gap, ${m.name} (${m.role}) is a good fit. ${m.blurb}`,
      acts: [{ label: `Ask ${m.name.split(' ')[0]} to be your ${t('mentor', 1)}`, run: () => { dispatch({ type: 'requestMentor', id: m.id, name: m.name }); return `Sent. It’s in your ${plan}; ${m.name.split(' ')[0]} usually replies within a week.` } }],
    }
  }
  if (/time|hour|busy|week|quick|small/.test(q)) {
    const c = gaps(state).flatMap(g => optionsForSkill(g.skill.id).courses).filter(x => !state.courses.includes(x.id)).sort((a, b) => a.hours - b.hours)[0]
    if (!c) return { from: 'coach', text: `Every short ${t('course', 1)} for your gaps is already in your ${plan}. A ${t('mentor', 1)} meeting once a month is the next lightest step.` }
    return {
      from: 'coach',
      text: `Then start small. “${c.title}” is ${c.hours} hours and works on one of your gaps. Done over a few weeks, it fits an hour a week.`,
      acts: [{ label: `Add it to your ${plan}`, run: () => { dispatch({ type: 'addCourse', id: c.id, title: c.title }); return `Added. It’s in your ${plan} on Home.` } }],
    }
  }
  if (/due|deadline|task|to do|todo|outstanding/.test(q)) {
    const list = tasks(state, tenant)
    if (!list.length) return { from: 'coach', text: 'Nothing is waiting on you. A good time to look at your gaps.', acts: [{ label: 'See what to develop', to: '/#develop-h' }] }
    return { from: 'coach', text: `${list.length} thing${list.length === 1 ? '' : 's'} to do: ${list.map(x => x.title).join('; ')}.`, acts: list.map(x => ({ label: x.cta, to: x.path })) }
  }
  if (/focus|next|start|priorit|what should|gap|grow|improve/.test(q)) {
    const best = bestAction(state)
    if (!top || !best) return { from: 'coach', text: `You’re ready for ${targetRole(state)} on every ${t('skill', 1)}. Time to look at the next step on your ${t('path', 1)}.`, acts: [{ label: `See ${t('path')}`, to: '/explore/paths' }] }
    const a = best.action
    const run: Act = a.kind === 'course'
      ? { label: `Add “${a.title}” to your ${plan}`, run: () => { dispatch({ type: 'addCourse', id: a.id, title: a.title }); return `Added to your ${plan}.` } }
      : a.kind === 'mentor'
        ? { label: `Ask ${a.title.split(' ')[0]}`, run: () => { dispatch({ type: 'requestMentor', id: a.id, name: a.title }); return `Sent. It’s in your ${plan}.` } }
        : { label: `Open the ${t('gig', 1)}`, to: a.path }
    return {
      from: 'coach',
      text: `${top.skill.name} first: you’re at ${top.rated ? LEVELS[top.current] : 'not rated yet'}, and ${targetRole(state)} needs ${LEVELS[top.target]}. The ${t(a.kind, 1)} “${a.title}” does the most for you: it works on ${a.reach} levels of your gaps at once.`,
      acts: [run, { label: 'See every option', to: `/#gap-${top.skill.id}` }],
    }
  }
  return {
    from: 'coach',
    text: `I can help you choose what to focus on, check your ${t('path', 1)}, find ${withArticle(t('mentor', 1))}, or fit growth around a busy week. ${courses.length} ${t('course')} and ${mentors.length} ${t('mentor')} are ready to suggest.`,
  }
}
