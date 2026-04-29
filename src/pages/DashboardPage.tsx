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
import type { Session, TutorCredential } from '../state/session'
import {
  fetchServerAvailability,
  fetchServerTutors,
  saveServerAvailability,
  type ServerTutor,
} from '../state/serverApi'
import { SectionTitle, Stat } from '../components/ui'
import { Icons } from '../components/icons'
import { MessagesPanel } from './MessagesPage'
import { NotesPanel } from './NotesPage'
import { recordTutorSentOffer } from '../state/inbox'
import { ProfileSection } from '../components/ProfileSection'
import { CredentialPreviewCard } from '../components/CredentialPreviewCard'
import { AvailabilityGrid } from '../components/AvailabilityGrid'
import { ReviewModal } from '../components/ReviewModal'
import { OverflowMenu, type OverflowMenuItem } from '../components/OverflowMenu'
import { toast } from '../components/Toast'
import {
  createAvailability,
  loadAvailabilityFor,
  saveAvailabilityFor,
  toggleSlot,
  type Availability,
  type AvailabilityDay,
  type AvailabilitySlotKey,
} from '../state/availability'
import {
  addUserSession,
  hideMockSession,
  isUserBookedId,
  loadHiddenMockIds,
  loadUserSessions,
  updateUserSession,
  type UserSession,
} from '../state/userSessions'
import {
  createRescheduleRequest,
  updateRescheduleRequest,
  type RescheduleRequest,
} from '../state/rescheduleRequests'

function prettyWhen(when: string): string {
  const isoLike = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(when)
  if (!isoLike) return when
  const d = new Date(when)
  if (Number.isNaN(d.getTime())) return when
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d)
  } catch {
    return when
  }
}

type UnifiedSession = {
  id: string
  title: string
  tutorId: string
  tutorName?: string
  when: string
  durationMins: number
  mode: TutorProfile['mode']
  status: StudentSession['status'] | 'Canceled' | 'Pending tutor approval'
  isUserBooked: boolean
}

type TutorProfileViewData = {
  id: string
  name: string
  subjects: string[]
  level?: TutorProfile['level']
  city?: string
  mode?: TutorProfile['mode']
  hourlyRate?: number
  rating?: number
  yearsExperience?: string
  shortBio?: string
  photoDataUrl?: string
  credentials?: TutorCredential[]
}

function mapServerTutorToCatalogTutor(tutor: ServerTutor): TutorProfile {
  const validLevel =
    tutor.level === 'Elementary' ||
    tutor.level === 'JHS' ||
    tutor.level === 'SHS' ||
    tutor.level === 'College'
      ? tutor.level
      : 'JHS'
  const validMode =
    tutor.mode === 'Online' || tutor.mode === 'In-person' || tutor.mode === 'Hybrid'
      ? tutor.mode
      : 'Online'
  const subjects = tutor.subjects.length ? tutor.subjects : ['General tutoring']
  return {
    id: tutor.id,
    name: tutor.name,
    subjects,
    level: validLevel,
    mode: validMode,
    hourlyRate: tutor.hourlyRate || 450,
    classesCount: 0,
    city: tutor.city || 'N/A',
    rating: tutor.rating || 5,
    availability: tutor.availability || [],
    yearsExperience: tutor.yearsExperience || undefined,
    shortBio: tutor.shortBio || undefined,
    credentials: tutor.credentials.map((cred) => ({
      id: cred.id,
      title: cred.fileName,
      fileName: cred.fileName,
      url: cred.dataUrl || '',
      dataUrl: cred.dataUrl,
      mimeType: cred.mimeType,
      sizeBytes: cred.sizeBytes,
      uploadedAtIso: cred.uploadedAtIso,
    })),
  }
}

function userToUnified(s: UserSession): UnifiedSession {
  return {
    id: s.id,
    title: `${s.subject} session with ${s.tutorName}`,
    tutorId: s.tutorId,
    tutorName: s.tutorName,
    when: s.when,
    durationMins: s.durationMins,
    mode: s.mode,
    status:
      s.status === 'Canceled'
        ? 'Canceled'
        : s.status === 'Pending tutor approval'
          ? 'Pending tutor approval'
          : s.status === 'Completed'
            ? 'Completed'
            : 'Upcoming',
    isUserBooked: true,
  }
}

function mockToUnified(s: StudentSession): UnifiedSession {
  return {
    id: s.id,
    title: s.title,
    tutorId: s.tutorId,
    when: s.when,
    durationMins: s.durationMins,
    mode: s.mode,
    status: s.status,
    isUserBooked: false,
  }
}

function unifiedTone(s: UnifiedSession): 'good' | 'warn' | 'neutral' {
  if (s.status === 'Upcoming') return 'neutral'
  if (s.status === 'Completed') return 'good'
  if (s.status === 'Pending tutor approval') return 'warn'
  return 'warn'
}

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
  onBook,
  onViewProfile,
  onMessage,
}: {
  t: TutorProfile
  /** When set, this tutor is already in the learner’s roster (student/parent). */
  existingTutor?: boolean
  onBook?: (tutor: TutorProfile) => void
  onViewProfile?: (tutor: TutorProfile) => void
  onMessage?: (tutor: TutorProfile) => void
}) {
  const tutorAvailability = useMemo(
    () => createAvailability(t.availability),
    [t.availability]
  )
  const menuItems = tutorCardMenu(t, existingTutor, onBook, onViewProfile, onMessage)

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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {existingTutor ? (
                <span className="pill" title="Already in your tutors list">
                  Your tutor
                </span>
              ) : null}
              <div className="pill">₱{t.hourlyRate}/hr</div>
              <button
                type="button"
                className="btn"
                onClick={() => onBook?.(t)}
              >
                {Icons.Calendar({ size: 16 })}
                Book Session
              </button>
              <OverflowMenu items={menuItems} />
            </div>
          </div>
        </div>

        <SubjectChips level={t.level} subjects={t.subjects} />

        <div style={{ marginTop: 12 }}>
          <AvailabilityGrid
            availability={tutorAvailability}
            compact
            title="When they’re open"
          />
        </div>
      </div>
    </div>
  )
}

function tutorCardMenu(
  t: TutorProfile,
  existingTutor: boolean | undefined,
  onBook?: (tutor: TutorProfile) => void,
  onViewProfile?: (tutor: TutorProfile) => void,
  onMessage?: (tutor: TutorProfile) => void
): OverflowMenuItem[] {
  return [
    {
      key: 'profile',
      label: 'View profile',
      icon: Icons.CheckBook,
      onSelect: () => onViewProfile?.(t),
    },
    {
      key: 'message',
      label: 'Message',
      icon: Icons.Message,
      onSelect: () => onMessage?.(t),
    },
    {
      key: 'book',
      label: existingTutor ? 'Book Session' : 'Book Session',
      icon: Icons.Calendar,
      onSelect: () => onBook?.(t),
    },
  ]
}

function SubjectChips({
  level,
  subjects,
  maxVisible = 2,
  leadingChips = [],
}: {
  level?: TutorProfile['level']
  subjects: string[]
  maxVisible?: number
  leadingChips?: string[]
}) {
  const visible = subjects.slice(0, maxVisible)
  const overflow = subjects.slice(maxVisible)
  const overflowLabel = overflow.join(', ')
  return (
    <div className="btn-row" style={{ marginTop: 10 }}>
      {leadingChips.map((c) => (
        <Chip key={`lead-${c}`} text={c} />
      ))}
      {level ? <Chip text={level} /> : null}
      {visible.map((s) => (
        <Chip key={s} text={s} />
      ))}
      {overflow.length > 0 ? (
        <span
          className="pill"
          title={overflowLabel}
          aria-label={`More subjects: ${overflowLabel}`}
        >
          +{overflow.length} more
        </span>
      ) : null}
    </div>
  )
}

function tutorListCardMenu(
  t: TutorProfile,
  onBook?: (tutor: TutorProfile) => void,
  onViewProfile?: (tutor: TutorProfile) => void,
  onMessage?: (tutor: TutorProfile) => void
): OverflowMenuItem[] {
  return [
    {
      key: 'profile',
      label: 'View profile',
      icon: Icons.CheckBook,
      onSelect: () => onViewProfile?.(t),
    },
    {
      key: 'message',
      label: 'Message',
      icon: Icons.Message,
      onSelect: () => onMessage?.(t),
    },
    {
      key: 'book',
      label: 'Book Session',
      icon: Icons.Calendar,
      onSelect: () => onBook?.(t),
    },
  ]
}

function YourTutorsStudentList({
  tutorDirectory,
  onBook,
  onViewProfile,
  onMessage,
}: {
  tutorDirectory: TutorProfile[]
  onBook?: (tutor: TutorProfile) => void
  onViewProfile?: (tutor: TutorProfile) => void
  onMessage?: (tutor: TutorProfile) => void
}) {
  return (
    <section className="card">
      <div className="card-inner">
        <SectionTitle
          title="Your tutors"
          subtitle="People you’re currently learning with."
        />
        <div className="grid" style={{ gap: 10, marginTop: 12 }}>
          {studentTutors.map((rel) => {
            const t = tutorDirectory.find((x) => x.id === rel.tutorId)
            if (!t) return null
            return (
              <div
                key={rel.tutorId}
                className="card"
                style={{ background: 'var(--surface-soft)' }}
              >
                <div className="card-inner">
                  <div className="card-header">
                    <div>
                      <h3 style={{ fontSize: 16 }}>{t.name}</h3>
                      <p className="muted" style={{ marginTop: 6 }}>
                        {rel.relationship} • Since {rel.since}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="pill">
                        {Icons.Star({ size: 14 })} {t.rating.toFixed(1)}
                      </span>
                      <OverflowMenu items={tutorListCardMenu(t, onBook, onViewProfile, onMessage)} />
                    </div>
                  </div>
                  <SubjectChips
                    level={t.level}
                    subjects={t.subjects}
                    maxVisible={2}
                    leadingChips={[t.mode]}
                  />
                  <div style={{ marginTop: 10 }}>
                    <AvailabilityGrid
                      availability={createAvailability(t.availability)}
                      compact
                      title="When they’re open"
                    />
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
  filteredTutors,
  tutorDirectory,
  existingTutorIds,
  onBook,
  onViewProfile,
  onMessage,
  loading,
  error,
}: {
  tutorView: 'discover' | 'my'
  setTutorView: (v: 'discover' | 'my') => void
  query: string
  setQuery: (v: string) => void
  level: 'All' | TutorProfile['level']
  setLevel: (v: 'All' | TutorProfile['level']) => void
  filteredTutors: TutorProfile[]
  tutorDirectory: TutorProfile[]
  existingTutorIds: Set<string>
  onBook?: (tutor: TutorProfile) => void
  onViewProfile?: (tutor: TutorProfile) => void
  onMessage?: (tutor: TutorProfile) => void
  loading?: boolean
  error?: string | null
}) {
  const discoveryTutors = useMemo(
    () => filteredTutors.filter((t) => !existingTutorIds.has(t.id)),
    [filteredTutors, existingTutorIds]
  )

  return (
    <section className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div className="card-inner">
          <div className="label" style={{ marginBottom: 8 }}>
            Tutors
          </div>
          <div
            className="tab-switch"
            role="tablist"
            aria-label="Tutors view"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tutorView === 'discover'}
              className={`tab-switch-btn ${tutorView === 'discover' ? 'is-active' : ''}`}
              data-accent="student"
              onClick={() => setTutorView('discover')}
            >
              {Icons.Search({ size: 16 })}
              Discover tutors
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tutorView === 'my'}
              className={`tab-switch-btn ${tutorView === 'my' ? 'is-active' : ''}`}
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
        <YourTutorsStudentList
          tutorDirectory={tutorDirectory}
          onBook={onBook}
          onViewProfile={onViewProfile}
          onMessage={onMessage}
        />
      ) : (
        <BrowseTutorsDiscover
          title="Browse tutors"
          subtitle="Search by subject, place, or name. Tutors you already work with are shown under Your tutors."
          query={query}
          setQuery={setQuery}
          level={level}
          setLevel={setLevel}
          filteredTutors={discoveryTutors}
          existingTutorIds={new Set()}
          onBook={onBook}
          onViewProfile={onViewProfile}
          onMessage={onMessage}
          loading={loading}
          error={error}
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
  filteredTutors,
  existingTutorIds,
  onBook,
  onViewProfile,
  onMessage,
  loading,
  error,
}: {
  title: string
  subtitle: string
  query: string
  setQuery: (v: string) => void
  level: 'All' | TutorProfile['level']
  setLevel: (v: 'All' | TutorProfile['level']) => void
  filteredTutors: TutorProfile[]
  /** Tutor ids already linked on the account (shown with a “Your tutor” badge). */
  existingTutorIds: Set<string>
  onBook?: (tutor: TutorProfile) => void
  onViewProfile?: (tutor: TutorProfile) => void
  onMessage?: (tutor: TutorProfile) => void
  loading?: boolean
  error?: string | null
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
          </div>

          <div className="btn-row" style={{ marginTop: 12 }}>
            <button
              className="btn"
              onClick={() => {
                setQuery('')
                setLevel('All')
              }}
            >
              {Icons.Filter({ size: 16 })}
              Clear filters
            </button>
            <button
              className="btn"
              onClick={() => {
                localStorage.setItem(
                  'brainlink.savedTutorSearch.v1',
                  JSON.stringify({ query, level, savedAt: Date.now() })
                )
                toast.success('Search saved.')
              }}
            >
              Save search
            </button>
          </div>
        </div>
      </div>

      {loading ? <p className="muted">Loading tutors...</p> : null}
      {error ? (
        <div className="card" style={{ background: 'rgba(255, 221, 221, 0.45)' }}>
          <div className="card-inner">
            <p className="muted" style={{ color: '#a6262b' }}>
              Could not load live tutor accounts: {error}
            </p>
          </div>
        </div>
      ) : null}

      <section className="grid grid-2">
        {filteredTutors.map((t) => (
          <TutorCard
            key={t.id}
            t={t}
            existingTutor={existingTutorIds.has(t.id)}
            onBook={onBook}
            onViewProfile={onViewProfile}
            onMessage={onMessage}
          />
        ))}
      </section>
    </section>
  )
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
      ? (session.profile as unknown as {
          childName?: string
          childYearLevel?: string
          city?: string
          children?: Array<{ name?: string; grade?: string }>
        } | undefined)
      : undefined
  const primaryChild = parentProfile?.children?.[0]
  const tutorProfile =
    session.role === 'tutor'
      ? (session.profile as unknown as {
          subjects?: string
          yearsExperience?: string
          city?: string
          shortBio?: string
          photoDataUrl?: string
          credentials?: TutorCredential[]
        } | undefined)
      : undefined

  type Section =
    | 'student.overview'
    | 'student.sessions'
    | 'student.browse'
    | 'student.todos'
    | 'student.profile'
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
    | 'tutor.profile'

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
  const [studentTutorView, setStudentTutorView] = useState<'discover' | 'my'>(
    'discover'
  )
  const [serverTutors, setServerTutors] = useState<ServerTutor[]>([])
  const [tutorsLoading, setTutorsLoading] = useState(false)
  const [tutorsError, setTutorsError] = useState<string | null>(null)
  const [profileTutor, setProfileTutor] = useState<TutorProfileViewData | null>(null)

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

  // Live session version tick — bumped whenever user sessions or hidden mock ids change
  const [sessionsVersion, setSessionsVersion] = useState(0)
  const bumpSessions = () => setSessionsVersion((v) => v + 1)

  // Booking modal
  const [bookingTutor, setBookingTutor] = useState<TutorProfile | null>(null)
  const [bookingWhen, setBookingWhen] = useState('')
  const [bookingSubject, setBookingSubject] = useState('')
  const [bookingDuration, setBookingDuration] = useState('60')

  // Reschedule modal
  const [rescheduleTarget, setRescheduleTarget] =
    useState<UnifiedSession | null>(null)
  const [rescheduleWhen, setRescheduleWhen] = useState('')
  const [rescheduleNote, setRescheduleNote] = useState('')

  // Cancel confirmation
  const [cancelTarget, setCancelTarget] = useState<UnifiedSession | null>(null)

  // Review modal
  const [reviewTarget, setReviewTarget] = useState<{
    tutorId: string
    tutorName: string
  } | null>(null)

  // Tutor counter-propose modal
  const [counterRequestId, setCounterRequestId] = useState<string | null>(null)
  const [counterWhen, setCounterWhen] = useState('')
  const [requestsVersion, setRequestsVersion] = useState(0)
  const bumpRequests = () => setRequestsVersion((v) => v + 1)

  // Tutor's editable availability (keyed to their session email)
  // We keep a "saved" snapshot and a "draft" the tutor edits. They only
  // persist on explicit Save, and can Discard to revert.
  const [savedAvailability, setSavedAvailability] = useState<Availability>(
    () =>
      session.role === 'tutor'
        ? loadAvailabilityFor(session.email)
        : createAvailability()
  )
  const [availability, setAvailability] = useState<Availability>(
    savedAvailability
  )

  useEffect(() => {
    if (session.role === 'tutor') return
    const shouldFetch =
      session.role === 'student'
        ? section === 'student.browse'
        : section === 'parent.find' || section === 'parent.tutors'
    if (!shouldFetch) return
    let alive = true
    setTutorsLoading(true)
    setTutorsError(null)
    fetchServerTutors()
      .then((result) => {
        if (!alive) return
        setServerTutors(result.tutors)
      })
      .catch((error) => {
        if (!alive) return
        setTutorsError(error instanceof Error ? error.message : 'Could not load tutors.')
        setServerTutors([])
      })
      .finally(() => {
        if (!alive) return
        setTutorsLoading(false)
      })
    return () => {
      alive = false
    }
  }, [session.role, section])

  const tutorDirectory = useMemo<TutorProfile[]>(() => {
    const byId = new Map<string, TutorProfile>()
    for (const tutor of tutorProfiles) byId.set(tutor.id, tutor)
    for (const serverTutor of serverTutors) {
      byId.set(serverTutor.id, mapServerTutorToCatalogTutor(serverTutor))
    }
    return Array.from(byId.values())
  }, [serverTutors])

  useEffect(() => {
    if (session.role === 'tutor') {
      const fresh = loadAvailabilityFor(session.email)
      setSavedAvailability(fresh)
      setAvailability(fresh)
      let alive = true
      fetchServerAvailability()
        .then((result) => {
          if (!alive) return
          const serverAvailability = createAvailability(result.slots)
          setSavedAvailability(serverAvailability)
          setAvailability(serverAvailability)
          // Keep a local backup so a temporary API outage does not erase tutor edits.
          saveAvailabilityFor(session.email, serverAvailability)
        })
        .catch(() => {
          if (!alive) return
          toast.error('Could not load availability from server. Showing your local draft.')
        })
      return () => {
        alive = false
      }
    }
  }, [session.email, session.role])

  function handleToggleAvailability(
    day: AvailabilityDay,
    slot: AvailabilitySlotKey
  ) {
    setAvailability((prev) => toggleSlot(prev, day, slot))
  }

  const availabilityDirty = useMemo(() => {
    const a = Array.from(availability).sort().join('|')
    const b = Array.from(savedAvailability).sort().join('|')
    return a !== b
  }, [availability, savedAvailability])

  async function saveAvailability() {
    const next = new Set(availability)
    try {
      await saveServerAvailability(Array.from(next))
      saveAvailabilityFor(session.email, next)
      setSavedAvailability(next)
      toast.success('Availability saved.')
    } catch {
      toast.error('Could not save availability. Your changes are kept locally until retry.')
    }
  }

  function discardAvailability() {
    setAvailability(new Set(savedAvailability))
    toast.info('Changes discarded.')
  }

  const filteredTutors = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tutorDirectory.filter((t) => {
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.subjects.some((s) => s.toLowerCase().includes(q)) ||
        t.city.toLowerCase().includes(q)
      const matchesLevel = level === 'All' || t.level === level
      return matchesQuery && matchesLevel
    })
  }, [query, level, tutorDirectory])

  const studentExistingTutorIds = useMemo(
    () => new Set(studentTutors.map((r) => r.tutorId)),
    []
  )
  const parentExistingTutorIds = useMemo<Set<string>>(
    () => new Set(parentTutors.map((r) => r.tutorId)),
    []
  )

  const mergedStudentSessions = useMemo<UnifiedSession[]>(() => {
    void sessionsVersion
    const hidden = loadHiddenMockIds()
    const mock = studentSessions
      .filter((s) => !hidden.has(s.id))
      .map(mockToUnified)
    const mine = loadUserSessions()
      .filter(
        (s) =>
          s.bookedForRole === 'student' && s.bookedByEmail === session.email
      )
      .map(userToUnified)
    return [...mine, ...mock]
  }, [sessionsVersion, session.email])

  const mergedParentSessions = useMemo<UnifiedSession[]>(() => {
    void sessionsVersion
    const hidden = loadHiddenMockIds()
    const mock = parentSessions
      .filter((s) => !hidden.has(s.id))
      .map(mockToUnified)
    const mine = loadUserSessions()
      .filter(
        (s) => s.bookedForRole === 'parent' && s.bookedByEmail === session.email
      )
      .map(userToUnified)
    return [...mine, ...mock]
  }, [sessionsVersion, session.email])

  // Prototype note: tutor↔session ownership is loose in the mock data, so we
  // surface every reschedule request for the tutor view (sorted latest-first).
  const allPendingRequests = useMemo<RescheduleRequest[]>(() => {
    void requestsVersion
    if (session.role !== 'tutor') return []
    try {
      const raw = localStorage.getItem('brainlink.rescheduleRequests.v1')
      if (!raw) return []
      const list = JSON.parse(raw) as RescheduleRequest[]
      if (!Array.isArray(list)) return []
      return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
    } catch {
      return []
    }
  }, [requestsVersion, session.role])

  function openBookingModal(tutor: TutorProfile) {
    setBookingTutor(tutor)
    setBookingSubject(tutor.subjects[0] ?? '')
    setBookingDuration('60')
    setBookingWhen('')
  }

  function openTutorProfile(tutor: TutorProfile) {
    const profileFromSession =
      session.role === 'tutor' &&
      tutor.name.toLowerCase() === session.displayName.toLowerCase() &&
      tutorProfile
        ? tutorProfile
        : undefined
    setProfileTutor({
      id: tutor.id,
      name: tutor.name,
      subjects: tutor.subjects,
      level: tutor.level,
      city: tutor.city,
      mode: tutor.mode,
      hourlyRate: tutor.hourlyRate,
      rating: tutor.rating,
      yearsExperience: profileFromSession?.yearsExperience ?? tutor.yearsExperience,
      shortBio: profileFromSession?.shortBio ?? tutor.shortBio,
      photoDataUrl: profileFromSession?.photoDataUrl,
      credentials:
        profileFromSession?.credentials ??
        tutor.credentials?.map((cred) => ({
          id: cred.id,
          fileName: cred.fileName,
          mimeType: cred.mimeType || 'application/pdf',
          sizeBytes: cred.sizeBytes || 0,
          uploadedAtIso: cred.uploadedAtIso || new Date().toISOString(),
          dataUrl: cred.dataUrl || cred.url || '',
        })),
    })
  }

  function openMessageForTutor(tutor: { id: string; name: string }) {
    setProfileTutor(null)
    const q = new URLSearchParams()
    q.set('request', `tutor-${tutor.id}`)
    q.set('tutorId', tutor.id)
    q.set('tutor', tutor.name)
    navigate(`/app/messages?${q.toString()}`)
  }

  function openNotesForTutor(tutor: { id: string; name?: string }) {
    const q = new URLSearchParams()
    q.set('tutorId', tutor.id)
    if (tutor.name) q.set('tutor', tutor.name)
    navigate(`/app/notes?${q.toString()}`)
  }

  function startSessionAction(title: string) {
    toast.info(`Starting session flow for "${title}" is ready for integration.`)
  }

  function closeBookingModal() {
    setBookingTutor(null)
  }

  function confirmBooking() {
    if (!bookingTutor) return
    if (!bookingWhen) {
      toast.error('Please pick a date and time.')
      return
    }
    if (!bookingSubject.trim()) {
      toast.error('Please choose a subject.')
      return
    }
    const duration = Math.max(15, Number(bookingDuration) || 60)
    addUserSession({
      tutorId: bookingTutor.id,
      tutorName: bookingTutor.name,
      subject: bookingSubject,
      when: bookingWhen,
      durationMins: duration,
      mode: bookingTutor.mode,
      status: 'Upcoming',
      bookedByEmail: session.email,
      bookedForRole: session.role,
    })
    toast.success(
      `Session booked with ${bookingTutor.name} for ${prettyWhen(bookingWhen)}.`
    )
    closeBookingModal()
    bumpSessions()
  }

  function openReschedule(target: UnifiedSession) {
    setRescheduleTarget(target)
    setRescheduleWhen('')
    setRescheduleNote('')
  }

  function closeReschedule() {
    setRescheduleTarget(null)
  }

  function confirmReschedule() {
    if (!rescheduleTarget) return
    if (!rescheduleWhen) {
      toast.error('Please pick a new date and time.')
      return
    }

    const tutorName =
      rescheduleTarget.tutorName ??
      tutorDirectory.find((t) => t.id === rescheduleTarget.tutorId)?.name ??
      'your tutor'

    let affectedSessionId = rescheduleTarget.id

    if (rescheduleTarget.isUserBooked) {
      updateUserSession(rescheduleTarget.id, {
        status: 'Pending tutor approval',
      })
    } else {
      // Hide the mock session and create a replacement user session marked pending
      hideMockSession(rescheduleTarget.id)
      const created = addUserSession({
        tutorId: rescheduleTarget.tutorId,
        tutorName,
        subject: rescheduleTarget.title,
        when: rescheduleTarget.when,
        durationMins: rescheduleTarget.durationMins,
        mode: rescheduleTarget.mode,
        status: 'Pending tutor approval',
        bookedByEmail: session.email,
        bookedForRole: session.role,
      })
      affectedSessionId = created.id
    }

    createRescheduleRequest({
      sessionId: affectedSessionId,
      tutorId: rescheduleTarget.tutorId,
      requesterEmail: session.email,
      requesterName: session.displayName,
      originalWhen: rescheduleTarget.when,
      requestedWhen: rescheduleWhen,
      note: rescheduleNote.trim() || undefined,
    })

    toast.success(
      `Reschedule request sent to ${tutorName}. They’ll confirm or propose another time.`
    )
    closeReschedule()
    bumpSessions()
    bumpRequests()
  }

  function confirmCancel() {
    if (!cancelTarget) return
    if (cancelTarget.isUserBooked) {
      updateUserSession(cancelTarget.id, { status: 'Canceled' })
    } else {
      hideMockSession(cancelTarget.id)
    }
    toast.info('Session canceled.')
    setCancelTarget(null)
    bumpSessions()
  }

  function tutorDecision(
    req: RescheduleRequest,
    decision: 'Accepted' | 'Declined'
  ) {
    updateRescheduleRequest(req.id, { status: decision })
    if (decision === 'Accepted' && isUserBookedId(req.sessionId)) {
      updateUserSession(req.sessionId, {
        status: 'Upcoming',
        when: req.requestedWhen,
      })
    }
    toast.success(
      decision === 'Accepted'
        ? 'Reschedule accepted.'
        : 'Reschedule declined.'
    )
    bumpRequests()
    bumpSessions()
  }

  function submitCounter() {
    if (!counterRequestId) return
    if (!counterWhen) {
      toast.error('Please pick a counter time.')
      return
    }
    updateRescheduleRequest(counterRequestId, {
      status: 'Counter proposed',
      counterWhen,
    })
    toast.info('Counter-proposal sent to the learner.')
    setCounterRequestId(null)
    setCounterWhen('')
    bumpRequests()
  }

  function makeSessionMenuItems(s: UnifiedSession): OverflowMenuItem[] {
    const items: OverflowMenuItem[] = []
    const isActionable = s.status === 'Upcoming'
    items.push({
      key: 'reschedule',
      label: 'Reschedule',
      icon: Icons.Calendar,
      onSelect: () => openReschedule(s),
      disabled: !isActionable,
    })
    items.push({
      key: 'cancel',
      label: 'Cancel session',
      icon: Icons.Close,
      destructive: true,
      onSelect: () => setCancelTarget(s),
      disabled: !isActionable,
    })
    if (s.status === 'Completed') {
      items.push({
        key: 'rate',
        label: 'Rate tutor',
        icon: Icons.Star,
        onSelect: () => {
          const tutor = tutorDirectory.find((t) => t.id === s.tutorId)
          setReviewTarget({
            tutorId: s.tutorId,
            tutorName: tutor?.name ?? s.tutorName ?? 'Tutor',
          })
        },
      })
    }
    return items
  }

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
          { key: 'student.profile', label: 'My profile', icon: Icons.User },
        ]
      : session.role === 'parent'
        ? [
            { key: 'parent.overview', label: 'Overview', icon: Icons.Dashboard },
            { key: 'parent.sessions', label: 'Sessions', icon: Icons.Calendar },
            { key: 'parent.tutors', label: 'Tutors', icon: Icons.Users },
            { key: 'parent.todos', label: 'To‑dos', icon: Icons.CheckBook },
            { key: 'parent.find', label: 'Find tutors', icon: Icons.Search },
            { key: 'parent.profile', label: 'My profile', icon: Icons.User },
          ]
        : [
            { key: 'tutor.requests', label: 'Requests', icon: Icons.Users },
            { key: 'tutor.offers', label: 'Offers', icon: Icons.Send },
            { key: 'tutor.clients', label: 'Clients', icon: Icons.Cap },
            { key: 'tutor.sessions', label: 'Sessions', icon: Icons.Calendar },
            { key: 'tutor.profile', label: 'My profile', icon: Icons.User },
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
                          (parentProfile?.childName || parentProfile?.childYearLevel || primaryChild?.name || primaryChild?.grade)
                        ? `${theme.blurb} • ${primaryChild?.name ?? parentProfile?.childName ?? parentChild.name}${(primaryChild?.grade ?? parentProfile?.childYearLevel) ? ` • ${primaryChild?.grade ?? parentProfile?.childYearLevel}` : ''}`
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
                  style={
                    tutorProfile?.photoDataUrl
                      ? {
                          backgroundImage: `url(${tutorProfile.photoDataUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : {
                          background: `linear-gradient(135deg, ${theme.soft}, ${theme.strong})`,
                        }
                  }
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
                  (parentProfile?.childName || parentProfile?.childYearLevel || primaryChild?.name || primaryChild?.grade) ? (
                  <span className="pill">
                    {primaryChild?.name ?? parentProfile?.childName ?? parentChild.name}
                    {(primaryChild?.grade ?? parentProfile?.childYearLevel)
                      ? ` • ${primaryChild?.grade ?? parentProfile?.childYearLevel}`
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
                    {mergedStudentSessions.length === 0 ? (
                      <p className="muted">No sessions yet. Book a tutor to get started.</p>
                    ) : null}
                    {mergedStudentSessions.map((s) => {
                      const tutor = tutorDirectory.find((t) => t.id === s.tutorId)
                      const menuItems = makeSessionMenuItems(s)
                      return (
                        <div
                          key={s.id}
                          className="card"
                          style={{ background: 'var(--surface-soft)' }}
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
                                    {Icons.Calendar({ size: 14 })} {prettyWhen(s.when)}
                                  </span>{' '}
                                  • {s.durationMins} min • {s.mode}
                                  {tutor ? ` • Tutor: ${tutor.name}` : s.tutorName ? ` • Tutor: ${s.tutorName}` : ''}
                                </p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <StatusPill text={s.status} tone={unifiedTone(s)} />
                                <OverflowMenu items={menuItems} />
                              </div>
                            </div>
                            <div className="btn-row" style={{ marginTop: 10 }}>
                              <button
                                className="btn"
                                onClick={() =>
                                  openMessageForTutor({
                                    id: s.tutorId,
                                    name: tutor?.name ?? s.tutorName ?? 'Tutor',
                                  })
                                }
                              >
                                {Icons.Message({ size: 16 })}
                                Message
                              </button>
                              <button
                                className="btn"
                                onClick={() =>
                                  openNotesForTutor({
                                    id: s.tutorId,
                                    name: tutor?.name ?? s.tutorName,
                                  })
                                }
                              >
                                {Icons.CheckBook({ size: 16 })}
                                Notes
                              </button>
                              {s.status === 'Upcoming' ? (
                                <button
                                  className="btn btn-primary btn-student"
                                  onClick={() => startSessionAction(s.title)}
                                >
                                  {Icons.Send({ size: 16 })}
                                  Join
                                </button>
                              ) : null}
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
                filteredTutors={filteredTutors}
                tutorDirectory={tutorDirectory}
                existingTutorIds={studentExistingTutorIds}
                onBook={openBookingModal}
                onViewProfile={openTutorProfile}
                onMessage={openMessageForTutor}
                loading={tutorsLoading}
                error={tutorsError}
              />
            ) : section === 'student.profile' ? (
              <ProfileSection session={session} />
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
                            <button
                              className="btn"
                              onClick={() => toast.info(`Opened task: ${t.title}`)}
                            >
                              {Icons.CheckBook({ size: 16 })}
                              Open
                            </button>
                            <button
                              className="btn"
                              onClick={() => toast.success(`Marked as done: ${t.title}`)}
                            >
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
                      right={
                        <button className="btn" onClick={() => setSection('student.sessions')}>
                          {Icons.Dashboard({ size: 16 })} Open
                        </button>
                      }
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
                        {primaryChild?.name ?? parentProfile?.childName ?? parentChild.name}
                      </span>
                    }
                  />
                  <div className="grid" style={{ gap: 10, marginTop: 12 }}>
                    {mergedParentSessions.length === 0 ? (
                      <p className="muted">No sessions yet. Book a tutor to schedule one.</p>
                    ) : null}
                    {mergedParentSessions.map((s) => {
                      const tutor = tutorDirectory.find((t) => t.id === s.tutorId)
                      const menuItems = makeSessionMenuItems(s)
                      return (
                        <div
                          key={s.id}
                          className="card"
                          style={{ background: 'var(--surface-soft)' }}
                        >
                          <div className="card-inner">
                            <div className="card-header">
                              <div>
                                <h3 style={{ fontSize: 16 }}>{s.title}</h3>
                                <p className="muted" style={{ marginTop: 6 }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    {Icons.Calendar({ size: 14 })} {prettyWhen(s.when)}
                                  </span>{' '}
                                  • {s.durationMins} min • {s.mode}
                                  {tutor ? ` • Tutor: ${tutor.name}` : s.tutorName ? ` • Tutor: ${s.tutorName}` : ''}
                                </p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <StatusPill text={s.status} tone={unifiedTone(s)} />
                                <OverflowMenu items={menuItems} />
                              </div>
                            </div>
                            <div className="btn-row" style={{ marginTop: 10 }}>
                              <button
                                className="btn"
                                onClick={() =>
                                  openMessageForTutor({
                                    id: s.tutorId,
                                    name: tutor?.name ?? s.tutorName ?? 'Tutor',
                                  })
                                }
                              >
                                {Icons.Message({ size: 16 })}
                                Message tutor
                              </button>
                              <button
                                className="btn"
                                onClick={() =>
                                  openNotesForTutor({
                                    id: s.tutorId,
                                    name: tutor?.name ?? s.tutorName,
                                  })
                                }
                              >
                                {Icons.CheckBook({ size: 16 })}
                                Notes
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
                      const t = tutorDirectory.find((x) => x.id === rel.tutorId)
                      if (!t) return null
                      return (
                        <div
                          key={rel.tutorId}
                          className="card"
                          style={{ background: 'var(--surface-soft)' }}
                        >
                          <div className="card-inner">
                            <div className="card-header">
                              <div>
                                <h3 style={{ fontSize: 16 }}>{t.name}</h3>
                                <p className="muted" style={{ marginTop: 6 }}>
                                  {rel.relationship} • Since {rel.since}
                                </p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="pill">
                                  {Icons.Star({ size: 14 })} {t.rating.toFixed(1)}
                                </span>
                                <OverflowMenu
                                  items={tutorListCardMenu(
                                    t,
                                    openBookingModal,
                                    openTutorProfile,
                                    openMessageForTutor
                                  )}
                                />
                              </div>
                            </div>
                            <SubjectChips
                              level={t.level}
                              subjects={t.subjects}
                              maxVisible={2}
                              leadingChips={[t.mode]}
                            />
                            <div style={{ marginTop: 10 }}>
                              <AvailabilityGrid
                                availability={createAvailability(t.availability)}
                                compact
                                title="When they’re open"
                              />
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
                            <button
                              className="btn"
                              onClick={() => toast.info(`Viewing task: ${t.title}`)}
                            >
                              {Icons.CheckBook({ size: 16 })}
                              View
                            </button>
                            <button
                              className="btn"
                              onClick={() => navigate('/app/messages')}
                            >
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
              <ProfileSection session={session} />
            ) : section === 'parent.find' ? (
              <BrowseTutorsDiscover
                title="Find a tutor"
                subtitle="Search by subject, location, or tutor name. Tutors already working with your child are shown under Tutors."
                query={query}
                setQuery={setQuery}
                level={level}
                setLevel={setLevel}
                filteredTutors={filteredTutors.filter(
                  (t) => !parentExistingTutorIds.has(t.id)
                )}
                existingTutorIds={new Set()}
                onBook={openBookingModal}
                onViewProfile={openTutorProfile}
                onMessage={openMessageForTutor}
                loading={tutorsLoading}
                error={tutorsError}
              />
            ) : (
              <section className="card">
                <div className="card-inner">
                  <SectionTitle
                    title="Overview"
                    subtitle="Sessions, tutors, and to‑dos at a glance."
                    right={
                      <span className="pill">
                        {primaryChild?.name ?? parentProfile?.childName ?? parentChild.name}
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
                            <button
                              className="btn"
                              onClick={() =>
                                navigate(`/app/messages?request=${encodeURIComponent(o.requestId)}`)
                              }
                            >
                              {Icons.Message({ size: 16 })}
                              Message
                            </button>
                            <button
                              className="btn"
                              onClick={() =>
                                toast.info(`Offer details: ${o.subject} • ${o.toStudentName}`)
                              }
                            >
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
                            <button
                              className="btn"
                              onClick={() => navigate('/app/messages')}
                            >
                              {Icons.Message({ size: 16 })}
                              Message
                            </button>
                            <button
                              className="btn"
                              onClick={() => setSection('tutor.sessions')}
                            >
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
              <section className="grid" style={{ gap: 14 }}>
                {allPendingRequests.length > 0 ? (
                  <div className="card">
                    <div className="card-inner">
                      <SectionTitle
                        title="Reschedule requests"
                        subtitle="Learners proposing new times for their sessions."
                        right={
                          <span className="pill">
                            {allPendingRequests.filter((r) => r.status === 'Pending').length} pending
                          </span>
                        }
                      />
                      <div className="grid" style={{ gap: 10, marginTop: 12 }}>
                        {allPendingRequests.map((r) => (
                          <div
                            key={r.id}
                            className="card"
                            style={{ background: 'var(--surface-soft)' }}
                          >
                            <div className="card-inner">
                              <div className="card-header">
                                <div>
                                  <h3 style={{ fontSize: 16 }}>
                                    From {r.requesterName}
                                  </h3>
                                  <p className="muted" style={{ marginTop: 6 }}>
                                    Original: {prettyWhen(r.originalWhen)} →
                                    Proposed: {prettyWhen(r.requestedWhen)}
                                  </p>
                                  {r.note ? (
                                    <p className="subtle" style={{ marginTop: 6 }}>
                                      “{r.note}”
                                    </p>
                                  ) : null}
                                  {r.status === 'Counter proposed' && r.counterWhen ? (
                                    <p className="muted" style={{ marginTop: 6 }}>
                                      You proposed: {prettyWhen(r.counterWhen)}
                                    </p>
                                  ) : null}
                                </div>
                                <StatusPill
                                  text={r.status}
                                  tone={
                                    r.status === 'Accepted'
                                      ? 'good'
                                      : r.status === 'Declined'
                                        ? 'warn'
                                        : 'neutral'
                                  }
                                />
                              </div>
                              {r.status === 'Pending' ? (
                                <div className="btn-row" style={{ marginTop: 10 }}>
                                  <button
                                    className="btn btn-primary btn-tutor"
                                    onClick={() => tutorDecision(r, 'Accepted')}
                                  >
                                    {Icons.CheckCircle({ size: 16 })}
                                    Accept
                                  </button>
                                  <button
                                    className="btn"
                                    onClick={() => tutorDecision(r, 'Declined')}
                                  >
                                    {Icons.Close({ size: 16 })}
                                    Decline
                                  </button>
                                  <button
                                    className="btn"
                                    onClick={() => {
                                      setCounterRequestId(r.id)
                                      setCounterWhen('')
                                    }}
                                  >
                                    {Icons.Calendar({ size: 16 })}
                                    Counter propose
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="card">
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
                            style={{ background: 'var(--surface-soft)' }}
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
                                <button
                                  className="btn"
                                  onClick={() => navigate('/app/messages')}
                                >
                                  {Icons.Message({ size: 16 })}
                                  Message
                                </button>
                                <button
                                  className="btn btn-primary btn-tutor"
                                  onClick={() => startSessionAction(s.subject)}
                                >
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
                </div>
              </section>
            ) : section === 'tutor.profile' ? (
              <section className="grid" style={{ gap: 14 }}>
                <ProfileSection session={session} />
                <div className="card">
                  <div className="card-inner">
                    <SectionTitle
                      title="Weekly availability"
                      subtitle="Tap slots to mark when you’re open for sessions."
                      right={
                        <span
                          className="pill"
                          title={
                            availabilityDirty
                              ? 'You have unsaved changes'
                              : 'All changes saved'
                          }
                        >
                          {availabilityDirty ? 'Unsaved changes' : 'Saved'}
                        </span>
                      }
                    />
                    <div style={{ marginTop: 12 }}>
                      <AvailabilityGrid
                        availability={availability}
                        editable
                        onToggle={handleToggleAvailability}
                        title="Your availability"
                      />
                    </div>
                    <div className="btn-row" style={{ marginTop: 12 }}>
                      <button
                        className="btn btn-primary btn-tutor"
                        onClick={saveAvailability}
                        disabled={!availabilityDirty}
                      >
                        {Icons.CheckCircle({ size: 16 })}
                        Save changes
                      </button>
                      <button
                        className="btn"
                        onClick={discardAvailability}
                        disabled={!availabilityDirty}
                      >
                        {Icons.Close({ size: 16 })}
                        Discard
                      </button>
                    </div>
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

      <Modal
        open={!!profileTutor}
        title={profileTutor ? `Tutor profile — ${profileTutor.name}` : 'Tutor profile'}
        onClose={() => setProfileTutor(null)}
        footer={
          profileTutor ? (
            <>
              <button className="btn" onClick={() => setProfileTutor(null)}>
                Close
              </button>
              <button
                className={`btn btn-primary ${
                  session.role === 'parent' ? 'btn-parent' : 'btn-student'
                }`}
                onClick={() => openMessageForTutor(profileTutor)}
              >
                {Icons.Message({ size: 16 })}
                Message tutor
              </button>
            </>
          ) : null
        }
      >
        {profileTutor ? (
          <div className="grid" style={{ gap: 12 }}>
            <div className="card" style={{ background: 'rgba(255,255,255,0.62)' }}>
              <div className="card-inner">
                <div className="card-header">
                  <div>
                    <h3 style={{ fontSize: 18 }}>{profileTutor.name}</h3>
                    <p className="muted" style={{ marginTop: 6 }}>
                      {profileTutor.city ?? 'Location not provided'}
                      {profileTutor.level ? ` • ${profileTutor.level}` : ''}
                      {profileTutor.yearsExperience
                        ? ` • ${profileTutor.yearsExperience} years experience`
                        : ''}
                    </p>
                  </div>
                  {profileTutor.rating ? (
                    <span className="pill">
                      {Icons.Star({ size: 14 })} {profileTutor.rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <SubjectChips
                  level={profileTutor.level}
                  subjects={profileTutor.subjects}
                  maxVisible={6}
                />
                {profileTutor.shortBio ? (
                  <p className="subtle" style={{ marginTop: 10 }}>
                    {profileTutor.shortBio}
                  </p>
                ) : null}
              </div>
            </div>

            {(session.role === 'student' || session.role === 'parent') && (
              <div className="card" style={{ background: 'rgba(255,255,255,0.62)' }}>
                <div className="card-inner">
                  <div className="label">Credentials</div>
                  {profileTutor.credentials?.length ? (
                    <div className="credential-grid" style={{ marginTop: 10 }}>
                      {profileTutor.credentials.map((cred) => (
                        <CredentialPreviewCard key={cred.id} cred={cred} />
                      ))}
                    </div>
                  ) : (
                    <p className="muted" style={{ marginTop: 8 }}>
                      No uploaded credentials available for this tutor yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!bookingTutor}
        title={bookingTutor ? `Book a session with ${bookingTutor.name}` : 'Book a session'}
        onClose={closeBookingModal}
        footer={
          bookingTutor ? (
            <>
              <button className="btn" onClick={closeBookingModal}>
                Cancel
              </button>
              <button
                className={`btn btn-primary ${
                  session.role === 'tutor'
                    ? 'btn-tutor'
                    : session.role === 'parent'
                      ? 'btn-parent'
                      : 'btn-student'
                }`}
                onClick={confirmBooking}
              >
                {Icons.Calendar({ size: 16 })}
                Confirm booking
              </button>
            </>
          ) : null
        }
      >
        {bookingTutor ? (
          <div className="grid" style={{ gap: 12 }}>
            <p className="muted">
              {bookingTutor.mode} • ₱{bookingTutor.hourlyRate}/hr •{' '}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {Icons.Star({ size: 14 })} {bookingTutor.rating.toFixed(1)}
              </span>
            </p>
            <div className="field">
              <label className="label" htmlFor="booking-when">When</label>
              <input
                id="booking-when"
                type="datetime-local"
                className="input"
                value={bookingWhen}
                onChange={(e) => setBookingWhen(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="booking-subject">Subject</label>
              <select
                id="booking-subject"
                className="input"
                value={bookingSubject}
                onChange={(e) => setBookingSubject(e.target.value)}
              >
                {bookingTutor.subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="booking-duration">Duration (min)</label>
              <input
                id="booking-duration"
                type="number"
                min={15}
                step={15}
                className="input"
                value={bookingDuration}
                onChange={(e) => setBookingDuration(e.target.value)}
              />
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!rescheduleTarget}
        title={
          rescheduleTarget
            ? `Request reschedule — ${rescheduleTarget.title}`
            : 'Request reschedule'
        }
        onClose={closeReschedule}
        footer={
          rescheduleTarget ? (
            <>
              <button className="btn" onClick={closeReschedule}>
                Cancel
              </button>
              <button
                className={`btn btn-primary ${
                  session.role === 'parent' ? 'btn-parent' : 'btn-student'
                }`}
                onClick={confirmReschedule}
              >
                {Icons.Send({ size: 16 })}
                Send request
              </button>
            </>
          ) : null
        }
      >
        {rescheduleTarget ? (
          <div className="grid" style={{ gap: 12 }}>
            <p className="muted">
              Current: {prettyWhen(rescheduleTarget.when)} •{' '}
              {rescheduleTarget.durationMins} min • {rescheduleTarget.mode}
            </p>
            <div className="field">
              <label className="label" htmlFor="reschedule-when">Propose a new time</label>
              <input
                id="reschedule-when"
                type="datetime-local"
                className="input"
                value={rescheduleWhen}
                onChange={(e) => setRescheduleWhen(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="reschedule-note">Note to tutor (optional)</label>
              <textarea
                id="reschedule-note"
                rows={3}
                className="input"
                value={rescheduleNote}
                onChange={(e) => setRescheduleNote(e.target.value)}
                placeholder="Let your tutor know why you need a different time."
                style={{ resize: 'vertical' }}
              />
            </div>
            <p className="subtle">
              Your tutor can accept, decline, or counter-propose. The session
              will be marked <strong>Pending tutor approval</strong> until then.
            </p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!cancelTarget}
        title="Cancel this session?"
        onClose={() => setCancelTarget(null)}
        footer={
          cancelTarget ? (
            <>
              <button className="btn" onClick={() => setCancelTarget(null)}>
                Keep session
              </button>
              <button className="btn btn-danger" onClick={confirmCancel}>
                {Icons.Close({ size: 16 })}
                Cancel session
              </button>
            </>
          ) : null
        }
      >
        {cancelTarget ? (
          <div className="grid" style={{ gap: 8 }}>
            <p className="subtle">
              <strong>{cancelTarget.title}</strong>
            </p>
            <p className="muted">
              {prettyWhen(cancelTarget.when)} • {cancelTarget.durationMins} min •{' '}
              {cancelTarget.mode}
            </p>
            <p>This will notify the tutor. You can always book again later.</p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!counterRequestId}
        title="Counter-propose a time"
        onClose={() => setCounterRequestId(null)}
        footer={
          <>
            <button className="btn" onClick={() => setCounterRequestId(null)}>
              Cancel
            </button>
            <button className="btn btn-primary btn-tutor" onClick={submitCounter}>
              {Icons.Send({ size: 16 })}
              Send counter
            </button>
          </>
        }
      >
        <div className="grid" style={{ gap: 12 }}>
          <div className="field">
            <label className="label" htmlFor="counter-when">Your proposed time</label>
            <input
              id="counter-when"
              type="datetime-local"
              className="input"
              value={counterWhen}
              onChange={(e) => setCounterWhen(e.target.value)}
            />
          </div>
          <p className="subtle">
            The learner will see your counter-proposal and can accept it from
            their side.
          </p>
        </div>
      </Modal>

      {reviewTarget ? (
        <ReviewModal
          open={!!reviewTarget}
          tutorId={reviewTarget.tutorId}
          tutorName={reviewTarget.tutorName}
          authorName={session.displayName}
          authorEmail={session.email}
          onClose={() => setReviewTarget(null)}
        />
      ) : null}
    </main>
  )
}

