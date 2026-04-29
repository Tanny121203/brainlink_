import { getSql } from './_lib/db.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { parseBody, requireAuth, id } from './_lib/request.js'

function normalizeNextSteps(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 10)
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  const auth = requireAuth(event)
  if (!auth?.email || !auth?.role) return withCors(json(401, { error: 'Unauthorized' }))

  const sql = getSql()
  const email = String(auth.email)

  try {
    if (event.httpMethod === 'GET') {
      const requestId = String(event.queryStringParameters?.requestId || '')
      if (!requestId) return withCors(json(400, { error: 'Missing requestId' }))
      const rows = await sql`
        SELECT sn.id, sn.session_id, sn.request_id, sn.tutor_email, sn.tutor_display_name,
               sn.student_name, sn.subject, sn.headline, sn.summary, sn.next_steps,
               sn.visibility, sn.sent_at, sn.updated_at
        FROM session_notes sn
        LEFT JOIN learning_sessions ls ON ls.id = sn.session_id
        WHERE sn.request_id = ${requestId}
          AND (
            sn.tutor_email = ${email}
            OR ls.booked_by_email = ${email}
          )
        ORDER BY sn.sent_at DESC
      `
      return withCors(json(200, { notes: rows }))
    }

    if (event.httpMethod === 'POST') {
      if (auth.role !== 'tutor') return withCors(json(403, { error: 'Tutor role required' }))
      const body = parseBody(event)
      const sessionId = String(body.sessionId || '').trim()
      const requestId = String(body.requestId || '').trim()
      const studentName = String(body.studentName || '').trim()
      const subject = String(body.subject || '').trim()
      const headline = String(body.headline || '').trim()
      const summary = String(body.summary || '').trim()
      const visibility = String(body.visibility || 'both').trim() || 'both'
      const nextSteps = normalizeNextSteps(body.nextSteps)
      if (!sessionId || !requestId || !subject || !headline || !summary) {
        return withCors(json(400, { error: 'Missing required fields' }))
      }
      const sessionRows = await sql`
        SELECT id FROM learning_sessions WHERE id = ${sessionId} LIMIT 1
      `
      if (!sessionRows.length) return withCors(json(404, { error: 'Session not found' }))

      const noteId = id('note')
      await sql`
        INSERT INTO session_notes (
          id, session_id, request_id, tutor_email, tutor_display_name, student_name,
          subject, headline, summary, next_steps, visibility
        )
        VALUES (
          ${noteId},
          ${sessionId},
          ${requestId},
          ${email},
          ${String(body.tutorDisplayName || 'Tutor')},
          ${studentName || 'Student'},
          ${subject},
          ${headline},
          ${summary},
          ${nextSteps},
          ${visibility}
        )
      `
      await sql`
        INSERT INTO shared_messages (
          id, request_id, kind, from_role, from_display_name, from_email, payload
        )
        VALUES (
          ${id('msg')},
          ${requestId},
          ${'tutor_note'},
          ${'tutor'},
          ${String(body.tutorDisplayName || 'Tutor')},
          ${email},
          ${{
            noteId,
            sessionId,
            subject,
            headline,
            text: summary,
            nextSteps,
          }}
        )
      `
      return withCors(json(201, { id: noteId }))
    }

    return withCors(json(405, { error: 'Method not allowed' }))
  } catch (error) {
    return withCors(json(500, { error: 'Session notes API failed', detail: String(error) }))
  }
}
