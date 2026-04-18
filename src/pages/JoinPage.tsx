import { Link } from 'react-router-dom'
import { Icons } from '../components/icons'

export function JoinPage() {
  return (
    <main className="join-hub">
      <div className="card" style={{ maxWidth: 520, width: '100%', margin: '0 auto' }}>
        <div
          style={{
            height: 8,
            background: 'linear-gradient(90deg, var(--student-soft), var(--tutor-strong))',
          }}
          aria-hidden="true"
        />
        <div className="card-inner">
          <div className="label">Join BrainLink</div>
          <h1 style={{ marginTop: 8, fontSize: 26 }}>Welcome back—or create an account</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Choose how you want to continue. You can update your path anytime from your dashboard.
          </p>

          <div className="btn-row" style={{ marginTop: 18, flexDirection: 'column', alignItems: 'stretch' }}>
            <Link className="btn btn-primary btn-student" to="/sign-up">
              {Icons.UserPlus({ size: 18 })}
              Create account
            </Link>
            <Link className="btn btn-elevated" to="/sign-in">
              {Icons.LogIn({ size: 18 })}
              Sign in
            </Link>
          </div>

          <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
            <Link to="/" style={{ fontWeight: 750, color: 'var(--text-header)' }}>
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
