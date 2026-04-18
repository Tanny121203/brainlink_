import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RolePill } from '../components/RolePill'
import { Icons } from '../components/icons'
import type { Role } from '../state/session'
import {
  getPreferredRole,
  setPreferredRole,
  setSession,
  type ParentProfile,
  type StudentProfile,
  type TutorProfile,
} from '../state/session'

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

export function SignUpPage() {
  const nav = useNavigate()
  const initialRole = getPreferredRole() ?? 'student'
  const [role, setRole] = useState<Role>(initialRole)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')

  // Student fields
  const [studentYearLevel, setStudentYearLevel] = useState('Grade 8')
  const [studentSchoolName, setStudentSchoolName] = useState('')
  const [studentSubjects, setStudentSubjects] = useState('Math, English')
  const [studentGoal, setStudentGoal] = useState('Better grades + confidence')

  // Parent fields
  const [childName, setChildName] = useState('')
  const [childYearLevel, setChildYearLevel] = useState('Grade 8')
  const [parentMode, setParentMode] = useState<'Online' | 'In-person' | 'Hybrid'>(
    'Online'
  )
  const [parentCity, setParentCity] = useState('')

  // Tutor fields
  const [tutorSubjects, setTutorSubjects] = useState('Math, Science')
  const [tutorYears, setTutorYears] = useState('2')
  const [tutorMode, setTutorMode] = useState<'Online' | 'In-person' | 'Hybrid'>(
    'Online'
  )
  const [tutorCity, setTutorCity] = useState('')
  const [tutorBio, setTutorBio] = useState(
    'I focus on fundamentals first, then practice questions with feedback.'
  )

  const accent = useMemo(() => roleAccent(role), [role])
  const roleIcon =
    role === 'student' ? Icons.Cap : role === 'parent' ? Icons.Shield : Icons.Handshake

  const profile = useMemo((): SessionProfile | undefined => {
    if (role === 'student') {
      const p: StudentProfile = {
        yearLevel: studentYearLevel,
        schoolName: studentSchoolName.trim() || undefined,
        subjectsToImprove: studentSubjects.trim() || undefined,
        learningGoal: studentGoal.trim() || undefined,
      }
      return p
    }
    if (role === 'parent') {
      const p: ParentProfile = {
        childName: childName.trim() || 'My child',
        childYearLevel,
        preferredMode: parentMode,
        city: parentCity.trim() || undefined,
      }
      return p
    }
    const p: TutorProfile = {
      subjects: tutorSubjects.trim() || 'General tutoring',
      yearsExperience: tutorYears.trim() || '1',
      teachingMode: tutorMode,
      city: tutorCity.trim() || undefined,
      shortBio: tutorBio.trim() || undefined,
    }
    return p
  }, [
    role,
    studentYearLevel,
    studentSchoolName,
    studentSubjects,
    studentGoal,
    childName,
    childYearLevel,
    parentMode,
    parentCity,
    tutorSubjects,
    tutorYears,
    tutorMode,
    tutorCity,
    tutorBio,
  ])

  return (
    <main className="grid form-wrap" style={{ gap: 16 }}>
      <div className="card">
        <div className="card-inner">
          <div className="card-header">
            <div>
              <RolePill role={role} />
              <h2 style={{ marginTop: 10 }}>Create account</h2>
              <p className="subtle" style={{ marginTop: 6 }}>
                Choose a role, then fill in the details.
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
              <div className="label">Name</div>
              <div className="input-group">
                <span className="input-icon">{Icons.User({ size: 16 })}</span>
                <input
                  className="input with-icon"
                  placeholder="e.g., Maria"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>
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
          </div>

          <div className="divider" />

            {role === 'student' ? (
              <div className="grid" style={{ gap: 12 }}>
              <div className="section-title">
                <div>
                  <h3 style={{ fontSize: 18 }}>Student details</h3>
                  <p className="subtle" style={{ marginTop: 6 }}>
                    Helps us match you with the right tutor.
                  </p>
                </div>
                <span className="pill" style={{ borderColor: 'transparent', background: 'var(--student-soft)' }}>
                  {Icons.Cap({ size: 16 })}
                  Student
                </span>
              </div>

              <div className="grid grid-2">
                <div className="field">
                  <div className="label">Year level</div>
                  <select
                    className="input"
                    value={studentYearLevel}
                    onChange={(e) => setStudentYearLevel(e.target.value)}
                  >
                    {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12','College'].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <div className="label">School (optional)</div>
                  <div className="input-group">
                    <span className="input-icon">{Icons.Building({ size: 16 })}</span>
                    <input
                      className="input with-icon"
                      placeholder="e.g., ABC High School"
                      value={studentSchoolName}
                      onChange={(e) => setStudentSchoolName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="field">
                <div className="label">Subjects to improve</div>
                <div className="input-group">
                  <span className="input-icon">{Icons.Book({ size: 16 })}</span>
                  <input
                    className="input with-icon"
                    placeholder="e.g., Math, English"
                    value={studentSubjects}
                    onChange={(e) => setStudentSubjects(e.target.value)}
                  />
                </div>
                <div className="muted">Tip: comma-separated is fine for now.</div>
              </div>

              <div className="field">
                <div className="label">Learning goal</div>
                <textarea
                  className="input"
                  rows={3}
                  value={studentGoal}
                  onChange={(e) => setStudentGoal(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
            ) : null}

            {role === 'parent' ? (
              <div className="grid" style={{ gap: 12 }}>
              <div className="section-title">
                <div>
                  <h3 style={{ fontSize: 18 }}>Child details</h3>
                  <p className="subtle" style={{ marginTop: 6 }}>
                    Required so tutors can understand the student’s level.
                  </p>
                </div>
                <span className="pill" style={{ borderColor: 'transparent', background: 'var(--parent-soft)' }}>
                  {Icons.Shield({ size: 16 })}
                  Parent
                </span>
              </div>

              <div className="grid grid-2">
                <div className="field">
                  <div className="label">Child’s name</div>
                  <div className="input-group">
                    <span className="input-icon">{Icons.User({ size: 16 })}</span>
                    <input
                      className="input with-icon"
                      placeholder="e.g., Joshua"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field">
                  <div className="label">Education level / year level</div>
                  <select
                    className="input"
                    value={childYearLevel}
                    onChange={(e) => setChildYearLevel(e.target.value)}
                  >
                    {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12','College'].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="field">
                  <div className="label">Preferred mode</div>
                  <select
                    className="input"
                    value={parentMode}
                    onChange={(e) => setParentMode(e.target.value as typeof parentMode)}
                  >
                    <option value="Online">Online</option>
                    <option value="In-person">In-person</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="field">
                  <div className="label">City (optional)</div>
                  <div className="input-group">
                    <span className="input-icon">{Icons.Pin({ size: 16 })}</span>
                    <input
                      className="input with-icon"
                      placeholder="e.g., Quezon City"
                      value={parentCity}
                      onChange={(e) => setParentCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              </div>
            ) : null}

            {role === 'tutor' ? (
              <div className="grid" style={{ gap: 12 }}>
              <div className="section-title">
                <div>
                  <h3 style={{ fontSize: 18 }}>Tutor profile</h3>
                  <p className="subtle" style={{ marginTop: 6 }}>
                    The essentials parents look for when choosing a tutor.
                  </p>
                </div>
                <span className="pill" style={{ borderColor: 'transparent', background: 'var(--tutor-soft)' }}>
                  {Icons.Handshake({ size: 16 })}
                  Tutor
                </span>
              </div>

              <div className="grid grid-2">
                <div className="field">
                  <div className="label">Expertise / subjects taught</div>
                  <div className="input-group">
                    <span className="input-icon">{Icons.Book({ size: 16 })}</span>
                    <input
                      className="input with-icon"
                      placeholder="e.g., Math, Algebra, Science"
                      value={tutorSubjects}
                      onChange={(e) => setTutorSubjects(e.target.value)}
                    />
                  </div>
                  <div className="muted">Tip: comma-separated is fine for now.</div>
                </div>
                <div className="field">
                  <div className="label">Years of experience</div>
                  <div className="input-group">
                    <span className="input-icon">{Icons.Clipboard({ size: 16 })}</span>
                    <input
                      className="input with-icon"
                      value={tutorYears}
                      onChange={(e) => setTutorYears(e.target.value)}
                      inputMode="numeric"
                      placeholder="e.g., 3"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="field">
                  <div className="label">Teaching mode</div>
                  <select
                    className="input"
                    value={tutorMode}
                    onChange={(e) => setTutorMode(e.target.value as typeof tutorMode)}
                  >
                    <option value="Online">Online</option>
                    <option value="In-person">In-person</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="field">
                  <div className="label">City (optional)</div>
                  <div className="input-group">
                    <span className="input-icon">{Icons.Pin({ size: 16 })}</span>
                    <input
                      className="input with-icon"
                      placeholder="e.g., Manila"
                      value={tutorCity}
                      onChange={(e) => setTutorCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="field">
                <div className="label">Short intro (optional)</div>
                <textarea
                  className="input"
                  rows={3}
                  value={tutorBio}
                  onChange={(e) => setTutorBio(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
              </div>
            ) : null}

          <div className="btn-row" style={{ marginTop: 14 }}>
            <button
              className={`btn ${accent.btn}`}
              onClick={() => {
                setSession({
                  role,
                  displayName: displayName.trim() || 'New user',
                  email: email.trim() || 'new@brainlink.local',
                  profile,
                })
                nav('/app')
              }}
            >
              {Icons.UserPlus({ size: 16 })}
              Create and continue
            </button>
            <Link className="btn" to="/sign-in">
              {Icons.LogIn({ size: 16 })}
              I already have an account
            </Link>
          </div>

        </div>
      </div>
    </main>
  )
}

type SessionProfile = StudentProfile | ParentProfile | TutorProfile

