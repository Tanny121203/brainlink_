import { getSql } from './_lib/db.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { parseBody, requireAuth, id } from './_lib/request.js'

async function hasThreadAccess(sql, requestId, auth) {
  const email = String(auth.email || '').toLowerCase()
  const sub = String(auth.sub || '')
  if (!email || !requestId) return false
  if (requestId.startsWith('s-') && auth.role !== 'tutor') return true
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
      const payload = body.payload ?? {}
      if (!requestId) return withCors(json(400, { error: 'Missing requestId' }))
      if (kind !== 'offer' && kind !== 'tutor_note') {
        return withCors(json(400, { error: 'Invalid message kind' }))
      }
      const allowed = await hasThreadAccess(sql, requestId, auth)
      const isTutorOfferBootstrap =
        String(auth.role) === 'tutor' && kind === 'offer' && requestId.startsWith('s-')
      if (!allowed && !isTutorOfferBootstrap) {
        return withCors(json(403, { error: 'Forbidden' }))
      }
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
          ${payload}
        )
      `
      return withCors(json(201, { id: messageId }))
    }

    return withCors(json(405, { error: 'Method not allowed' }))
  } catch (error) {
    return withCors(json(500, { error: 'Inbox API failed', detail: String(error) }))
  }
}

