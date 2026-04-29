import { useEffect, useMemo, useState } from 'react'
import { Icons } from './icons'
import {
  type ChildProfile,
  updateSession,
  type TutorCredential,
  type ParentProfile,
  type Session,
  type StudentProfile,
  type TutorProfile,
} from '../state/session'
import { toast } from './Toast'
import {
  createServerChild,
  deleteServerChild,
  fetchServerChildren,
  updateServerChild,
  updateServerProfile,
  updateServerTutorProfile,
} from '../state/serverApi'
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
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [parentChildren, setParentChildren] = useState<ChildProfile[]>(
    () => (session.role === 'parent' ? ((initialProfile as ParentProfile)?.children ?? []) : [])
  )
  const [deletedChildIds, setDeletedChildIds] = useState<string[]>([])

  const title = useMemo(() => {
    if (session.role === 'student') return 'Your profile'
    if (session.role === 'parent') return 'Student profile'
    return 'Tutor profile'
  }, [session.role])

  useEffect(() => {
    if (session.role !== 'parent') return
    fetchServerChildren()
      .then((result) => {
        setParentChildren(result.children ?? [])
      })
      .catch(() => {
        // Keep local profile snapshot if API is unavailable.
      })
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
              ...((result.profile.credentials ?? []).map((cred) => ({
                ...cred,
                dataUrl: cred.dataUrl || '',
              })) as TutorCredential[]),
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
    if (session.role === 'parent') {
      try {
        for (const childId of deletedChildIds) {
          await deleteServerChild(childId)
        }
        for (const child of parentChildren) {
          const payload = {
            name: child.name.trim(),
            age: Number(child.age),
            grade: child.grade.trim(),
            details: String(child.details || '').trim(),
          }
          if (!payload.name || !payload.grade || !Number.isFinite(payload.age) || payload.age <= 0) {
            toast.error('Each child needs name, valid age, and grade.')
            return
          }
          if (child.id.startsWith('tmp-')) {
            const created = await createServerChild(payload)
            child.id = created.id
          } else {
            await updateServerChild({ ...child, ...payload })
          }
        }
        setDeletedChildIds([])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not save children.')
        return
      }
    }

    const nextDisplayName = displayName.trim() || session.displayName
    const nextEmail = email.trim() || session.email
    try {
      const result = await updateServerProfile({
        displayName: nextDisplayName,
        email: nextEmail,
        profile: nextProfile as Record<string, unknown>,
      })
      const next = updateSession({
        displayName: result.session.displayName,
        email: result.session.email,
        profile: result.session.profile as Session['profile'],
      })
      if (next) {
        toast.success('Profile updated.')
        onUpdated?.(next)
      }
      return
    } catch (error) {
      const next = updateSession({
        displayName: nextDisplayName,
        email: nextEmail,
        profile: nextProfile,
      })
      if (next) {
        toast.error(
          error instanceof Error
            ? `${error.message} Saved locally only.`
            : 'Could not sync profile to server. Saved locally only.'
        )
        onUpdated?.(next)
      }
      return
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

  const handleTutorPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file (JPG, PNG, or WEBP).')
      return
    }
    const MAX_FILE_BYTES = 3 * 1024 * 1024
    if (file.size > MAX_FILE_BYTES) {
      setPhotoError('Image is too large. Please keep it under 3 MB.')
      return
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () =>
          typeof reader.result === 'string'
            ? resolve(reader.result)
            : reject(new Error('Could not read file.'))
        reader.onerror = () => reject(new Error('Could not read file.'))
        reader.readAsDataURL(file)
      })
      setTutorFields((prev) => ({ ...prev, photoDataUrl: dataUrl }))
      e.target.value = ''
    } catch {
      setPhotoError('Could not read the selected photo.')
    }
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
          <div className="grid" style={{ gap: 12 }}>
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
            <div className="divider" style={{ margin: '2px 0' }} />
            <div className="section-title">
              <div className="label">Children</div>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  setParentChildren((prev) => [
                    ...prev,
                    {
                      id: `tmp-${Math.random().toString(36).slice(2, 8)}`,
                      name: '',
                      age: 8,
                      grade: '',
                      details: '',
                    },
                  ])
                }
              >
                {Icons.UserPlus({ size: 16 })}
                Add child
              </button>
            </div>
            {parentChildren.length === 0 ? (
              <p className="muted">No child profile yet. Add one to get started.</p>
            ) : null}
            {parentChildren.map((child) => (
              <div key={child.id} className="card" style={{ background: 'rgba(255,255,255,0.62)' }}>
                <div className="card-inner">
                  <div className="grid grid-2" style={{ gap: 10 }}>
                    <div className="field">
                      <div className="label">Name</div>
                      <input
                        className="input"
                        value={child.name}
                        onChange={(e) =>
                          setParentChildren((prev) =>
                            prev.map((item) =>
                              item.id === child.id ? { ...item, name: e.target.value } : item
                            )
                          )
                        }
                      />
                    </div>
                    <div className="field">
                      <div className="label">Age</div>
                      <input
                        className="input"
                        inputMode="numeric"
                        value={String(child.age)}
                        onChange={(e) =>
                          setParentChildren((prev) =>
                            prev.map((item) =>
                              item.id === child.id
                                ? { ...item, age: Number(e.target.value || 0) }
                                : item
                            )
                          )
                        }
                      />
                    </div>
                    <div className="field">
                      <div className="label">Grade</div>
                      <input
                        className="input"
                        value={child.grade}
                        onChange={(e) =>
                          setParentChildren((prev) =>
                            prev.map((item) =>
                              item.id === child.id ? { ...item, grade: e.target.value } : item
                            )
                          )
                        }
                      />
                    </div>
                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                      <div className="label">Additional details</div>
                      <textarea
                        className="input"
                        rows={2}
                        value={child.details || ''}
                        onChange={(e) =>
                          setParentChildren((prev) =>
                            prev.map((item) =>
                              item.id === child.id ? { ...item, details: e.target.value } : item
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="btn-row" style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        if (!child.id.startsWith('tmp-')) {
                          setDeletedChildIds((prev) => [...prev, child.id])
                        }
                        setParentChildren((prev) => prev.filter((item) => item.id !== child.id))
                      }}
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

        {session.role === 'tutor' ? (
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <div className="label">Profile photo</div>
              <div className="tutor-photo-row">
                <div
                  className="tutor-photo-preview"
                  aria-hidden={tutorFields.photoDataUrl ? 'false' : 'true'}
                >
                  {tutorFields.photoDataUrl ? (
                    <img src={tutorFields.photoDataUrl} alt="Tutor profile preview" />
                  ) : (
                    <span className="tutor-photo-placeholder">
                      {Icons.User({ size: 32 })}
                    </span>
                  )}
                </div>
                <div className="tutor-photo-actions">
                  <label className="btn btn-elevated tutor-photo-btn">
                    {Icons.Camera({ size: 16 })}
                    {tutorFields.photoDataUrl ? 'Replace photo' : 'Upload photo'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleTutorPhotoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {tutorFields.photoDataUrl ? (
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        setTutorFields((prev) => ({ ...prev, photoDataUrl: undefined }))
                      }
                    >
                      {Icons.Trash({ size: 16 })}
                      Remove
                    </button>
                  ) : null}
                  <div className="muted" style={{ marginTop: 2 }}>
                    JPG, PNG, or WEBP up to 3 MB.
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
