import { useMemo, useState } from 'react'
import { Icons } from './icons'
import {
  updateSession,
  type ParentProfile,
  type Session,
  type StudentProfile,
  type TutorProfile,
} from '../state/session'
import { toast } from './Toast'

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

  const title = useMemo(() => {
    if (session.role === 'student') return 'Your profile'
    if (session.role === 'parent') return 'Student profile'
    return 'Tutor profile'
  }, [session.role])

  function handleSave() {
    const nextProfile =
      session.role === 'student'
        ? studentFields
        : session.role === 'parent'
          ? parentFields
          : tutorFields

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
