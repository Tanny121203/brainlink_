import { getSql } from './_lib/db.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { parseBody, requireAuth, id } from './_lib/request.js'

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  const auth = requireAuth(event)
  if (!auth?.email || !auth?.role) return withCors(json(401, { error: 'Unauthorized' }))

  const sql = getSql()
  try {
    if (event.httpMethod === 'GET') {
      const requestId = event.queryStringParameters?.requestId
      if (!requestId) return withCors(json(400, { error: 'Missing requestId' }))
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

