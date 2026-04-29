import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icons } from '../components/icons'
import { SectionTitle } from '../components/ui'
import {
  createServerSessionNote,
  fetchServerSessionNotes,
  fetchServerSessions,
  type SessionNote,
} from '../state/serverApi'
import type { Session } from '../state/session'
import { toast } from '../components/Toast'

type ServerSessionRow = {
  id: string
  tutor_name: string
  subject: string
  when_iso: string
  booked_by_email: string
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export function NotesPanel({ session }: { session: Session }) {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<ServerSessionRow[]>([])
  const [notes, setNotes] = useState<SessionNote[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [headline, setHeadline] = useState('')
  const [summary, setSummary] = useState('')
  const [nextStepsText, setNextStepsText] = useState('')

  async function loadNotes() {
    setLoading(true)
    try {
      const sessionResult = await fetchServerSessions()
      const rows = (sessionResult.sessions ?? []) as ServerSessionRow[]
      setSessions(rows)
      if (!selectedSessionId && rows.length > 0) setSelectedSessionId(rows[0].id)
      const allNotes = await Promise.all(
        rows.map(async (row) => {
          const result = await fetchServerSessionNotes(row.id)
          return result.notes ?? []
        })
      )
      setNotes(allNotes.flat().sort((a, b) => b.sent_at.localeCompare(a.sent_at)))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load notes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedSession = useMemo(
    () => sessions.find((row) => row.id === selectedSessionId),
    [sessions, selectedSessionId]
  )

  const subtitle =
    session.role === 'student'
      ? 'Summaries from your tutors after each session—what you did and what to do next.'
      : session.role === 'parent'
        ? 'Session summaries from tutors so you can follow your child’s progress between lessons.'
        : 'Notes shared with students and parents after sessions.'

  return (
    <section className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div className="card-inner">
          <SectionTitle
            title="Session notes"
            subtitle={subtitle}
            right={<span className="pill">{notes.length} entries</span>}
          />

          {session.role === 'tutor' ? (
            <div className="card" style={{ marginTop: 14, background: 'rgba(255,255,255,0.62)' }}>
              <div className="card-inner">
                <div className="label">Share note with client</div>
                <div className="grid grid-2" style={{ marginTop: 10, gap: 10 }}>
                  <div className="field">
                    <div className="label">Session</div>
                    <select
                      className="input"
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                    >
                      <option value="">Select session</option>
                      {sessions.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.subject} - {row.tutor_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <div className="label">Headline</div>
                    <input
                      className="input"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="What should they remember?"
                    />
                  </div>
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">Summary</div>
                  <textarea
                    className="input"
                    rows={3}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>
                <div className="field" style={{ marginTop: 10 }}>
                  <div className="label">Next steps (one per line)</div>
                  <textarea
                    className="input"
                    rows={3}
                    value={nextStepsText}
                    onChange={(e) => setNextStepsText(e.target.value)}
                  />
                </div>
                <div className="btn-row" style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-tutor"
                    onClick={async () => {
                      if (!selectedSession || !headline.trim() || !summary.trim()) {
                        toast.error('Session, headline, and summary are required.')
                        return
                      }
                      const nextSteps = nextStepsText
                        .split('\n')
                        .map((item) => item.trim())
                        .filter(Boolean)
                      await createServerSessionNote({
                        sessionId: selectedSession.id,
                        requestId: selectedSession.id,
                        tutorDisplayName: session.displayName,
                        studentName: selectedSession.booked_by_email,
                        subject: selectedSession.subject,
                        headline: headline.trim(),
                        summary: summary.trim(),
                        nextSteps,
                        visibility: 'both',
                      })
                      setHeadline('')
                      setSummary('')
                      setNextStepsText('')
                      toast.success('Note shared with client.')
                      await loadNotes()
                    }}
                  >
                    {Icons.Send({ size: 16 })}
                    Share note
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid" style={{ gap: 12, marginTop: 14 }}>
            {loading ? <p className="muted">Loading notes...</p> : null}
            {!loading && notes.length === 0 ? (
              <p className="muted">No notes yet.</p>
            ) : null}
            {notes.map((n) => (
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
                      <h3 style={{ fontSize: 16 }}>{n.headline}</h3>
                      <p className="muted" style={{ marginTop: 6 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {Icons.Calendar({ size: 14 })} {formatDate(n.sent_at)}
                        </span>
                        {' · '}
                        {n.subject || 'General'}
                        {' · '}
                        {session.role === 'tutor' ? n.student_name : `Tutor: ${n.tutor_display_name}`}
                      </p>
                    </div>
                    <span className="pill" style={{ flexShrink: 0 }}>
                      {session.role === 'parent' ? n.student_name : n.subject}
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
                    {(n.next_steps || []).map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                  <div className="btn-row" style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => navigate(`/app/messages?request=${encodeURIComponent(n.request_id)}`)}
                    >
                      {Icons.Message({ size: 16 })}
                      Open in Messages
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
