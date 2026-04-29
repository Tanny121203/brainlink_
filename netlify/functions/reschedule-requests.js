import { getSql } from './_lib/db.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { parseBody, requireAuth, id } from './_lib/request.js'

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  const auth = requireAuth(event)
  if (!auth?.email || !auth?.sub || !auth?.role) return withCors(json(401, { error: 'Unauthorized' }))

  const sql = getSql()
  const email = String(auth.email).toLowerCase()

  try {
    if (event.httpMethod === 'GET') {
      const rows =
        auth.role === 'tutor'
          ? await sql`
              SELECT *
              FROM reschedule_requests
              WHERE tutor_id = ${String(auth.sub)} OR lower(tutor_id) = lower(${email})
              ORDER BY updated_at DESC
            `
          : await sql`
              SELECT *
              FROM reschedule_requests
              WHERE requester_email = ${email}
              ORDER BY updated_at DESC
            `
      return withCors(json(200, { requests: rows }))
    }

    if (event.httpMethod === 'POST') {
      const body = parseBody(event)
      const reqId = id('rq')
      await sql`
        INSERT INTO reschedule_requests (
          id, session_id, tutor_id, requester_email, requester_name,
          original_when, requested_when, note, status
        )
        VALUES (
          ${reqId},
          ${String(body.sessionId || '')},
          ${String(body.tutorId || '')},
          ${email},
          ${String(body.requesterName || '')},
          ${String(body.originalWhen || '')},
          ${String(body.requestedWhen || '')},
          ${body.note ? String(body.note) : null},
          'Pending'
        )
      `
      return withCors(json(201, { id: reqId }))
    }

    if (event.httpMethod === 'PATCH') {
      const body = parseBody(event)
      if (!body.id) return withCors(json(400, { error: 'Missing id' }))
      const authWhere =
        auth.role === 'tutor'
          ? sql`(tutor_id = ${String(auth.sub)} OR lower(tutor_id) = lower(${email}))`
          : sql`requester_email = ${email}`
      await sql`
        UPDATE reschedule_requests
        SET status = COALESCE(${body.status}, status),
            counter_when = COALESCE(${body.counterWhen}, counter_when),
            note = COALESCE(${body.note}, note),
            updated_at = now()
        WHERE id = ${String(body.id)} AND ${authWhere}
      `
      return withCors(json(200, { ok: true }))
    }

    return withCors(json(405, { error: 'Method not allowed' }))
  } catch (error) {
    return withCors(json(500, { error: 'Reschedule API failed', detail: String(error) }))
  }
}

