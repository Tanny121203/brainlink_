import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SectionTitle } from '../components/ui'
import { Icons } from '../components/icons'
import { studentNeeds } from '../mock/data'
import {
  mergeStudentThreadTimeline,
  STUDENT_DEMO_THREAD_IDS,
} from '../mock/studentThreadMessages'
import {
  getSharedThreadIdsOrdered,
  getSharedThreadMessages,
  type SharedThreadMessage,
  type SharedThreadOfferMessage,
} from '../state/inbox'
import {
  addServerChatMessage,
  fetchServerInboxThreads,
  fetchServerSessionNotes,
  fetchServerThread,
} from '../state/serverApi'
import type { Session } from '../state/session'
import { toast } from '../components/Toast'

function formatSentAt(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function isFromMe(session: Session, m: SharedThreadMessage) {
  return m.fromEmail === session.email
}

function incomingOfferLabel(session: Session, m: SharedThreadMessage, mine: boolean) {
  if (m.kind !== 'offer') return ''
  if (mine && session.role === 'tutor') return 'Your offer'
  if (session.role === 'parent') return `Offer from ${m.fromDisplayName}`
  if (session.role === 'student') {
    return `From ${m.fromDisplayName} — tutor proposal`
  }
  return `Offer from ${m.fromDisplayName}`
}

function tutorNoteLabel(session: Session, m: Extract<SharedThreadMessage, { kind: 'tutor_note' }>) {
  if (session.role === 'student') {
    return `${m.headline} — ${m.fromDisplayName}`
  }
  return `Note from ${m.fromDisplayName}`
}

function previewLine(m: SharedThreadMessage) {
  if (m.kind === 'offer') return m.message
  if (m.kind === 'chat') return m.text
  return m.text
}

function messageSubject(m: SharedThreadMessage): string {
  if (m.kind === 'offer' || m.kind === 'tutor_note') return m.subject
  return ''
}

export function MessagesPanel({ session }: { session: Session }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const requestId = params.get('request')
  const tutorNameParam = params.get('tutor')
  const [tick, setTick] = useState(0)
  const [serverThreadMessages, setServerThreadMessages] = useState<SharedThreadMessage[]>([])
  const [serverThreadIds, setServerThreadIds] = useState<string[]>([])
  const [draftMessage, setDraftMessage] = useState('')
  const explicitToEmail = params.get('toEmail')?.trim().toLowerCase() || ''

  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    window.addEventListener('brainlink-inbox-updated', bump)
    return () => window.removeEventListener('brainlink-inbox-updated', bump)
  }, [])

  useEffect(() => {
    let alive = true
    fetchServerInboxThreads()
      .then((result) => {
        if (!alive) return
        setServerThreadIds((result.threads ?? []).map((t) => t.requestId))
      })
      .catch(() => {
        if (!alive) return
        setServerThreadIds([])
      })
    return () => {
      alive = false
    }
  }, [tick])

  useEffect(() => {
    let alive = true
    async function loadServerThread() {
      if (!requestId) {
        setServerThreadMessages([])
        return
      }
      try {
        const [threadResult, noteResult] = await Promise.all([
          fetchServerThread(requestId),
          fetchServerSessionNotes(requestId),
        ])
        const threadMapped = (threadResult.messages ?? [])
          .map((raw): SharedThreadMessage | null => {
            const payload = (raw as { payload?: Record<string, unknown> }).payload ?? {}
            const kind = String((raw as { kind?: string }).kind || '')
            if (kind === 'offer') {
              return {
                id: String((raw as { id?: string }).id || ''),
                requestId: String((raw as { request_id?: string }).request_id || requestId),
                sentAtIso: String((raw as { sent_at?: string }).sent_at || new Date().toISOString()),
                kind: 'offer',
                fromRole: 'tutor',
                fromDisplayName: String((raw as { from_display_name?: string }).from_display_name || 'Tutor'),
                fromEmail: String((raw as { from_email?: string }).from_email || ''),
                studentName: String(payload.studentName || payload.student_name || 'Student'),
                subject: String(payload.subject || ''),
                proposedRate: Number(payload.proposedRate || payload.proposed_rate || 0),
                availability: String(payload.availability || ''),
                message: String(payload.message || ''),
                toEmail:
                  typeof payload.toEmail === 'string'
                    ? payload.toEmail.trim().toLowerCase()
                    : undefined,
              }
            }
            if (kind === 'tutor_note') {
              return {
                id: String((raw as { id?: string }).id || ''),
                requestId: String((raw as { request_id?: string }).request_id || requestId),
                sentAtIso: String((raw as { sent_at?: string }).sent_at || new Date().toISOString()),
                kind: 'tutor_note',
                fromRole: 'tutor',
                fromDisplayName: String((raw as { from_display_name?: string }).from_display_name || 'Tutor'),
                fromEmail: String((raw as { from_email?: string }).from_email || ''),
                subject: String(payload.subject || ''),
                headline: String(payload.headline || 'Session note'),
                text: String(payload.text || ''),
              }
            }
            if (kind === 'chat') {
              return {
                id: String((raw as { id?: string }).id || ''),
                requestId: String((raw as { request_id?: string }).request_id || requestId),
                sentAtIso: String((raw as { sent_at?: string }).sent_at || new Date().toISOString()),
                kind: 'chat',
                fromRole: String((raw as { from_role?: string }).from_role || 'student') as
                  | 'tutor'
                  | 'student'
                  | 'parent',
                fromDisplayName: String((raw as { from_display_name?: string }).from_display_name || 'User'),
                fromEmail: String((raw as { from_email?: string }).from_email || ''),
                text: String(payload.text || ''),
                toEmail: String(payload.toEmail || '').trim().toLowerCase(),
              }
            }
            return null
          })
          .filter((m): m is SharedThreadMessage => !!m)
        const noteMapped = (noteResult.notes ?? []).map((note) => ({
          id: `note-${note.id}`,
          requestId: note.request_id,
          sentAtIso: note.sent_at,
          kind: 'tutor_note' as const,
          fromRole: 'tutor' as const,
          fromDisplayName: note.tutor_display_name,
          fromEmail: note.tutor_email,
          subject: note.subject,
          headline: note.headline,
          text: note.summary,
        }))
        if (alive) {
          const unique = new Map<string, SharedThreadMessage>()
          for (const item of [...threadMapped, ...noteMapped]) {
            if (!unique.has(item.id)) unique.set(item.id, item)
          }
          const merged = Array.from(unique.values()).sort((a, b) =>
            a.sentAtIso.localeCompare(b.sentAtIso)
          )
          setServerThreadMessages(merged)
        }
      } catch {
        if (alive) setServerThreadMessages([])
      }
    }
    loadServerThread()
    return () => {
      alive = false
    }
  }, [requestId, tick])

  const threadIds = useMemo(() => {
    const base = Array.from(new Set([...getSharedThreadIdsOrdered(), ...serverThreadIds]))
    if (session.role !== 'student') return base
    const ids = new Set([...base, ...STUDENT_DEMO_THREAD_IDS])
    return [...ids].sort((a, b) => {
      const latest = (id: string) => {
        const stored = getSharedThreadMessages(id)
        const merged =
          session.role === 'student'
            ? mergeStudentThreadTimeline(stored, id)
            : stored
        if (merged.length === 0) return 0
        return Math.max(...merged.map((m) => new Date(m.sentAtIso).getTime()))
      }
      return latest(b) - latest(a)
    })
  }, [tick, session.role, serverThreadIds])

  const timelineMessages = useMemo(() => {
    if (!requestId) return []
    const stored = getSharedThreadMessages(requestId)
    const combined = [...stored, ...serverThreadMessages]
    if (session.role === 'student') {
      return mergeStudentThreadTimeline(combined, requestId)
    }
    return combined.sort((a, b) => a.sentAtIso.localeCompare(b.sentAtIso))
  }, [requestId, session.role, tick, serverThreadMessages])

  const resolvedToEmail = useMemo(() => {
    if (explicitToEmail) return explicitToEmail
    const reversed = [...timelineMessages].reverse()
    for (const m of reversed) {
      if (m.kind === 'chat') {
        if (m.fromEmail !== session.email) return m.fromEmail.trim().toLowerCase()
        if (m.toEmail) return m.toEmail.trim().toLowerCase()
      }
      if (m.kind === 'offer') {
        if (m.fromEmail !== session.email) return m.fromEmail.trim().toLowerCase()
        if (m.toEmail) return m.toEmail.trim().toLowerCase()
      }
    }
    return ''
  }, [explicitToEmail, timelineMessages, session.email])

  async function sendChatMessage() {
    if (!requestId) return
    const text = draftMessage.trim()
    if (!text) {
      toast.error('Type a message first.')
      return
    }
    if (!resolvedToEmail) {
      toast.error('Recipient not found for this thread.')
      return
    }
    try {
      await addServerChatMessage({
        requestId,
        fromDisplayName: session.displayName,
        text,
        toEmail: resolvedToEmail,
      })
      setDraftMessage('')
      setTick((t) => t + 1)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send message.')
    }
  }

  const needFromMock = requestId
    ? studentNeeds.find((s) => s.id === requestId)
    : undefined

  const listSubtitle =
    session.role === 'tutor'
      ? 'Open a thread to see what you sent and follow up.'
      : session.role === 'parent'
        ? 'Offers and replies from tutors about your child’s learning requests appear here.'
        : 'Messages from tutors about your subjects and sessions appear here.'

  const emptyHint =
    session.role === 'tutor'
      ? 'Send an offer from Requests to start a conversation.'
      : session.role === 'parent'
        ? 'When a tutor sends an offer on a request, it will show here. You can open a demo thread below to preview the layout.'
        : 'When a tutor messages you about a subject or a session, it will show here. Use the shortcuts below to open a sample thread.'

  if (!requestId && threadIds.length === 0) {
    return (
      <section className="grid" style={{ gap: 14 }}>
        <div className="card">
          <div className="card-inner">
            <SectionTitle title="Messages" subtitle={listSubtitle} />
            <p className="muted" style={{ marginTop: 12 }}>
              {emptyHint}
            </p>
            {(session.role === 'student' || session.role === 'parent') && (
              <div style={{ marginTop: 16 }}>
                <div className="label" style={{ marginBottom: 8 }}>
                  Demo threads
                </div>
                <div className="btn-row" style={{ flexWrap: 'wrap' }}>
                  {studentNeeds.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className="btn"
                      onClick={() =>
                        navigate(`/app/messages?request=${encodeURIComponent(n.id)}`)
                      }
                    >
                      {Icons.Message({ size: 16 })}
                      {n.studentName} — {n.subject}
                    </button>
                  ))}
                </div>
                <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
                  {session.role === 'parent'
                    ? 'After a tutor sends an offer for that request on this device, you’ll see it in the thread.'
                    : 'After a tutor sends a message on this device (same browser), you’ll see it in the thread.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  if (!requestId) {
    return (
      <section className="grid" style={{ gap: 14 }}>
        <div className="card">
          <div className="card-inner">
            <SectionTitle
              title="Messages"
              subtitle={listSubtitle}
              right={<span className="pill">{threadIds.length} threads</span>}
            />
            <div className="grid" style={{ gap: 10, marginTop: 12 }}>
              {threadIds.map((rid) => {
                const stored = getSharedThreadMessages(rid)
                const msgs =
                  session.role === 'student'
                    ? mergeStudentThreadTimeline(stored, rid)
                    : stored
                const last = msgs[msgs.length - 1]
                const need = studentNeeds.find((s) => s.id === rid)
                const title =
                  need?.studentName ??
                  (last?.kind === 'offer' ? last.studentName : undefined) ??
                  'Thread'
                const sub = need
                  ? `${need.subject} • ${need.goal}`
                  : last
                    ? messageSubject(last)
                    : ''
                return (
                  <button
                    key={rid}
                    type="button"
                    className="card"
                    style={{
                      background: 'rgba(255,255,255,0.62)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                    onClick={() =>
                      navigate(`/app/messages?request=${encodeURIComponent(rid)}`)
                    }
                  >
                    <div className="card-inner">
                      <div className="card-header">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h3 style={{ fontSize: 16 }}>{title}</h3>
                          <p className="muted" style={{ marginTop: 6 }}>
                            {sub}
                          </p>
                        </div>
                        <span className="pill" style={{ flexShrink: 0 }}>
                          {last ? formatSentAt(last.sentAtIso) : ''}
                        </span>
                      </div>
                      <p
                        className="subtle"
                        style={{
                          marginTop: 8,
                          wordBreak: 'break-word',
                          lineHeight: 1.45,
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {last ? previewLine(last) : ''}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            {(session.role === 'student' || session.role === 'parent') && (
              <div style={{ marginTop: 16 }}>
                <div className="label" style={{ marginBottom: 8 }}>
                  Open a demo thread
                </div>
                <div className="btn-row" style={{ flexWrap: 'wrap' }}>
                  {studentNeeds.map((n) => (
                    <button
                      key={`demo-${n.id}`}
                      type="button"
                      className="btn"
                      onClick={() =>
                        navigate(`/app/messages?request=${encodeURIComponent(n.id)}`)
                      }
                    >
                      {Icons.Message({ size: 16 })}
                      {n.studentName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  const titleName =
    needFromMock?.studentName ??
    tutorNameParam ??
    timelineMessages.find((m): m is SharedThreadOfferMessage => m.kind === 'offer')
      ?.studentName ??
    'Conversation'

  return (
    <section className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div className="card-inner">
          <SectionTitle
            title={`Thread — ${titleName}`}
            subtitle={
              needFromMock
                ? `${needFromMock.subject} • ${needFromMock.goal}`
                : tutorNameParam
                  ? `Conversation with tutor ${tutorNameParam}`
                : timelineMessages[0]
                  ? `${messageSubject(timelineMessages[0])}`
                  : ''
            }
            right={
              <button
                type="button"
                className="btn"
                onClick={() => navigate('/app/messages')}
              >
                {Icons.ArrowLeft({ size: 16 })}
                All threads
              </button>
            }
          />

          <div
            className="grid"
            style={{
              gap: 12,
              marginTop: 16,
              maxHeight: 'min(60vh, 520px)',
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {timelineMessages.length > 0 ? (
              timelineMessages.map((m) => {
                const mine = isFromMe(session, m)
                if (m.kind === 'tutor_note') {
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                      }}
                    >
                      <div
                        className="card"
                        style={{
                          maxWidth: 'min(100%, 420px)',
                          background:
                            'linear-gradient(135deg, rgba(255,252,240,0.95), rgba(255,248,230,0.9))',
                          border: '1px solid rgba(0,0,0,0.06)',
                        }}
                      >
                        <div className="card-inner" style={{ padding: '12px 14px' }}>
                          <div className="label" style={{ marginBottom: 6 }}>
                            {tutorNoteLabel(session, m)}
                          </div>
                          <span className="pill" style={{ marginBottom: 8, display: 'inline-block' }}>
                            {m.subject}
                          </span>
                          <p
                            className="subtle"
                            style={{
                              marginTop: 10,
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.45,
                            }}
                          >
                            {m.text}
                          </p>
                          <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
                            {formatSentAt(m.sentAtIso)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }
                if (m.kind === 'chat') {
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        justifyContent: mine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        className="card"
                        style={{
                          maxWidth: 'min(100%, 420px)',
                          background: mine
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(230,245,255,0.85))'
                            : 'rgba(255,255,255,0.72)',
                          border: '1px solid rgba(0,0,0,0.06)',
                        }}
                      >
                        <div className="card-inner" style={{ padding: '12px 14px' }}>
                          <div className="label" style={{ marginBottom: 6 }}>
                            {mine ? 'You' : m.fromDisplayName}
                          </div>
                          <p
                            className="subtle"
                            style={{
                              marginTop: 6,
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.45,
                            }}
                          >
                            {m.text}
                          </p>
                          <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
                            {formatSentAt(m.sentAtIso)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }
                const offerLabel = incomingOfferLabel(session, m, mine)
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: mine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      className="card"
                      style={{
                        maxWidth: 'min(100%, 420px)',
                        background: mine
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(230,245,255,0.85))'
                          : 'rgba(255,255,255,0.72)',
                        border: '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      <div className="card-inner" style={{ padding: '12px 14px' }}>
                        <div className="label" style={{ marginBottom: 6 }}>
                          {offerLabel}
                        </div>
                        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
                          ₱{m.proposedRate}/hr • {m.availability}
                        </p>
                        <p
                          className="subtle"
                          style={{
                            marginTop: 10,
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.45,
                          }}
                        >
                          {m.message}
                        </p>
                        <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
                          {formatSentAt(m.sentAtIso)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="muted">
                No messages in this thread yet.
                {session.role === 'parent' && (
                  <> When a tutor sends an offer for this request, it will appear here.</>
                )}
                {session.role === 'student' && (
                  <>
                    {' '}
                    When a tutor sends a message for this subject, it will appear here.
                  </>
                )}
              </p>
            )}
          </div>
          <div className="divider" style={{ margin: '14px 0' }} />
          <div className="grid" style={{ gap: 8 }}>
            <div className="label">Type a message</div>
            <textarea
              className="input"
              rows={3}
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              placeholder={
                resolvedToEmail
                  ? `Message to ${resolvedToEmail}`
                  : 'Recipient will appear once this thread has participant context.'
              }
              style={{ resize: 'vertical' }}
            />
            <div className="btn-row">
              <button
                type="button"
                className={`btn btn-primary ${
                  session.role === 'tutor'
                    ? 'btn-tutor'
                    : session.role === 'parent'
                      ? 'btn-parent'
                      : 'btn-student'
                }`}
                onClick={sendChatMessage}
                title={!resolvedToEmail ? 'Recipient not available for this thread yet.' : 'Send message'}
                style={{ minWidth: 140, justifyContent: 'center' }}
              >
                {Icons.Send({ size: 16 })}
                Send message
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
