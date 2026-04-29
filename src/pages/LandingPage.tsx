import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserGraduate,
  faUsers,
  faBookOpenReader,
  faHandshake,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { RolePill } from '../components/RolePill'
import type { Role } from '../state/session'
import { setPreferredRole } from '../state/session'
import { Icons } from '../components/icons'
import { useDocumentTitle } from '../components/Toast'
import { BRAINLINK_LOGO_SRC } from '../branding'

const HERO_ICONS: { icon: IconDefinition; label: string }[] = [
  { icon: faUserGraduate, label: 'Students' },
  { icon: faUsers, label: 'Parents and Families' },
  { icon: faBookOpenReader, label: 'Tutors' },
  { icon: faHandshake, label: 'Trusted Match' },
] as const

const WHAT_WE_DO_FEATURES = [
  {
    icon: Icons.Search,
    title: 'Smarter tutor matching',
    body: 'Cut through noise with filters that match subject, level, and schedule—so families land tutors who actually fit, faster.',
    accent: 'student' as const,
  },
  {
    icon: Icons.Calendar,
    title: 'Stress-free scheduling',
    body: 'Book and see upcoming sessions in one place. Fewer mix-ups, fewer “which time again?” moments for everyone.',
    accent: 'parent' as const,
  },
  {
    icon: Icons.Dashboard,
    title: 'Progress you can see',
    body: 'Follow growth over time with lightweight tracking—so students stay motivated and parents stay reassured.',
    accent: 'tutor' as const,
  },
  {
    icon: Icons.Message,
    title: 'Clear communication',
    body: 'Keep messages and updates alongside sessions—not lost in random group chats or inboxes.',
    accent: 'student' as const,
  },
  {
    icon: Icons.Users,
    title: 'Built for each role',
    body: 'Students, parents, and tutors each get a view that matches how they work—without clutter they don’t need.',
    accent: 'parent' as const,
  },
  {
    icon: Icons.Shield,
    title: 'Organized and secure',
    body: 'A calmer, structured hub for your learning life—privacy-minded and easy to navigate.',
    accent: 'tutor' as const,
  },
]

function roleCopy(role: Role) {
  switch (role) {
    case 'student':
      return {
        title: 'Learn effectively in one place',
        body: 'Find the right tutor, track sessions, and keep your learning organized.',
        soft: 'var(--student-soft)',
        strong: 'var(--student-strong)',
        ctaClass: 'btn-primary btn-student',
      }
    case 'parent':
      return {
        title: 'Find trusted tutors fast',
        body: 'Match with tutors by subject, schedule, and learning needs—without the stress.',
        soft: 'var(--parent-soft)',
        strong: 'var(--parent-strong)',
        ctaClass: 'btn-primary btn-parent',
      }
    case 'tutor':
      return {
        title: 'Find clients that fit your expertise',
        body: 'Showcase subjects and levels, then connect with families looking for you.',
        soft: 'var(--tutor-soft)',
        strong: 'var(--tutor-strong)',
        ctaClass: 'btn-primary btn-tutor',
      }
  }
}

function RoleCard({ role }: { role: Role }) {
  const nav = useNavigate()
  const meta = roleCopy(role)
  const Icon =
    role === 'student' ? Icons.Cap : role === 'parent' ? Icons.Shield : Icons.Handshake

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div
        style={{
          height: 8,
          background: `linear-gradient(90deg, ${meta.soft}, ${meta.strong})`,
        }}
        aria-hidden="true"
      />
      <div
        className="card-inner"
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <div className="card-header">
          <div>
            <RolePill role={role} />
            <h2 style={{ marginTop: 10 }}>{meta.title}</h2>
          </div>
          <span className="pill" style={{ borderColor: 'transparent', background: meta.soft }}>
            {Icon({ size: 16 })}
            Experience
          </span>
        </div>

        <p className="subtle" style={{ marginTop: 8 }}>
          {meta.body}
        </p>

        <div className="btn-row" style={{ marginTop: 'auto', paddingTop: 14 }}>
          <button
            className={`btn ${meta.ctaClass}`}
            onClick={() => {
              setPreferredRole(role)
              nav('/sign-up')
            }}
          >
            Get started
          </button>
          <button
            className="btn"
            onClick={() => {
              setPreferredRole(role)
              nav('/sign-in')
            }}
          >
            I already have an account
          </button>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  useDocumentTitle('BrainLink — Tutors, students, and parents together')
  const nav = useNavigate()

  const goCreateAccount = () => nav('/sign-up')

  return (
    <main className="landing landing-v2">
      <div className="landing-hero-band">
        <div className="landing-hero-band-inner">
          <nav className="landing-nav" aria-label="Primary">
            <Link to="/" className="landing-nav-logo">
              <img src={BRAINLINK_LOGO_SRC} alt="BrainLink" />
            </Link>

            <div className="landing-nav-right">
              <a className="landing-nav-link" href="#what-we-do">
                What we do
              </a>
              <Link className="landing-nav-signin" to="/sign-in">
                Sign in
              </Link>
              <button type="button" className="btn btn-work-with-us" onClick={goCreateAccount}>
                Get started
              </button>
            </div>
          </nav>

          <div className="landing-hero-split">
            <div className="landing-hero-copy">
              <p className="landing-hero-kicker">Students • Parents • Tutors</p>
              <h1 className="landing-hero-title">
                Where learning meets the right connection.
              </h1>
              <p className="landing-hero-lead">
                BrainLink brings students, parents, and tutors together in one smart platform to
                schedule sessions, stay organized, and achieve consistent progress.
              </p>
              <div className="landing-hero-actions">
                <button type="button" className="btn btn-work-with-us btn-work-with-us-lg" onClick={goCreateAccount}>
                  Get started
                </button>
              </div>
            </div>

            <div className="landing-hero-visual">
              <div className="landing-hero-icon-cluster" aria-hidden="true">
                <div className="landing-hero-icon-cluster-bg" />
                <div className="landing-3d-icons-grid">
                  {HERO_ICONS.map((item, i) => (
                    <div
                      key={item.label}
                      className={`landing-3d-icon-card landing-3d-icon-card--${i % 4}`}
                    >
                      <span className="landing-3d-icon-fa" aria-hidden="true">
                        <FontAwesomeIcon icon={item.icon} className="landing-3d-icon-svg" />
                      </span>
                      <span className="landing-3d-icon-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="landing-trust-bar">
            <div className="landing-trust-item">
              <div className="landing-trust-stat">3</div>
              <div className="landing-trust-label">Roles in one platform</div>
            </div>
            <div className="landing-trust-divider" aria-hidden="true" />
            <div className="landing-trust-item">
              <div className="landing-trust-stat">1:1</div>
              <div className="landing-trust-label">Focused tutoring sessions</div>
            </div>
            <div className="landing-trust-divider" aria-hidden="true" />
            <div className="landing-trust-item">
              <div className="landing-trust-stat">24/7</div>
              <div className="landing-trust-label">Access to your learning hub</div>
            </div>
            <div className="landing-trust-divider" aria-hidden="true" />
            <div className="landing-trust-item">
              <div className="landing-trust-stat">100%</div>
              <div className="landing-trust-label">All your learning, in one place</div>
            </div>
          </div>
        </div>
      </div>

      <div className="landing-below">
        <section id="choose-role" className="grid grid-3">
          <RoleCard role="student" />
          <RoleCard role="parent" />
          <RoleCard role="tutor" />
        </section>

        <section id="what-we-do" className="card landing-what-we-do">
          <div className="card-inner">
            <header className="landing-what-header">
              <div className="label">What we do</div>
              <h2 className="landing-what-heading">Seamless learning, all in one place</h2>
              <p className="landing-what-lead">
                BrainLink turns scattered tutoring logistics into one friendly workflow. Here’s what you
                gain at a glance.
              </p>
            </header>

            <div className="landing-what-grid">
              {WHAT_WE_DO_FEATURES.map((f) => (
                <article
                  key={f.title}
                  className={`landing-what-feature landing-what-feature--${f.accent}`}
                >
                  <div className="landing-what-feature-icon-wrap" aria-hidden="true">
                    {f.icon({ size: 36, className: 'landing-what-feature-icon' })}
                  </div>
                  <h3 className="landing-what-feature-title">{f.title}</h3>
                  <p className="landing-what-feature-desc">{f.body}</p>
                </article>
              ))}
            </div>

          </div>
        </section>
      </div>
    </main>
  )
}
