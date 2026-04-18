import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearSession, getSession } from '../state/session'
import { RolePill } from './RolePill'
import { Icons } from './icons'

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const session = getSession()

  const showBack =
    location.pathname === '/sign-in' ||
    location.pathname === '/sign-up' ||
    location.pathname === '/join'
  const inApp = location.pathname.startsWith('/app')
  const landingHome = location.pathname === '/' && !session

  return (
    <div className={`app-shell${landingHome ? ' app-shell--landing-home' : ''}`}>
      {!landingHome ? (
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true" />
          <div>
            <div className="brand-name">BrainLink</div>
            <div className="muted">Students · Parents · Tutors</div>
          </div>
        </div>

        <div className="btn-row">
          {showBack ? (
            <button className="btn" onClick={() => navigate('/')}>
              {Icons.ArrowLeft({ size: 16 })}
              Back
            </button>
          ) : null}

          {location.pathname === '/' && !session ? (
            <>
              <Link className="btn btn-primary btn-student" to="/sign-up">
                {Icons.UserPlus({ size: 16 })}
                Create account
              </Link>
              <Link className="btn btn-elevated" to="/sign-in">
                {Icons.LogIn({ size: 16 })}
                Sign in
              </Link>
            </>
          ) : null}

          {session ? (
            <>
              {!inApp ? (
                <Link className="btn" to="/app">
                  {Icons.Dashboard({ size: 16 })}
                  Dashboard
                </Link>
              ) : null}
              <button
                className="btn"
                onClick={() => {
                  clearSession()
                  navigate('/', { replace: true })
                }}
              >
                {Icons.LogOut({ size: 16 })}
                Sign out
              </button>
            </>
          ) : null}

          {null}
        </div>
      </header>
      ) : null}

      {session ? (
        <div style={{ marginBottom: 14 }} className="btn-row">
          <span className="pill">
            Signed in as <b style={{ color: 'var(--text-header)' }}>{session.displayName}</b>
          </span>
          <RolePill role={session.role} />
        </div>
      ) : null}

      {children}

      <footer className="muted" style={{ marginTop: 18 }}>
        BrainLink — connect learning with the right support.
      </footer>
    </div>
  )
}

