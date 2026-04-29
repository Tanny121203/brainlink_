import { getSql } from './_lib/db.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { parseBody, requireAuth, id } from './_lib/request.js'

async function hasThreadAccess(sql, requestId, auth) {
  const email = String(auth.email || '').toLowerCase()
  const sub = String(auth.sub || '')
  if (!email || !requestId) return false
  const linkedSession = await sql`
    SELECT id
    FROM learning_sessions
    WHERE id = ${requestId}
      AND (
        booked_by_email = ${email}
        OR tutor_id = ${sub}
        OR lower(tutor_id) = lower(${email})
      )
    LIMIT 1
  `
  if (linkedSession.length > 0) return true
  const participant = await sql`
    SELECT id
    FROM shared_messages
    WHERE request_id = ${requestId}
      AND (
        lower(from_email) = lower(${email})
        OR lower(COALESCE(payload->>'toEmail','')) = lower(${email})
      )
    LIMIT 1
  `
  return participant.length > 0
}

async function resolveRecipientEmail(sql, requestId, auth) {
  const email = String(auth.email || '').toLowerCase()
  if (!email || !requestId) return ''

  const fromMessage = await sql`
    SELECT from_email
    FROM shared_messages
    WHERE request_id = ${requestId}
      AND lower(from_email) <> lower(${email})
    ORDER BY sent_at DESC
    LIMIT 1
  `
  if (fromMessage.length > 0) {
    return String(fromMessage[0].from_email || '').trim().toLowerCase()
  }

  const sessionRows = await sql`
    SELECT tutor_id, booked_by_email
    FROM learning_sessions
    WHERE id = ${requestId}
    LIMIT 1
  `
  if (sessionRows.length === 0) return ''
  const row = sessionRows[0]
  const bookedByEmail = String(row.booked_by_email || '').trim().toLowerCase()
  if (bookedByEmail && bookedByEmail !== email) return bookedByEmail

  const tutorId = String(row.tutor_id || '').trim()
  if (!tutorId) return ''
  if (tutorId.includes('@') && tutorId.toLowerCase() !== email) return tutorId.toLowerCase()

  const tutorUser = await sql`
    SELECT email
    FROM users
    WHERE id = ${tutorId}
    LIMIT 1
  `
  if (tutorUser.length > 0) {
    const tutorEmail = String(tutorUser[0].email || '').trim().toLowerCase()
    if (tutorEmail && tutorEmail !== email) return tutorEmail
  }
  return ''
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  const auth = requireAuth(event)
  if (!auth?.email || !auth?.role || !auth?.sub) return withCors(json(401, { error: 'Unauthorized' }))

  const sql = getSql()
  try {
    if (event.httpMethod === 'GET') {
      const requestId = event.queryStringParameters?.requestId
      if (!requestId) {
        const email = String(auth.email).toLowerCase()
        const rows = await sql`
          SELECT request_id, MAX(sent_at) AS latest_sent_at
          FROM shared_messages
          WHERE lower(from_email) = lower(${email})
             OR lower(COALESCE(payload->>'toEmail', '')) = lower(${email})
             OR EXISTS (
               SELECT 1
               FROM learning_sessions ls
               WHERE ls.id = shared_messages.request_id
                 AND (
                   ls.booked_by_email = ${email}
                   OR ls.tutor_id = ${String(auth.sub)}
                   OR lower(ls.tutor_id) = lower(${email})
                 )
             )
          GROUP BY request_id
          ORDER BY latest_sent_at DESC
        `
        return withCors(
          json(200, {
            threads: rows.map((r) => ({
              requestId: String(r.request_id),
              latestSentAt:
                r.latest_sent_at instanceof Date
                  ? r.latest_sent_at.toISOString()
                  : String(r.latest_sent_at || ''),
            })),
          })
        )
      }
      const allowed = await hasThreadAccess(sql, requestId, auth)
      if (!allowed) return withCors(json(403, { error: 'Forbidden' }))
      const rows = await sql`
        SELECT id, request_id, kind, from_role, from_display_name, from_email, payload, sent_at
        FROM shared_messages
        WHERE request_id = ${requestId}
        ORDER BY sent_at ASC
      `
      return withCors(json(200, { messages: rows }))
    }

    if (event.httpMethod === 'POST') {
      const body = parseBody(event)
      const messageId = id('msg')
      const requestId = String(body.requestId || '')
      const kind = String(body.kind || 'offer')
      const payload = body.payload && typeof body.payload === 'object' ? body.payload : {}
      let toEmail =
        payload.toEmail && typeof payload.toEmail === 'string'
          ? payload.toEmail.trim().toLowerCase()
          : ''
      if (!requestId) return withCors(json(400, { error: 'Missing requestId' }))
      if (kind !== 'offer' && kind !== 'tutor_note' && kind !== 'chat') {
        return withCors(json(400, { error: 'Invalid message kind' }))
      }
      const allowed = await hasThreadAccess(sql, requestId, auth)
      const isTutorOfferBootstrap =
        String(auth.role) === 'tutor' && kind === 'offer' && requestId.startsWith('s-')
      if (!allowed && !isTutorOfferBootstrap) {
        return withCors(json(403, { error: 'Forbidden' }))
      }
      if (kind === 'chat' && !toEmail) {
        toEmail = await resolveRecipientEmail(sql, requestId, auth)
      }
      if (kind === 'chat' && !toEmail) {
        return withCors(json(400, { error: 'Missing recipient email' }))
      }
      const normalizedPayload = { ...payload }
      if (toEmail) normalizedPayload.toEmail = toEmail
      await sql`
        INSERT INTO shared_messages (
          id, request_id, kind, from_role, from_display_name, from_email, payload
        )
        VALUES (
          ${messageId},
          ${requestId},
          ${kind},
          ${String(auth.role)},
          ${String(body.fromDisplayName || 'User')},
          ${String(auth.email)},
          ${normalizedPayload}
        )
      `
      return withCors(json(201, { id: messageId }))
    }

    return withCors(json(405, { error: 'Method not allowed' }))
  } catch (error) {
    return withCors(json(500, { error: 'Inbox API failed', detail: String(error) }))
  }
}

