import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { TopNav, Breadcrumbs, ReturnBanner, Toasts } from './components/nav'
import { SearchPalette } from './components/Search'
import { ProtoPanel } from './components/ProtoPanel'
import { Start } from './pages/Start'
import { Home, Tasks } from './pages/Home'
import { Skills, AboutMe } from './pages/Growth'
import { ExploreOverview, SkillLibrary, Roles, Gigs, GigDetail, Mentors, Learning, Vacancies, CareerPaths } from './pages/Explore'
import { Team, Reviews, Mentees } from './pages/Team'
import { Admin, NotFound } from './pages/Misc'
import { CoachChat } from './components/Coach'

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [coachOpen, setCoachOpen] = useState(false)
  const loc = useLocation()

  // ⌘K / Ctrl+K opens search from anywhere; “/” too when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest('input, textarea, select')
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Move focus to the page heading on navigation, for keyboard and screen-reader users.
  useEffect(() => {
    if (!loc.hash) window.scrollTo(0, 0)
    const h = document.querySelector('main h1') as HTMLElement | null
    h?.focus()
    if (loc.hash) document.getElementById(loc.hash.slice(1))?.scrollIntoView({ block: 'center' })
  }, [loc.pathname, loc.hash])

  if (loc.pathname === '/start') return (<><Start /><ProtoPanel /></>)

  return (
    <div className="app">
      <TopNav onSearch={() => setSearchOpen(true)} onCoach={() => setCoachOpen(true)} />
      <div className="subbar">
        <Breadcrumbs />
        <ReturnBanner />
      </div>
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          {/* My growth, its target roles and its plan are all on Home now; keep old links working. */}
          <Route path="/growth" element={<Navigate to="/" replace />} />
          <Route path="/growth/targets" element={<Navigate to={{ pathname: '/', hash: '#growth' }} replace />} />
          <Route path="/growth/plan" element={<Navigate to={{ pathname: '/', hash: '#plan' }} replace />} />
          <Route path="/growth/skills" element={<Skills />} />
          <Route path="/growth/about" element={<AboutMe />} />
          <Route path="/explore" element={<ExploreOverview />} />
          <Route path="/explore/skills" element={<SkillLibrary />} />
          <Route path="/explore/roles" element={<Roles />} />
          <Route path="/explore/paths" element={<CareerPaths />} />
          <Route path="/explore/gigs" element={<Gigs />} />
          <Route path="/explore/gigs/:id" element={<GigDetail />} />
          <Route path="/explore/mentors" element={<Mentors />} />
          <Route path="/explore/learning" element={<Learning />} />
          <Route path="/explore/vacancies" element={<Vacancies />} />
          <Route path="/team" element={<Team />} />
          <Route path="/team/reviews" element={<Reviews />} />
          <Route path="/team/mentees" element={<Mentees />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CoachChat open={coachOpen} onClose={() => setCoachOpen(false)} />
      <Toasts />
      <ProtoPanel />
    </div>
  )
}

