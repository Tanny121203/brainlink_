import { useMemo, useState } from 'react'
import { Icons } from './icons'
import {
  updateSession,
  type TutorCredential,
  type ParentProfile,
  type Session,
  type StudentProfile,
  type TutorProfile,
} from '../state/session'
import { toast } from './Toast'
import { updateServerTutorProfile } from '../state/serverApi'
import { CredentialPreviewCard } from './CredentialPreviewCard'

type Props = {
  session: Session
  onUpdated?: (next: Session) => void
}

export function ProfileSection({ session, onUpdated }: Props) {
  const [displayName, setDisplayName] = useState(session.displayName)
  const [email, setEmail] = useState(session.email)

  const initialProfile = session.profile
  const [studentFields, setStudentFields] = useState<StudentProfile>(() =>
    session.role === 'student' && initialProfile
      ? (initialProfile as StudentProfile)
      : {
          yearLevel: '',
          schoolName: '',
          subjectsToImprove: '',
          learningGoal: '',
        }
  )
  const [parentFields, setParentFields] = useState<ParentProfile>(() =>
    session.role === 'parent' && initialProfile
      ? (initialProfile as ParentProfile)
      : {
          childName: '',
          childYearLevel: '',
          city: '',
        }
  )
  const [tutorFields, setTutorFields] = useState<TutorProfile>(() =>
    session.role === 'tutor' && initialProfile
      ? (initialProfile as TutorProfile)
      : {
          subjects: '',
          yearsExperience: '',
          city: '',
          shortBio: '',
        }
  )
  const [newCredentials, setNewCredentials] = useState<TutorCredential[]>([])
  const [credentialError, setCredentialError] = useState<string | null>(null)

  const title = useMemo(() => {
    if (session.role === 'student') return 'Your profile'
    if (session.role === 'parent') return 'Student profile'
    return 'Tutor profile'
  }, [session.role])

  async function handleSave() {
    const nextProfile =
      session.role === 'student'
        ? studentFields
        : session.role === 'parent'
          ? parentFields
          : tutorFields

    if (session.role === 'tutor') {
      try {
        const result = await updateServerTutorProfile({
          profile: {
            subjects: tutorFields.subjects ?? '',
            yearsExperience: tutorFields.yearsExperience ?? '',
            city: tutorFields.city,
            shortBio: tutorFields.shortBio,
            photoDataUrl: tutorFields.photoDataUrl,
          },
          newCredentials: newCredentials.map((cred) => ({
            fileName: cred.fileName,
            mimeType: cred.mimeType,
            sizeBytes: cred.sizeBytes,
            uploadedAtIso: cred.uploadedAtIso,
            dataUrl: cred.dataUrl,
          })),
        })
        const next = updateSession({
          displayName: displayName.trim() || session.displayName,
          email: email.trim() || session.email,
          profile: {
            ...tutorFields,
            credentials: [
              ...((tutorFields.credentials as TutorCredential[] | undefined) ?? []),
              ...(result.profile.credentials ?? []),
            ],
          },
        })
        setNewCredentials([])
        if (next) {
          toast.success('Profile updated.')
          onUpdated?.(next)
        }
        return
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not update tutor profile.')
        return
      }
    }

    const next = updateSession({
      displayName: displayName.trim() || session.displayName,
      email: email.trim() || session.email,
      profile: nextProfile,
    })

    if (next) {
      toast.success('Profile updated.')
      onUpdated?.(next)
    }
  }

  const handleCredentialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const current = (tutorFields.credentials?.length ?? 0) + newCredentials.length
    if (current + files.length > MAX_FILES) {
      setCredentialError('You can have up to 5 credentials in total.')
      return
    }

    const added: TutorCredential[] = []
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
      added.push({
        id: `cred-temp-${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedAtIso: new Date().toISOString(),
        dataUrl,
      })
    }
    setNewCredentials((prev) => [...prev, ...added])
    e.target.value = ''
  }

  return (
    <section className="card">
      <div className="card-inner">
        <div className="card-header">
          <div>
            <h2 style={{ fontSize: 20 }}>{title}</h2>
            <p className="subtle" style={{ marginTop: 6 }}>
              Keep your details current so tutors and parents can reach you.
            </p>
          </div>
          <span className="pill">{session.role}</span>
        </div>

        <div className="grid grid-2" style={{ gap: 12, marginTop: 8 }}>
          <div className="field">
            <div className="label">Display name</div>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="field">
            <div className="label">Email</div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="divider" />

        {session.role === 'student' ? (
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div className="field">
              <div className="label">Year level</div>
              <input
                className="input"
                value={studentFields.yearLevel ?? ''}
                onChange={(e) =>
                  setStudentFields({ ...studentFields, yearLevel: e.target.value })
                }
                placeholder="e.g., Grade 10"
              />
            </div>
            <div className="field">
              <div className="label">School</div>
              <input
                className="input"
                value={studentFields.schoolName ?? ''}
                onChange={(e) =>
                  setStudentFields({ ...studentFields, schoolName: e.target.value })
                }
                placeholder="School name"
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <div className="label">Subjects to improve</div>
              <input
                className="input"
                value={studentFields.subjectsToImprove ?? ''}
                onChange={(e) =>
                  setStudentFields({
                    ...studentFields,
                    subjectsToImprove: e.target.value,
                  })
                }
                placeholder="e.g., Math, Reading"
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <div className="label">Learning goal</div>
              <textarea
                className="input"
                rows={3}
                value={studentFields.learningGoal ?? ''}
                onChange={(e) =>
                  setStudentFields({
                    ...studentFields,
                    learningGoal: e.target.value,
                  })
                }
                placeholder="What do you want to achieve?"
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
        ) : null}

        {session.role === 'parent' ? (
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div className="field">
              <div className="label">Child’s name</div>
              <input
                className="input"
                value={parentFields.childName ?? ''}
                onChange={(e) =>
                  setParentFields({ ...parentFields, childName: e.target.value })
                }
                placeholder="Child’s name"
              />
            </div>
            <div className="field">
              <div className="label">Child’s year level</div>
              <input
                className="input"
                value={parentFields.childYearLevel ?? ''}
                onChange={(e) =>
                  setParentFields({
                    ...parentFields,
                    childYearLevel: e.target.value,
                  })
                }
                placeholder="e.g., Grade 7"
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <div className="label">City</div>
              <input
                className="input"
                value={parentFields.city ?? ''}
                onChange={(e) =>
                  setParentFields({ ...parentFields, city: e.target.value })
                }
                placeholder="City"
              />
            </div>
          </div>
        ) : null}

        {session.role === 'tutor' ? (
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div className="field">
              <div className="label">Subjects</div>
              <input
                className="input"
                value={tutorFields.subjects ?? ''}
                onChange={(e) =>
                  setTutorFields({ ...tutorFields, subjects: e.target.value })
                }
                placeholder="e.g., Math, Science"
              />
            </div>
            <div className="field">
              <div className="label">Years of experience</div>
              <input
                className="input"
                value={tutorFields.yearsExperience ?? ''}
                onChange={(e) =>
                  setTutorFields({
                    ...tutorFields,
                    yearsExperience: e.target.value,
                  })
                }
                placeholder="e.g., 5"
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <div className="label">City</div>
              <input
                className="input"
                value={tutorFields.city ?? ''}
                onChange={(e) =>
                  setTutorFields({ ...tutorFields, city: e.target.value })
                }
                placeholder="City"
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <div className="label">Short bio</div>
              <textarea
                className="input"
                rows={4}
                value={tutorFields.shortBio ?? ''}
                onChange={(e) =>
                  setTutorFields({ ...tutorFields, shortBio: e.target.value })
                }
                placeholder="Tell students what makes your teaching style effective."
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <div className="label">Uploaded credentials</div>
              {tutorFields.credentials?.length ? (
                <div className="credential-grid">
                  {tutorFields.credentials.map((cred) => (
                    <CredentialPreviewCard key={cred.id} cred={cred} />
                  ))}
                </div>
              ) : (
                <p className="muted">No credentials uploaded yet.</p>
              )}
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <div className="label">Add credentials</div>
              <label className="btn btn-elevated tutor-photo-btn">
                {Icons.Send({ size: 16 })}
                Upload files
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handleCredentialUpload}
                  style={{ display: 'none' }}
                />
              </label>
              {newCredentials.length ? (
                <div className="grid" style={{ gap: 8, marginTop: 8 }}>
                  {newCredentials.map((cred) => (
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
                          <div className="muted">{cred.fileName}</div>
                          <button
                            className="btn"
                            type="button"
                            onClick={() =>
                              setNewCredentials((prev) =>
                                prev.filter((x) => x.id !== cred.id)
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
                <p className="muted" style={{ color: '#a6262b' }}>
                  {credentialError}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="btn-row" style={{ marginTop: 14 }}>
          <button
            className={`btn btn-primary ${
              session.role === 'tutor'
                ? 'btn-tutor'
                : session.role === 'parent'
                  ? 'btn-parent'
                  : 'btn-student'
            }`}
            onClick={handleSave}
          >
            {Icons.Send({ size: 16 })}
            Save changes
          </button>
        </div>
      </div>
    </section>
  )
}
