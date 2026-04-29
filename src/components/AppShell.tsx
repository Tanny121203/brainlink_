import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getSession, signOutFromServer } from '../state/session'
import { Icons } from './icons'
import { toast } from './Toast'
import { NotificationsBell } from './NotificationsBell'
import { BRAINLINK_LOGO_SRC } from '../branding'

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const session = getSession()

  const showBack =
    location.pathname === '/sign-in' ||
    location.pathname === '/sign-up' ||
    location.pathname === '/join'
  const inApp = location.pathname.startsWith('/app')
  const landingHome = location.pathname === '/'

  return (
    <div className={`app-shell${landingHome ? ' app-shell--landing-home' : ''}`}>
      {!landingHome ? (
        <div className="app-layout-column">
          <header className="topbar">
            <div className="brand">
              <Link to="/" className="brand-logo-wrap">
                <img src={BRAINLINK_LOGO_SRC} alt="BrainLink" className="brand-logo-img" />
              </Link>
            </div>

            <div className="btn-row">
              {showBack ? (
                <button className="btn" onClick={() => navigate('/')}>
                  {Icons.ArrowLeft({ size: 16 })}
                  Back
                </button>
              ) : null}

              {!showBack && location.pathname === '/' && !session ? (
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

              {!showBack && session ? (
                <>
                  <NotificationsBell role={session.role} />
                  {!inApp ? (
                    <Link className="btn" to="/app">
                      {Icons.Dashboard({ size: 16 })}
                      Dashboard
                    </Link>
                  ) : null}
                  <button
                    className="btn"
                    onClick={async () => {
                      await signOutFromServer()
                      toast.info('Signed out. See you soon!')
                      navigate('/', { replace: true })
                    }}
                  >
                    {Icons.LogOut({ size: 16 })}
                    Sign out
                  </button>
                </>
              ) : null}
            </div>
          </header>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

