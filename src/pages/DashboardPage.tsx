import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { RolePill } from '../components/RolePill'
import {
  parentChild,
  parentSessions,
  parentTodos,
  parentTutors,
  studentNeeds,
  studentSessions,
  studentTodos,
  studentTutors,
  tutorProfiles,
  tutorClients,
  tutorOffers,
  tutorSessions,
  type StudentSession,
  type StudentTodo,
  type TutorClient,
  type TutorOffer,
  type TutorSession,
  type TutorProfile,
} from '../mock/data'
import type { Session } from '../state/session'
import { SectionTitle, Stat } from '../components/ui'
import { Icons } from '../components/icons'
import { MessagesPanel } from './MessagesPage'
import { NotesPanel } from './NotesPage'
import { recordTutorSentOffer } from '../state/inbox'

function roleTheme(session: Session) {
  switch (session.role) {
    case 'student':
      return {
        soft: 'var(--student-soft)',
        strong: 'var(--student-strong)',
        headline: 'Your learning space',
        blurb: 'Find a tutor, keep sessions on track, and focus on progress.',
      }
    case 'parent':
      return {
        soft: 'var(--parent-soft)',
        strong: 'var(--parent-strong)',
        headline: 'Find the right tutor',
        blurb: 'Match by subject, level, schedule, and learning goals.',
      }
    case 'tutor':
      return {
        soft: 'var(--tutor-soft)',
        strong: 'var(--tutor-strong)',
        headline: 'Clients that fit your expertise',
        blurb: 'Browse student needs and reach out with a clear offer.',
      }
  }
}

function Chip({ text }: { text: string }) {
  return <span className="pill">{text}</span>
}

function StatusPill({
  text,
  tone,
}: {
  text: string
  tone: 'good' | 'warn' | 'neutral'
}) {
  const bg =
    text && tone === 'good'
      ? 'var(--parent-soft)'
      : tone === 'warn'
        ? 'rgba(255, 230, 188, 0.85)'
        : 'rgba(255,255,255,0.6)'
  return (
    <span className="pill" style={{ borderColor: 'transparent', background: bg }}>
      {text}
    </span>
  )
}

function TutorCard({
  t,
  existingTutor,
}: {
  t: TutorProfile
  /** When set, this tutor is already in the learner’s roster (student/parent). */
  existingTutor?: boolean
}) {
  return (
    <div className="card">
      <div className="card-inner">
        <div className="card-header">
          <div>
            <h3 style={{ fontSize: 18 }}>{t.name}</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {Icons.Pin({ size: 14 })} {t.city}
              </span>{' '}
              • {t.mode} •{' '}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {Icons.Star({ size: 14 })} {t.rating.toFixed(1)}
              </span>
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {existingTutor ? (
              <span className="pill" title="Already in your tutors list">
                Your tutor
              </span>
            ) : null}
            <div className="pill">₱{t.hourlyRate}/hr</div>
          </div>
        </div>

        <div className="btn-row" style={{ marginTop: 10 }}>
          <Chip text={t.level} />
          {t.subjects.map((s) => (
            <Chip key={s} text={s} />
          ))}
        </div>

        <div className="btn-row" style={{ marginTop: 12 }}>
          <button className="btn">
            {Icons.CheckBook({ size: 16 })}
            View profile
          </button>
          <button className="btn">
            {Icons.Message({ size: 16 })}
            Message
          </button>
          <button className="btn">
            {Icons.Calendar({ size: 16 })}
            {existingTutor ? 'Book' : 'Request session'}
          </button>
        </div>
      </div>
    </div>
  )
}

function YourTutorsStudentList() {
  return (
    <section className="card">
      <div className="card-inner">
        <SectionTitle
          title="Your tutors"
          subtitle="People you’re currently learning with."
        />
        <div className="grid" style={{ gap: 10, marginTop: 12 }}>
          {studentTutors.map((rel) => {
            const t = tutorProfiles.find((x) => x.id === rel.tutorId)
            if (!t) return null
            return (
              <div
                key={rel.tutorId}
                className="card"
                style={{ background: 'rgba(255,255,255,0.62)' }}
              >
                <div className="card-inner">
                  <div className="card-header">
                    <div>
                      <h3 style={{ fontSize: 16 }}>{t.name}</h3>
                      <p className="muted" style={{ marginTop: 6 }}>
                        {rel.relationship} • Since {rel.since}
                      </p>
                    </div>
                    <span className="pill">
                      {Icons.Star({ size: 14 })} {t.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="btn-row">
                    <Chip text={t.mode} />
                    <Chip text={t.level} />
                    {t.subjects.slice(0, 2).map((s) => (
                      <Chip key={s} text={s} />
                    ))}
                  </div>
                  <div className="btn-row" style={{ marginTop: 10 }}>
                    <button className="btn">
                      {Icons.Message({ size: 16 })}
                      Message
                    </button>
                    <button className="btn">
                      {Icons.Calendar({ size: 16 })}
                      Book
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function StudentTutorsBrowseHub({
  tutorView,
  setTutorView,
  query,
  setQuery,
  level,
  setLevel,
  mode,
  setMode,
  filteredTutors,
  existingTutorIds,
}: {
  tutorView: 'discover' | 'my'
  setTutorView: (v: 'discover' | 'my') => void
  query: string
  setQuery: (v: string) => void
  level: 'All' | TutorProfile['level']
  setLevel: (v: 'All' | TutorProfile['level']) => void
  mode: 'All' | TutorProfile['mode']
  setMode: (v: 'All' | TutorProfile['mode']) => void
  filteredTutors: TutorProfile[]
  existingTutorIds: Set<string>
}) {
  return (
    <section className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div className="card-inner">
          <div className="label" style={{ marginBottom: 8 }}>
            Tutors
          </div>
          <div className="nav-group">
            <button
              type="button"
              className={`btn nav-item ${tutorView === 'discover' ? 'is-active' : ''}`}
              data-accent="student"
              onClick={() => setTutorView('discover')}
            >
              {Icons.Search({ size: 16 })}
              Discover tutors
            </button>
            <button
              type="button"
              className={`btn nav-item ${tutorView === 'my' ? 'is-active' : ''}`}
              data-accent="student"
              onClick={() => setTutorView('my')}
            >
              {Icons.Users({ size: 16 })}
              Your tutors
            </button>
          </div>
        </div>
      </div>

      {tutorView === 'my' ? (
        <YourTutorsStudentList />
      ) : (
        <BrowseTutorsDiscover
          title="Browse tutors"
          subtitle="Search by subject, place, or name. Tutors you already work with are labeled in results."
          query={query}
          setQuery={setQuery}
          level={level}
          setLevel={setLevel}
          mode={mode}
          setMode={setMode}
          filteredTutors={filteredTutors}
          existingTutorIds={existingTutorIds}
        />
      )}
    </section>
  )
}

function BrowseTutorsDiscover({
  title,
  subtitle,
  query,
  setQuery,
  level,
  setLevel,
  mode,
  setMode,
  filteredTutors,
  existingTutorIds,
}: {
  title: string
  subtitle: string
  query: string
  setQuery: (v: string) => void
  level: 'All' | TutorProfile['level']
  setLevel: (v: 'All' | TutorProfile['level']) => void
  mode: 'All' | TutorProfile['mode']
  setMode: (v: 'All' | TutorProfile['mode']) => void
  filteredTutors: TutorProfile[]
  /** Tutor ids already linked on the account (shown with a “Your tutor” badge). */
  existingTutorIds: Set<string>
}) {
  return (
    <section className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div className="card-inner">
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: 20 }}>{title}</h2>
              <p className="subtle" style={{ marginTop: 6 }}>
                {subtitle}
              </p>
            </div>
          </div>

          <div className="grid grid-2" style={{ marginTop: 10 }}>
            <div className="field">
              <div className="label">Search</div>
              <input
                className="input"
                placeholder="e.g., Math, English, Quezon City"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-2" style={{ gap: 10 }}>
              <div className="field">
                <div className="label">Level</div>
                <select
                  className="input"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as typeof level)}
                >
                  <option value="All">All</option>
                  <option value="Elementary">Elementary</option>
                  <option value="JHS">JHS</option>
                  <option value="SHS">SHS</option>
                  <option value="College">College</option>
                </select>
              </div>
              <div className="field">
                <div className="label">Mode</div>
                <select
                  className="input"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as typeof mode)}
                >
                  <option value="All">All</option>
                  <option value="Online">Online</option>
                  <option value="In-person">In-person</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </div>

          <div className="btn-row" style={{ marginTop: 12 }}>
            <button
              className="btn"
              onClick={() => {
                setQuery('')
                setLevel('All')
                setMode('All')
              }}
            >
              {Icons.Filter({ size: 16 })}
              Clear filters
            </button>
            <button className="btn">Save search</button>
          </div>
        </div>
      </div>

      <section className="grid grid-2">
        {filteredTutors.map((t) => (
          <TutorCard
            key={t.id}
            t={t}
            existingTutor={existingTutorIds.has(t.id)}
          />
        ))}
      </section>
    </section>
  )
}

function sessionTone(s: StudentSession): 'good' | 'warn' | 'neutral' {
  if (s.status === 'Upcoming') return 'neutral'
  if (s.status === 'Completed') return 'good'
  return 'warn'
}

function todoTone(t: StudentTodo): 'good' | 'warn' | 'neutral' {
  if (t.status === 'Done') return 'good'
  if (t.status === 'In progress') return 'neutral'
  return 'warn'
}

export function DashboardPage({ session }: { session: Session }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isMessagesRoute = location.pathname === '/app/messages'
  const isNotesRoute = location.pathname === '/app/notes'
  const theme = roleTheme(session)
  const studentProfile =
    session.role === 'student' ? (session.profile as unknown as { yearLevel?: string; learningGoal?: string } | undefined) : undefined
  const parentProfile =
    session.role === 'parent'
      ? (session.profile as unknown as { childName?: string; childYearLevel?: string; city?: string } | undefined)
      : undefined
  const tutorProfile =
    session.role === 'tutor'
      ? (session.profile as unknown as { subjects?: string; yearsExperience?: string; city?: string } | undefined)
      : undefined

  type Section =
    | 'student.overview'
    | 'student.sessions'
    | 'student.browse'
    | 'student.todos'
    | 'parent.overview'
    | 'parent.find'
    | 'parent.sessions'
    | 'parent.tutors'
    | 'parent.todos'
    | 'parent.profile'
    | 'tutor.requests'
    | 'tutor.offers'
    | 'tutor.clients'
    | 'tutor.sessions'

  const defaultSection: Section =
    session.role === 'student'
      ? 'student.overview'
      : session.role === 'parent'
        ? 'parent.overview'
        : 'tutor.requests'

  const [section, setSection] = useState<Section>(defaultSection)

  useEffect(() => {
    setSection(defaultSection)
  }, [defaultSection])

  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<'All' | TutorProfile['level']>('All')
  const [mode, setMode] = useState<'All' | TutorProfile['mode']>('All')
  const [studentTutorView, setStudentTutorView] = useState<'discover' | 'my'>(
    'discover'
  )

  const [detailsNeedId, setDetailsNeedId] = useState<string | null>(null)
  const [offerNeedId, setOfferNeedId] = useState<string | null>(null)
  const [offerRate, setOfferRate] = useState('450')
  const [offerAvailability, setOfferAvailability] = useState('Tue/Thu 6–8pm')
  const [offerMessage, setOfferMessage] = useState(
    'Hi! I can help with your goal. I’ll start with a quick diagnostic, then a focused plan per session.'
  )
  const [offerSentForNeedId, setOfferSentForNeedId] = useState<string | null>(
    null
  )

  const filteredTutors = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tutorProfiles.filter((t) => {
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.subjects.some((s) => s.toLowerCase().includes(q)) ||
        t.city.toLowerCase().includes(q)
      const matchesLevel = level === 'All' || t.level === level
      const matchesMode = mode === 'All' || t.mode === mode
      return matchesQuery && matchesLevel && matchesMode
    })
  }, [query, level, mode])

  const studentExistingTutorIds = useMemo(
    () => new Set(studentTutors.map((r) => r.tutorId)),
    []
  )
  const parentExistingTutorIds = useMemo(
    () => new Set(parentTutors.map((r) => r.tutorId)),
    []
  )

  const detailsNeed = detailsNeedId
    ? studentNeeds.find((s) => s.id === detailsNeedId) ?? null
    : null

  const offerNeed = offerNeedId
    ? studentNeeds.find((s) => s.id === offerNeedId) ?? null
    : null

  const accentKey = session.role

  const sidebarItems: Array<{
    key: Section
    label: string
    icon: (p: { size?: number }) => React.ReactNode
  }> =
    session.role === 'student'
      ? [
          { key: 'student.overview', label: 'Overview', icon: Icons.Dashboard },
          { key: 'student.sessions', label: 'Sessions', icon: Icons.Calendar },
          { key: 'student.browse', label: 'Browse tutors', icon: Icons.Search },
          { key: 'student.todos', label: 'To‑dos', icon: Icons.CheckBook },
        ]
      : session.role === 'parent'
        ? [
            { key: 'parent.overview', label: 'Overview', icon: Icons.Dashboard },
            { key: 'parent.sessions', label: 'Sessions', icon: Icons.Calendar },
            { key: 'parent.tutors', label: 'Tutors', icon: Icons.Users },
            { key: 'parent.todos', label: 'To‑dos', icon: Icons.CheckBook },
            { key: 'parent.find', label: 'Find tutors', icon: Icons.Search },
            { key: 'parent.profile', label: 'Student profile', icon: Icons.Cap },
          ]
        : [
            { key: 'tutor.requests', label: 'Requests', icon: Icons.Users },
            { key: 'tutor.offers', label: 'Offers', icon: Icons.Send },
            { key: 'tutor.clients', label: 'Clients', icon: Icons.Cap },
            { key: 'tutor.sessions', label: 'Sessions', icon: Icons.Calendar },
          ]

  return (
    <main className="grid" style={{ gap: 16 }}>
      <section className="card page-hero">
        <div
          className="page-hero-accent"
          aria-hidden="true"
          style={{
            background: `linear-gradient(180deg, ${theme.strong}, ${theme.soft})`,
          }}
        />
        <div className="page-hero-inner">
          <div className="card-header" style={{ marginBottom: 0 }}>
            <div>
              <RolePill role={session.role} />
              <h2 style={{ marginTop: 10 }}>
                {isNotesRoute ? 'Notes' : isMessagesRoute ? 'Messages' : theme.headline}
              </h2>
              <p className="subtle" style={{ marginTop: 6, maxWidth: 760 }}>
                {isNotesRoute
                  ? session.role === 'student'
                    ? 'Session summaries and next steps from your tutors.'
                    : session.role === 'parent'
                      ? 'See what was covered in each lesson and what to reinforce at home.'
                      : 'Capture outcomes and homework after each session.'
                  : isMessagesRoute
                    ? session.role === 'student'
                      ? 'Chats with tutors about your subjects and sessions.'
                      : session.role === 'parent'
                        ? 'Messages from tutors about your child’s learning.'
                        : 'Conversations with students and parents.'
                    : session.role === 'student' &&
                        (studentProfile?.yearLevel || studentProfile?.learningGoal)
                      ? `${theme.blurb}${studentProfile?.yearLevel ? ` • ${studentProfile.yearLevel}` : ''}${studentProfile?.learningGoal ? ` • Goal: ${studentProfile.learningGoal}` : ''}`
                      : session.role === 'parent' &&
                          (parentProfile?.childName || parentProfile?.childYearLevel)
                        ? `${theme.blurb} • ${parentProfile?.childName ?? parentChild.name}${parentProfile?.childYearLevel ? ` • ${parentProfile.childYearLevel}` : ''}`
                        : session.role === 'tutor' &&
                            (tutorProfile?.subjects || tutorProfile?.yearsExperience)
                          ? `${theme.blurb}${tutorProfile?.subjects ? ` • Subjects: ${tutorProfile.subjects}` : ''}${tutorProfile?.yearsExperience ? ` • ${tutorProfile.yearsExperience} yrs` : ''}`
                          : theme.blurb}
              </p>
            </div>
            <div className="pill">{session.displayName}</div>
          </div>
        </div>
      </section>

      <section className="dash-layout">
        <aside className="sidebar">
          <div className="card">
            <div className="card-inner">
              <div className="profile">
                <div
                  className="avatar"
                  aria-hidden="true"
                  style={{
                    background: `linear-gradient(135deg, ${theme.soft}, ${theme.strong})`,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div className="profile-name" title={session.displayName}>
                    {session.displayName}
                  </div>
                  <div className="profile-sub" title={session.email}>
                    {session.email}
                  </div>
                </div>
              </div>

              <div className="btn-row" style={{ marginTop: 10 }}>
                <span className="pill">{session.role}</span>
                {session.role === 'student' && studentProfile?.yearLevel ? (
                  <span className="pill">{studentProfile.yearLevel}</span>
                ) : session.role === 'parent' &&
                  (parentProfile?.childName || parentProfile?.childYearLevel) ? (
                  <span className="pill">
                    {parentProfile?.childName ?? parentChild.name}
                    {parentProfile?.childYearLevel
                      ? ` • ${parentProfile.childYearLevel}`
                      : ''}
                  </span>
                ) : session.role === 'tutor' &&
                  (tutorProfile?.subjects || tutorProfile?.yearsExperience) ? (
                  <span className="pill">
                    {tutorProfile?.subjects ? tutorProfile.subjects : 'Tutor'}
                    {tutorProfile?.yearsExperience
                      ? ` • ${tutorProfile.yearsExperience} yrs`
                      : ''}
                  </span>
                ) : null}
              </div>

              <div className="divider" style={{ margin: '12px 0' }} />

              <div className="label" style={{ marginBottom: 8 }}>
                Menu
              </div>
              <div className="nav-group">
                {sidebarItems.map((it) => (
                  <button
                    key={it.key}
                    className={`btn nav-item ${!isMessagesRoute && !isNotesRoute && section === it.key ? 'is-active' : ''}`}
                    data-accent={accentKey}
                    onClick={() => {
                      navigate('/app')
                      setSection(it.key)
                    }}
                  >
                    {it.icon({ size: 16 })}
                    {it.label}
                  </button>
                ))}
              </div>

              <div className="divider" style={{ margin: '12px 0' }} />

              <div className="nav-group">
                <button
                  type="button"
                  className={`btn nav-item ${isMessagesRoute ? 'is-active' : ''}`}
                  data-accent={accentKey}
                  onClick={() => navigate('/app/messages')}
                >
                  {Icons.Message({ size: 16 })}
                  Messages
                </button>
                <button
                  type="button"
                  className={`btn nav-item ${isNotesRoute ? 'is-active' : ''}`}
                  data-accent={accentKey}
                  onClick={() => navigate('/app/notes')}
                >
                  {Icons.CheckBook({ size: 16 })}
                  Notes
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="content">
          {isNotesRoute ? (
            <NotesPanel session={session} />
          ) : isMessagesRoute ? (
            <MessagesPanel session={session} />
          ) : session.role === 'student' ? (
            section === 'student.sessions' ? (
              <section className="card">
                <div className="card-inner">
                  <SectionTitle
                    title="Sessions"
                    subtitle="Upcoming and recent sessions."
                    right={<span className="pill">Student</span>}
                  />
                  <div className="grid" style={{ gap: 10, marginTop: 12 }}>
                    {studentSessions.map((s) => {
                      const tutor = tutorProfiles.find((t) => t.id === s.tutorId)
                      return (
                        <div
                          key={s.id}
                          className="card"
                          style={{ background: 'rgba(255,255,255,0.62)' }}
                        >
                          <div className="card-inner">
                            <div className="card-header">
                              <div>
                                <h3 style={{ fontSize: 16 }}>{s.title}</h3>
                                <p className="muted" style={{ marginTop: 6 }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                    }}
                                  >
                                    {Icons.Calendar({ size: 14 })} {s.when}
                                  </span>{' '}
                                  • {s.durationMins} min • {s.mode}
                                  {tutor ? ` • Tutor: ${tutor.name}` : ''}
                                </p>
                              </div>
                              <StatusPill text={s.status} tone={sessionTone(s)} />
                            </div>
                            <div className="btn-row" style={{ marginTop: 10 }}>
                              <button className="btn">
                                {Icons.Message({ size: 16 })}
                                Message
                              </button>
                              <button className="btn">
                                {Icons.CheckBook({ size: 16 })}
                                Notes
                              </button>
                              <button className="btn btn-primary btn-student">
                                {Icons.Send({ size: 16 })}
                                Join
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            ) : section === 'student.browse' ? (
              <StudentTutorsBrowseHub
                tutorView={studentTutorView}
                setTutorView={setStudentTutorView}
                query={query}
                setQuery={setQuery}
                level={level}
                setLevel={setLevel}
                mode={mode}
                setMode={setMode}
                filteredTutors={filteredTutors}
                existingTutorIds={studentExistingTutorIds}
              />
            ) : section === 'student.todos' ? (
              <section className="card">
                <div className="card-inner">
                  <SectionTitle
                    title="To‑dos"
                    subtitle="Assignments and practice tasks from your tutor."
                    right={<span className="pill">{studentTodos.length} items</span>}
                  />
                  <div className="grid" style={{ gap: 10, marginTop: 12 }}>
                    {studentTodos.map((t) => (
                      <div
                        key={t.id}
                        className="card"
                        style={{ background: 'rgba(255,255,255,0.62)' }}
                      >
                        <div className="card-inner">
                          <div className="card-header">
                            <div>
                              <h3 style={{ fontSize: 16 }}>{t.title}</h3>
                              <p className="muted" style={{ marginTop: 6 }}>
                                {t.subject} • Due: {t.due}
                              </p>
                            </div>
                            <StatusPill text={t.status} tone={todoTone(t)} />
                          </div>
                          <div className="btn-row" style={{ marginTop: 10 }}>
                            <button className="btn">
                              {Icons.CheckBook({ size: 16 })}
                              Open
                            </button>
                            <button className="btn">
                              {Icons.Send({ size: 16 })}
                              Mark done
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : (
              <section className="grid" style={{ gap: 14 }}>
                <div className="card">
                  <div className="card-inner">
                    <SectionTitle
                      title="Overview"
                      subtitle="Your sessions, tutors, and to‑dos in one place."
                      right={<span className="pill">Student home</span>}
                    />
                    <div className="grid grid-2" style={{ marginTop: 12 }}>
                      <Stat
                        icon={Icons.Calendar}
                        label="Upcoming sessions"
                        value={`${studentSessions.filter((s) => s.status === 'Upcoming').length}`}
                        hint="This week"
                        accent="student"
                      />
                      <Stat
                        icon={Icons.Users}
                        label="Tutors"
                        value={`${studentTutors.length}`}
                        hint="Active relationships"
                        accent="student"
                      />
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-inner">
                    <SectionTitle
                      title="Next up"
                      subtitle="The soonest session and most urgent to‑do."
                      right={<button className="btn">{Icons.Dashboard({ size: 16 })} Open</button>}
                    />
                    <div className="grid grid-2" style={{ marginTop: 12 }}>
                      <div className="card" style={{ background: 'rgba(255,255,255,0.62)' }}>
                        <div className="card-inner">
                          <div className="label">Upcoming session</div>
                          <p className="subtle" style={{ marginTop: 6 }}>
                            {studentSessions.find((s) => s.status === 'Upcoming')?.title ?? '—'}
                          </p>
                          <p className="muted" style={{ marginTop: 6 }}>
                            {studentSessions.find((s) => s.status === 'Upcoming')?.when ?? ''}
                          </p>
                        </div>
                      </div>
                      <div className="card" style={{ background: 'rgba(255,255,255,0.62)' }}>
                        <div className="card-inner">
                          <div className="label">To‑do</div>
                          <p className="subtle" style={{ marginTop: 6 }}>
                            {studentTodos.find((t) => t.status !== 'Done')?.title ?? '—'}
                          </p>
                          <p className="muted" style={{ marginTop: 6 }}>
                            Due: {studentTodos.find((t) => t.status !== 'Done')?.due ?? ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )
          ) : session.role === 'parent' ? (
            section === 'parent.sessions' ? (
              <section className="card">
                <div className="card-inner">
                  <SectionTitle
                    title="Sessions"
                    subtitle="Your child’s upcoming and recent sessions."
                    right={
                      <span className="pill">
                        {parentProfile?.childName ?? parentChild.name}
                      </span>
                    }
                  />
                  <div className="grid" style={{ gap: 10, marginTop: 12 }}>
                    {parentSessions.map((s) => {
                      const tutor = tutorProfiles.find((t) => t.id === s.tutorId)
                      return (
                        <div
                          key={s.id}
                          className="card"
                          style={{ background: 'rgba(255,255,255,0.62)' }}
                        >
                          <div className="card-inner">
                            <div className="card-header">
                              <div>
                                <h3 style={{ fontSize: 16 }}>{s.title}</h3>
                                <p className="muted" style={{ marginTop: 6 }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    {Icons.Calendar({ size: 14 })} {s.when}
                                  </span>{' '}
                                  • {s.durationMins} min • {s.mode}
                                  {tutor ? ` • Tutor: ${tutor.name}` : ''}
                                </p>
                              </div>
                              <StatusPill text={s.status} tone={sessionTone(s)} />
                            </div>
                            <div className="btn-row" style={{ marginTop: 10 }}>
                              <button className="btn">
                                {Icons.Message({ size: 16 })}
                                Message tutor
                              </button>
                              <button className="btn">
                                {Icons.CheckBook({ size: 16 })}
                                Notes
                              </button>
                              <button className="btn">
                                {Icons.Send({ size: 16 })}
                                Reschedule
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            ) : section === 'parent.tutors' ? (
              <section className="card">
                <div className="card-inner">
                  <SectionTitle
                    title="Tutors"
                    subtitle="Tutors working with your child."
                    right={
                      <button className="btn" onClick={() => setSection('parent.find')}>
                        {Icons.Search({ size: 16 })}
                        Find tutors
                      </button>
                    }
                  />
                  <div className="grid" style={{ gap: 10, marginTop: 12 }}>
                    {parentTutors.map((rel) => {
                      const t = tutorProfiles.find((x) => x.id === rel.tutorId)
                      if (!t) return null
                      return (
                        <div
                          key={rel.tutorId}
                          className="card"
                          style={{ background: 'rgba(255,255,255,0.62)' }}
                        >
                          <div className="card-inner">
                            <div className="card-header">
                              <div>
                                <h3 style={{ fontSize: 16 }}>{t.name}</h3>
                                <p className="muted" style={{ marginTop: 6 }}>
                                  {rel.relationship} • Since {rel.since}
                                </p>
                              </div>
                              <span className="pill">
                                {Icons.Star({ size: 14 })} {t.rating.toFixed(1)}
                              </span>
                            </div>
                            <div className="btn-row">
                              <Chip text={t.mode} />
                              <Chip text={t.level} />
                              {t.subjects.slice(0, 2).map((s) => (
                                <Chip key={s} text={s} />
                              ))}
                            </div>
                            <div className="btn-row" style={{ marginTop: 10 }}>
                              <button className="btn">
                                {Icons.Message({ size: 16 })}
                                Message
                              </button>
                              <button className="btn">
                                {Icons.Calendar({ size: 16 })}
                                Book
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            ) : section === 'parent.todos' ? (
              <section className="card">
                <div className="card-inner">
                  <SectionTitle
                    title="To‑dos"
                    subtitle="Tasks and assignments your child needs to complete."
                    right={<span className="pill">{parentTodos.length} items</span>}
                  />
                  <div className="grid" style={{ gap: 10, marginTop: 12 }}>
                    {parentTodos.map((t) => (
                      <div
                        key={t.id}
                        className="card"
                        style={{ background: 'rgba(255,255,255,0.62)' }}
                      >
                        <div className="card-inner">
                          <div className="card-header">
                            <div>
                              <h3 style={{ fontSize: 16 }}>{t.title}</h3>
                              <p className="muted" style={{ marginTop: 6 }}>
                                {t.subject} • Due: {t.due}
                              </p>
                            </div>
                            <StatusPill text={t.status} tone={todoTone(t)} />
                          </div>
                          <div className="btn-row" style={{ marginTop: 10 }}>
                            <button className="btn">
                              {Icons.CheckBook({ size: 16 })}
                              View
                            </button>
                            <button className="btn">
                              {Icons.Message({ size: 16 })}
                              Ask tutor
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : section === 'parent.profile' ? (
              <section className="grid" style={{ gap: 14 }}>
                <div className="card">
                  <div className="card-inner">
                    <SectionTitle
                      title="Student profile"
                      subtitle="Overview of your child and learning context."
                      right={<span className="pill">Parent</span>}
                    />
                    <div className="grid grid-2" style={{ marginTop: 12 }}>
                      <div className="card" style={{ background: 'rgba(255,255,255,0.62)' }}>
                        <div className="card-inner">
                          <div className="label">Child</div>
                          <p className="subtle" style={{ marginTop: 6 }}>
                            {parentProfile?.childName ?? parentChild.name}
                          </p>
                          <p className="muted" style={{ marginTop: 6 }}>
                            {parentProfile?.childYearLevel ?? parentChild.yearLevel}
                            {parentProfile?.city ? ` • ${parentProfile.city}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="card" style={{ background: 'rgba(255,255,255,0.62)' }}>
                        <div className="card-inner">
                          <div className="label">Next session</div>
                          <p className="subtle" style={{ marginTop: 6 }}>
                            {parentSessions.find((s) => s.status === 'Upcoming')?.title ?? '—'}
                          </p>
                          <p className="muted" style={{ marginTop: 6 }}>
                            {parentSessions.find((s) => s.status === 'Upcoming')?.when ?? ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : section === 'parent.find' ? (
              <BrowseTutorsDiscover
                title="Find a tutor"
                subtitle="Search by subject, location, or tutor name. Tutors already working with your child are labeled."
                query={query}
                setQuery={setQuery}
                level={level}
                setLevel={setLevel}
                mode={mode}
                setMode={setMode}
                filteredTutors={filteredTutors}
                existingTutorIds={parentExistingTutorIds}
              />
            ) : (
              <section className="card">
                <div className="card-inner">
                  <SectionTitle
                    title="Overview"
                    subtitle="Sessions, tutors, and to‑dos at a glance."
                    right={
                      <span className="pill">
                        {parentProfile?.childName ?? parentChild.name}
                      </span>
                    }
                  />
                  <div className="grid grid-2" style={{ marginTop: 12 }}>
                    <Stat
                      icon={Icons.Calendar}
                      label="Upcoming sessions"
                      value={`${parentSessions.filter((s) => s.status === 'Upcoming').length}`}
                      hint="This week"
                      accent="parent"
                    />
                    <Stat
                      icon={Icons.Users}
                      label="Tutors"
                      value={`${parentTutors.length}`}
                      hint="Active"
                      accent="parent"
                    />
                  </div>
                </div>
              </section>
            )
          ) : (
            section === 'tutor.requests' ? (
              <section className="grid" style={{ gap: 14 }}>
                <div className="card">
                  <div className="card-inner">
                    <SectionTitle
                      title="Requests"
                      subtitle="Student needs you can respond to."
                      right={<span className="pill">Tutor</span>}
                    />

                    <div className="grid grid-2" style={{ marginTop: 12 }}>
                      <Stat
                        icon={Icons.Users}
                        label="Active requests"
                        value={`${studentNeeds.length}`}
                        hint="Matching your subjects"
                        accent="tutor"
                      />
                      <Stat
                        icon={Icons.Send}
                        label="Offers sent"
                        value={`${tutorOffers.length}`}
                        hint="Pending responses"
                        accent="tutor"
                      />
                    </div>
                  </div>
                </div>

                <section className="grid grid-2">
                  {studentNeeds.map((s) => (
                    <div key={s.id} className="card">
                      <div className="card-inner">
                        <div className="card-header">
                          <div>
                            <h3 style={{ fontSize: 18 }}>{s.studentName}</h3>
                            <p className="muted" style={{ marginTop: 4 }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                {Icons.Pin({ size: 14 })} {s.city}
                              </span>{' '}
                              •{' '}
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                {Icons.Calendar({ size: 14 })} {s.schedule}
                              </span>
                            </p>
                          </div>
                          <div className="pill">{s.level}</div>
                        </div>
                        <div className="btn-row" style={{ marginTop: 10 }}>
                          <Chip text={s.subject} />
                          <Chip text={s.goal} />
                        </div>
                        <div className="btn-row" style={{ marginTop: 12 }}>
                          <button
                            className="btn"
                            onClick={() => setDetailsNeedId(s.id)}
                          >
                            {Icons.Search({ size: 16 })}
                            View details
                          </button>
                          <button
                            className="btn"
                            onClick={() => {
                              setOfferNeedId(s.id)
                              setOfferSentForNeedId(null)
                            }}
                          >
                            {Icons.Send({ size: 16 })}
                            Send offer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </section>
              </section>
            ) : section === 'tutor.offers' ? (
              <section className="card">
                <div className="card-inner">
                  <SectionTitle
                    title="Offers"
                    subtitle="Your sent offers and their status."
                    right={<span className="pill">{tutorOffers.length} total</span>}
                  />

                  <div className="grid" style={{ gap: 10, marginTop: 12 }}>
                    {tutorOffers.map((o: TutorOffer) => (
                      <div
                        key={o.id}
                        className="card"
                        style={{ background: 'rgba(255,255,255,0.62)' }}
                      >
                        <div className="card-inner">
                          <div className="card-header">
                            <div>
                              <h3 style={{ fontSize: 16 }}>
                                {o.subject} • {o.toStudentName}
                              </h3>
                              <p className="muted" style={{ marginTop: 6 }}>
                                Sent: {o.sentAt} • ₱{o.proposedRate}/hr • {o.availability}
                              </p>
                            </div>
                            <StatusPill
                              text={o.status}
                              tone={o.status === 'Accepted' ? 'good' : o.status === 'Declined' ? 'warn' : 'neutral'}
                            />
                          </div>
                          <div className="btn-row" style={{ marginTop: 10 }}>
                            <button className="btn">
                              {Icons.Message({ size: 16 })}
                              Message
                            </button>
                            <button className="btn">
                              {Icons.CheckBook({ size: 16 })}
                              View offer
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : section === 'tutor.clients' ? (
              <section className="card">
                <div className="card-inner">
                  <SectionTitle
                    title="Clients"
                    subtitle="Your active and trial students."
                    right={<span className="pill">{tutorClients.length} clients</span>}
                  />
                  <div className="grid grid-2" style={{ marginTop: 12 }}>
                    {tutorClients.map((c: TutorClient) => (
                      <div
                        key={c.id}
                        className="card"
                        style={{ background: 'rgba(255,255,255,0.62)' }}
                      >
                        <div className="card-inner">
                          <div className="card-header">
                            <div>
                              <h3 style={{ fontSize: 16 }}>{c.name}</h3>
                              <p className="muted" style={{ marginTop: 6 }}>
                                {c.yearLevel} • {c.subjectFocus} • {c.city}
                              </p>
                            </div>
                            <StatusPill
                              text={c.status}
                              tone={c.status === 'Active' ? 'good' : c.status === 'Trial' ? 'neutral' : 'warn'}
                            />
                          </div>
                          <div className="btn-row" style={{ marginTop: 10 }}>
                            <button className="btn">
                              {Icons.Message({ size: 16 })}
                              Message
                            </button>
                            <button className="btn">
                              {Icons.Calendar({ size: 16 })}
                              Schedule
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : section === 'tutor.sessions' ? (
              <section className="card">
                <div className="card-inner">
                  <SectionTitle
                    title="Sessions"
                    subtitle="Your upcoming schedule."
                    right={<span className="pill">{tutorSessions.length} items</span>}
                  />
                  <div className="grid" style={{ gap: 10, marginTop: 12 }}>
                    {tutorSessions.map((s: TutorSession) => {
                      const client = tutorClients.find((c) => c.id === s.withClientId)
                      return (
                        <div
                          key={s.id}
                          className="card"
                          style={{ background: 'rgba(255,255,255,0.62)' }}
                        >
                          <div className="card-inner">
                            <div className="card-header">
                              <div>
                                <h3 style={{ fontSize: 16 }}>
                                  {s.subject}
                                  {client ? ` • ${client.name}` : ''}
                                </h3>
                                <p className="muted" style={{ marginTop: 6 }}>
                                  {s.when} • {s.durationMins} min • {s.mode}
                                </p>
                              </div>
                              <StatusPill text={s.status} tone={s.status === 'Completed' ? 'good' : 'neutral'} />
                            </div>
                            <div className="btn-row" style={{ marginTop: 10 }}>
                              <button className="btn">
                                {Icons.Message({ size: 16 })}
                                Message
                              </button>
                              <button className="btn btn-primary btn-tutor">
                                {Icons.Send({ size: 16 })}
                                Start
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            ) : (
              <section className="card">
                <div className="card-inner">
                  <SectionTitle
                    title="Tutor workspace"
                    subtitle="Use the menu to switch between requests, offers, clients, and sessions."
                    right={<span className="pill">Tutor</span>}
                  />
                  <div className="grid grid-2" style={{ marginTop: 12 }}>
                    <Stat
                      icon={Icons.Users}
                      label="Requests"
                      value={`${studentNeeds.length}`}
                      hint="New matches"
                      accent="tutor"
                    />
                    <Stat
                      icon={Icons.Send}
                      label="Offers"
                      value={`${tutorOffers.length}`}
                      hint="Sent"
                      accent="tutor"
                    />
                  </div>
                </div>
              </section>
            )
          )}
        </div>
      </section>

      <Modal
        open={!!detailsNeed}
        title={detailsNeed ? `Request details — ${detailsNeed.studentName}` : 'Request details'}
        onClose={() => setDetailsNeedId(null)}
        footer={
          detailsNeed ? (
            <>
              <button
                className="btn"
                onClick={() => {
                  setDetailsNeedId(null)
                  setOfferNeedId(detailsNeed.id)
                  setOfferSentForNeedId(null)
                }}
              >
                {Icons.Send({ size: 16 })}
                Send offer
              </button>
              <button className="btn" onClick={() => setDetailsNeedId(null)}>
                Done
              </button>
            </>
          ) : null
        }
      >
        {detailsNeed ? (
          <div className="grid" style={{ gap: 12 }}>
            <div className="btn-row">
              <Chip text={detailsNeed.subject} />
              <Chip text={detailsNeed.level} />
              <Chip text={detailsNeed.city} />
              <Chip text={detailsNeed.schedule} />
            </div>
            <div className="card" style={{ background: 'rgba(255,255,255,0.65)' }}>
              <div className="card-inner">
                <div className="label">Goal</div>
                <p className="subtle" style={{ marginTop: 6 }}>
                  {detailsNeed.goal}
                </p>
              </div>
            </div>
            <div className="grid grid-2">
              <div className="card" style={{ background: 'rgba(255,255,255,0.65)' }}>
                <div className="card-inner">
                  <div className="label">What to include in your offer</div>
                  <p className="muted" style={{ marginTop: 6 }}>
                    Rate, availability, and a short plan that matches the goal.
                  </p>
                </div>
              </div>
              <div className="card" style={{ background: 'rgba(255,255,255,0.65)' }}>
                <div className="card-inner">
                  <div className="label">Next step</div>
                  <p className="muted" style={{ marginTop: 6 }}>
                    Parent reviews and replies, then you confirm and schedule.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!offerNeed}
        title={
          offerNeed && offerSentForNeedId === offerNeed.id
            ? 'Offer sent'
            : offerNeed
              ? `Send offer — ${offerNeed.studentName}`
              : 'Send offer'
        }
        onClose={() => setOfferNeedId(null)}
        footer={
          offerNeed ? (
            offerSentForNeedId === offerNeed.id ? (
              <>
                <button className="btn" onClick={() => setOfferNeedId(null)}>
                  Done
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const q = new URLSearchParams()
                    q.set('request', offerNeed.id)
                    q.set('student', offerNeed.studentName)
                    navigate(`/app/messages?${q.toString()}`)
                    setOfferNeedId(null)
                    setOfferSentForNeedId(null)
                  }}
                >
                  {Icons.Message({ size: 16 })}
                  Open messages
                </button>
              </>
            ) : (
              <>
                <button className="btn" onClick={() => setOfferNeedId(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-tutor"
                  onClick={() => {
                    if (session.role === 'tutor' && offerNeed) {
                      const rate =
                        Number(String(offerRate).replace(/[^\d.]/g, '')) || 0
                      recordTutorSentOffer(
                        session.email,
                        {
                          requestId: offerNeed.id,
                          studentName: offerNeed.studentName,
                          subject: offerNeed.subject,
                          proposedRate: rate,
                          availability: offerAvailability,
                          message: offerMessage,
                        },
                        session.displayName
                      )
                    }
                    setOfferSentForNeedId(offerNeed.id)
                  }}
                >
                  {Icons.Send({ size: 16 })}
                  Send offer
                </button>
              </>
            )
          ) : null
        }
      >
        {offerNeed ? (
          <div className="grid" style={{ gap: 12 }}>
            <div className="btn-row">
              <Chip text={offerNeed.subject} />
              <Chip text={offerNeed.level} />
              <Chip text={offerNeed.city} />
              <Chip text={offerNeed.schedule} />
            </div>

            {offerSentForNeedId === offerNeed.id ? (
              <div className="card" style={{ background: 'rgba(255,255,255,0.65)' }}>
                <div className="card-inner">
                  <p className="subtle" style={{ marginTop: 0 }}>
                    The parent can now review your offer and message you back.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-2">
                  <div className="field">
                    <div className="label">Your rate (PHP / hour)</div>
                    <input
                      className="input"
                      value={offerRate}
                      onChange={(e) => setOfferRate(e.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="field">
                    <div className="label">Availability</div>
                    <input
                      className="input"
                      value={offerAvailability}
                      onChange={(e) => setOfferAvailability(e.target.value)}
                      placeholder="e.g., Mon/Wed 6–8pm"
                    />
                  </div>
                </div>

                <div className="field">
                  <div className="label">Message</div>
                  <textarea
                    className="input"
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    rows={5}
                    style={{ resize: 'vertical' }}
                  />
                  <div className="muted">
                    Tip: Keep it short—align your plan to the student’s goal.
                  </div>
                </div>

                <div className="card" style={{ background: 'rgba(255,255,255,0.65)' }}>
                  <div className="card-inner">
                    <div className="label">Preview</div>
                    <p className="muted" style={{ marginTop: 6 }}>
                      Rate: ₱{offerRate}/hr • Availability: {offerAvailability}
                    </p>
                    <p className="subtle" style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>
                      {offerMessage}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </Modal>
    </main>
  )
}

