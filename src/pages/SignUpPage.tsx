import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RolePill } from '../components/RolePill'
import { Icons } from '../components/icons'
import { SubjectPicker } from '../components/subjects'
import { CitySearchInput } from '../components/cities/CitySearchInput'
import { toast, useDocumentTitle } from '../components/Toast'
import type { Role } from '../state/session'
import {
  getPreferredRole,
  setPreferredRole,
  signUpWithServer,
  type ParentProfile,
  type StudentProfile,
  type TutorCredential,
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

const YEAR_LEVELS = [
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
  'College',
] as const

export function SignUpPage() {
  useDocumentTitle('Create account · BrainLink')
  const nav = useNavigate()
  const initialRole = getPreferredRole() ?? 'student'
  const [role, setRole] = useState<Role>(initialRole)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Student fields
  const [studentYearLevel, setStudentYearLevel] = useState('Grade 8')
  const [studentSchoolName, setStudentSchoolName] = useState('')
  const [studentSubjects, setStudentSubjects] = useState<string[]>([
    'Mathematics',
    'English',
  ])
  const [studentGoal, setStudentGoal] = useState('Better grades + confidence')

  // Parent fields
  const [childName, setChildName] = useState('')
  const [childYearLevel, setChildYearLevel] = useState('Grade 8')
  const [parentCity, setParentCity] = useState('')

  // Tutor fields
  const [tutorSubjects, setTutorSubjects] = useState<string[]>([
    'Mathematics',
    'Science',
  ])
  const [tutorYears, setTutorYears] = useState('2')
  const [tutorCity, setTutorCity] = useState('')
  const [tutorBio, setTutorBio] = useState(
    'I focus on fundamentals first, then practice questions with feedback.'
  )
  const [tutorPhoto, setTutorPhoto] = useState<string | undefined>(undefined)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [tutorCredentials, setTutorCredentials] = useState<TutorCredential[]>([])
  const [credentialError, setCredentialError] = useState<string | null>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file (JPG or PNG).')
      return
    }
    const MAX_BYTES = 3 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      setPhotoError('Image is too large. Please keep it under 3 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setTutorPhoto(reader.result)
    }
    reader.onerror = () => setPhotoError('Could not read the file. Try another image.')
    reader.readAsDataURL(file)
  }

  const handleCredentialFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentialError(null)
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const allowedTypes = new Set([
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
    ])
    const MAX_FILE_BYTES = 5 * 1024 * 1024
    const MAX_FILES = 5
    if (tutorCredentials.length + files.length > MAX_FILES) {
      setCredentialError('You can upload up to 5 credential files.')
      return
    }

    const next: TutorCredential[] = []
    for (const file of files) {
      if (!allowedTypes.has(file.type)) {
        setCredentialError('Only PDF, PNG, JPG, and WEBP files are allowed.')
        return
      }
      if (file.size > MAX_FILE_BYTES) {
        setCredentialError(`"${file.name}" is too large. Max size is 5 MB.`)
        return
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () =>
          typeof reader.result === 'string'
            ? resolve(reader.result)
            : reject(new Error('Could not read file.'))
        reader.onerror = () => reject(new Error('Could not read file.'))
        reader.readAsDataURL(file)
      })
      next.push({
        id: `cred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedAtIso: new Date().toISOString(),
        dataUrl,
      })
    }

    setTutorCredentials((prev) => [...prev, ...next])
    e.target.value = ''
  }

  const accent = useMemo(() => roleAccent(role), [role])
  const roleIcon =
    role === 'student' ? Icons.Cap : role === 'parent' ? Icons.Shield : Icons.Handshake

  const profile = useMemo((): SessionProfile | undefined => {
    if (role === 'student') {
      const p: StudentProfile = {
        yearLevel: studentYearLevel,
        schoolName: studentSchoolName.trim() || undefined,
        subjectsToImprove: studentSubjects.length
          ? studentSubjects.join(', ')
          : undefined,
        learningGoal: studentGoal.trim() || undefined,
      }
      return p
    }
    if (role === 'parent') {
      const p: ParentProfile = {
        childName: childName.trim() || 'My child',
        childYearLevel,
        city: parentCity.trim() || undefined,
      }
      return p
    }
    const p: TutorProfile = {
      subjects: tutorSubjects.length
        ? tutorSubjects.join(', ')
        : 'General tutoring',
      yearsExperience: tutorYears.trim() || '1',
      city: tutorCity.trim() || undefined,
      shortBio: tutorBio.trim() || undefined,
      photoDataUrl: tutorPhoto,
      credentials: tutorCredentials,
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
    parentCity,
    tutorSubjects,
    tutorYears,
    tutorCity,
    tutorBio,
    tutorPhoto,
    tutorCredentials,
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

          <div className="field" style={{ marginTop: 12 }}>
            <div className="label">Password</div>
            <div className="input-group">
              <span className="input-icon">{Icons.Key({ size: 16 })}</span>
              <input
                className="input with-icon"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
              />
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
                <span
                  className="pill"
                  style={{ borderColor: 'transparent', background: 'var(--student-soft)' }}
                >
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
                    {YEAR_LEVELS.map((v) => (
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
                <SubjectPicker
                  selected={studentSubjects}
                  onChange={setStudentSubjects}
                />
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
                    Required so tutors can understand the student's level.
                  </p>
                </div>
                <span
                  className="pill"
                  style={{ borderColor: 'transparent', background: 'var(--parent-soft)' }}
                >
                  {Icons.Shield({ size: 16 })}
                  Parent
                </span>
              </div>

              <div className="grid grid-2">
                <div className="field">
                  <div className="label">Child's name</div>
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
                    {YEAR_LEVELS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="field">
                  <div className="label">City (optional)</div>
                  <CitySearchInput
                    value={parentCity}
                    onChange={setParentCity}
                    placeholder="Search city..."
                  />
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
                <span
                  className="pill"
                  style={{ borderColor: 'transparent', background: 'var(--tutor-soft)' }}
                >
                  {Icons.Handshake({ size: 16 })}
                  Tutor
                </span>
              </div>

              <div className="field">
                <div className="label">
                  Profile photo <span style={{ color: '#a6262b' }}>*</span>
                </div>
                <div className="tutor-photo-row">
                  <div className="tutor-photo-preview" aria-hidden={tutorPhoto ? 'false' : 'true'}>
                    {tutorPhoto ? (
                      <img src={tutorPhoto} alt="Your profile preview" />
                    ) : (
                      <span className="tutor-photo-placeholder">
                        {Icons.User({ size: 32 })}
                      </span>
                    )}
                  </div>
                  <div className="tutor-photo-actions">
                    <label className="btn btn-elevated tutor-photo-btn">
                      {Icons.Camera({ size: 16 })}
                      {tutorPhoto ? 'Replace photo' : 'Upload photo'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {tutorPhoto ? (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          setTutorPhoto(undefined)
                          setPhotoError(null)
                        }}
                      >
                        {Icons.Trash({ size: 16 })}
                        Remove
                      </button>
                    ) : null}
                    <div className="muted" style={{ marginTop: 2 }}>
                      Required. A clear, friendly headshot helps parents and students trust you.
                      JPG or PNG, up to 3 MB.
                    </div>
                    {photoError ? (
                      <div
                        className="muted"
                        role="alert"
                        style={{ color: '#a6262b', marginTop: 4 }}
                      >
                        {photoError}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="field">
                <div className="label">Expertise / subjects taught</div>
                <SubjectPicker
                  selected={tutorSubjects}
                  onChange={setTutorSubjects}
                  role="tutor"
                />
              </div>

              <div className="grid grid-2">
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
                <div className="field">
                  <div className="label">City (optional)</div>
                  <CitySearchInput
                    value={tutorCity}
                    onChange={setTutorCity}
                    placeholder="Search city..."
                  />
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

              <div className="field">
                <div className="label">
                  Credentials (certification, diploma, etc.){' '}
                  <span style={{ color: '#a6262b' }}>*</span>
                </div>
                <label className="btn btn-elevated tutor-photo-btn">
                  {Icons.Send({ size: 16 })}
                  Upload credentials
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleCredentialFiles}
                    style={{ display: 'none' }}
                  />
                </label>
                <div className="muted">
                  Required. Upload up to 5 files (PDF/JPG/PNG/WEBP), max 5 MB each.
                </div>
                {tutorCredentials.length > 0 ? (
                  <div className="grid" style={{ gap: 8 }}>
                    {tutorCredentials.map((cred) => (
                      <div
                        key={cred.id}
                        className="card"
                        style={{ background: 'rgba(255,255,255,0.62)' }}
                      >
                        <div className="card-inner" style={{ padding: '10px 12px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                            }}
                          >
                            <div className="muted" style={{ overflowWrap: 'anywhere' }}>
                              {cred.fileName} • {(cred.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                            </div>
                            <button
                              type="button"
                              className="btn"
                              onClick={() =>
                                setTutorCredentials((prev) =>
                                  prev.filter((item) => item.id !== cred.id)
                                )
                              }
                            >
                              {Icons.Trash({ size: 14 })}
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {credentialError ? (
                  <div className="muted" role="alert" style={{ color: '#a6262b' }}>
                    {credentialError}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {role === 'tutor' && (!tutorPhoto || tutorCredentials.length === 0) ? (
            <div
              className="muted"
              role="alert"
              style={{
                marginTop: 12,
                color: '#a6262b',
                background: 'rgba(255, 221, 221, 0.55)',
                border: '1px solid rgba(166, 38, 43, 0.25)',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              Tutors must upload a profile photo and at least one credential file before
              creating an account.
            </div>
          ) : null}

          <div className="btn-row" style={{ marginTop: 14 }}>
            <button
              className={`btn ${accent.btn}`}
              disabled={role === 'tutor' && (!tutorPhoto || tutorCredentials.length === 0)}
              onClick={async () => {
                try {
                  if (role === 'tutor' && !tutorPhoto) {
                    setPhotoError('A profile photo is required for tutors.')
                    toast.error('Please upload a profile photo to continue.')
                    return
                  }
                  if (role === 'tutor' && tutorCredentials.length === 0) {
                    setCredentialError('At least one credential file is required for tutors.')
                    toast.error('Please upload at least one credential file to continue.')
                    return
                  }
                  const cleanEmail = email.trim()
                  const cleanPassword = password.trim()
                  if (!cleanEmail || !cleanPassword) {
                    toast.error('Please enter email and password.')
                    return
                  }
                  const finalName = displayName.trim() || 'New user'
                  const session = await signUpWithServer({
                    role,
                    displayName: finalName,
                    email: cleanEmail,
                    password: cleanPassword,
                    profile,
                  })
                  toast.success(`Account created — welcome to BrainLink, ${session.displayName}!`)
                  nav('/app')
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : 'Could not create account.'
                  toast.error(message)
                }
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
