import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RolePill } from '../components/RolePill'
import { Icons } from '../components/icons'
import type { Role } from '../state/session'
import { getPreferredRole, setPreferredRole, setSession } from '../state/session'

function roleAccent(role: Role) {
  switch (role) {
    case 'student':
      return { soft: 'var(--student-soft)', btn: 'btn-primary btn-student' }
    case 'parent':
      return { soft: 'var(--parent-soft)', btn: 'btn-primary btn-parent' }
    case 'tutor':
      return { soft: 'var(--tutor-soft)', btn: 'btn-primary btn-tutor' }
  }
}

export function SignInPage() {
  const nav = useNavigate()
  const initialRole = getPreferredRole() ?? 'student'
  const [role, setRole] = useState<Role>(initialRole)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const accent = useMemo(() => roleAccent(role), [role])
  const roleIcon =
    role === 'student' ? Icons.Cap : role === 'parent' ? Icons.Shield : Icons.Handshake

  return (
    <main className="grid form-wrap" style={{ gap: 16 }}>
      <div className="card">
        <div className="card-inner">
          <div className="card-header">
            <div>
              <RolePill role={role} />
              <h2 style={{ marginTop: 10 }}>Sign in</h2>
              <p className="subtle" style={{ marginTop: 6 }}>
                Choose a role, then enter your credentials.
              </p>
            </div>
            <span
              className="pill"
              style={{ borderColor: 'transparent', background: accent.soft }}
            >
              {roleIcon({ size: 16 })}
              Role
            </span>
          </div>

          <div className="segmented" style={{ marginTop: 10 }}>
            {([
              { r: 'student' as const, label: 'Student', icon: Icons.Cap },
              { r: 'parent' as const, label: 'Parent', icon: Icons.Shield },
              { r: 'tutor' as const, label: 'Tutor', icon: Icons.Handshake },
            ] as const).map(({ r, label, icon }) => (
              <button
                key={r}
                className={`btn role-btn ${role === r ? 'is-active' : ''}`}
                data-role={r}
                onClick={() => {
                  setRole(r)
                  setPreferredRole(r)
                }}
              >
                {icon({ size: 18 })}
                {label}
              </button>
            ))}
          </div>

          <div className="divider" />

          <div className="grid grid-2" style={{ marginTop: 2 }}>
            <div className="field">
              <div className="label">Email</div>
              <div className="input-group">
                <span className="input-icon">{Icons.Mail({ size: 16 })}</span>
                <input
                  className="input with-icon"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="field">
              <div className="label">Password</div>
              <div className="input-group">
                <span className="input-icon">{Icons.Key({ size: 16 })}</span>
                <input
                  className="input with-icon"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                />
              </div>
            </div>
          </div>

          <div className="btn-row" style={{ marginTop: 14 }}>
            <button
              className={`btn ${accent.btn}`}
              onClick={() => {
                setSession({
                  role,
                  displayName: email.trim() ? email.split('@')[0] : 'Guest',
                  email: email.trim() || 'guest@brainlink.local',
                })
                nav('/app')
              }}
            >
              {Icons.LogIn({ size: 16 })}
              Continue
            </button>
            <Link className="btn" to="/sign-up">
              {Icons.UserPlus({ size: 16 })}
              Create a new account
            </Link>
          </div>

          <div className="muted" style={{ marginTop: 12 }}>
            Use any email and password to continue.
          </div>
        </div>
      </div>

    </main>
  )
}

