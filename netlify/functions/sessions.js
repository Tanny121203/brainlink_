import { getSql } from './_lib/db.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { parseBody, requireAuth, id } from './_lib/request.js'

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  const auth = requireAuth(event)
  if (!auth?.email || !auth?.role || !auth?.sub) {
    return withCors(json(401, { error: 'Unauthorized' }))
  }

  const sql = getSql()
  const email = String(auth.email)

  try {
    if (event.httpMethod === 'GET') {
      const rows =
        auth.role === 'tutor'
          ? await sql`
              SELECT id, tutor_id, tutor_name, subject, when_iso, duration_mins, mode, status,
                     booked_by_email, booked_for_role, created_at, hidden_from_ui
              FROM learning_sessions
              WHERE tutor_id = ${String(auth.sub)} AND hidden_from_ui = false
              ORDER BY created_at DESC
            `
          : await sql`
              SELECT id, tutor_id, tutor_name, subject, when_iso, duration_mins, mode, status,
                     booked_by_email, booked_for_role, created_at, hidden_from_ui
              FROM learning_sessions
              WHERE booked_by_email = ${email} AND hidden_from_ui = false
              ORDER BY created_at DESC
            `
      return withCors(json(200, { sessions: rows }))
    }

    if (event.httpMethod === 'POST') {
      const body = parseBody(event)
      const sessionId = id('us')
      await sql`
        INSERT INTO learning_sessions (
          id, tutor_id, tutor_name, subject, when_iso, duration_mins, mode, status,
          booked_by_email, booked_for_role
        )
        VALUES (
          ${sessionId},
          ${String(body.tutorId || '')},
          ${String(body.tutorName || '')},
          ${String(body.subject || '')},
          ${String(body.when || '')},
          ${Number(body.durationMins || 60)},
          ${String(body.mode || 'Online')},
          ${String(body.status || 'Upcoming')},
          ${email},
          ${String(auth.role)}
        )
      `
      return withCors(json(201, { id: sessionId }))
    }

    if (event.httpMethod === 'PATCH') {
      const body = parseBody(event)
      if (!body.id) return withCors(json(400, { error: 'Missing id' }))
      await sql`
        UPDATE learning_sessions
        SET status = COALESCE(${body.status}, status),
            when_iso = COALESCE(${body.when}, when_iso),
            duration_mins = COALESCE(${body.durationMins}, duration_mins),
            mode = COALESCE(${body.mode}, mode),
            hidden_from_ui = COALESCE(${body.hiddenFromUi}, hidden_from_ui),
            updated_at = now()
        WHERE id = ${String(body.id)} AND booked_by_email = ${email}
      `
      return withCors(json(200, { ok: true }))
    }

    return withCors(json(405, { error: 'Method not allowed' }))
  } catch (error) {
    return withCors(json(500, { error: 'Sessions API failed', detail: String(error) }))
  }
}

