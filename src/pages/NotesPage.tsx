import { SectionTitle } from '../components/ui'
import { Icons } from '../components/icons'
import { sessionNotesMock } from '../mock/sessionNotes'
import type { Session } from '../state/session'

export function NotesPanel({ session }: { session: Session }) {
  const subtitle =
    session.role === 'student'
      ? 'Summaries from your tutors after each session—what you did and what to do next.'
      : session.role === 'parent'
        ? 'Session summaries from tutors so you can follow your child’s progress between lessons.'
        : 'Notes shared with students and parents after sessions (prototype sample).'

  return (
    <section className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div className="card-inner">
          <SectionTitle
            title="Session notes"
            subtitle={subtitle}
            right={<span className="pill">{sessionNotesMock.length} entries</span>}
          />

          <div className="grid" style={{ gap: 12, marginTop: 14 }}>
            {sessionNotesMock.map((n) => (
              <div
                key={n.id}
                className="card"
                style={{
                  background: 'rgba(255,255,255,0.62)',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <div className="card-inner">
                  <div className="card-header" style={{ marginBottom: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: 16 }}>{n.sessionTitle}</h3>
                      <p className="muted" style={{ marginTop: 6 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {Icons.Calendar({ size: 14 })} {n.dateLabel}
                        </span>
                        {' · '}
                        {n.subject}
                        {' · '}
                        {session.role === 'tutor'
                          ? n.studentLabel
                          : `Tutor: ${n.tutorName}`}
                      </p>
                    </div>
                    <span className="pill" style={{ flexShrink: 0 }}>
                      {session.role === 'parent' ? n.studentLabel : n.subject}
                    </span>
                  </div>

                  <div className="label" style={{ marginBottom: 6 }}>
                    {Icons.CheckBook({ size: 14 })}
                    &nbsp; Summary
                  </div>
                  <p className="subtle" style={{ lineHeight: 1.5 }}>
                    {n.summary}
                  </p>

                  <div className="label" style={{ marginTop: 14, marginBottom: 6 }}>
                    Next steps
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 20,
                      color: 'var(--text-body)',
                      lineHeight: 1.55,
                    }}
                  >
                    {n.nextSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
