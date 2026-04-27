import { getSql } from './_lib/db.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { requireAuth } from './_lib/request.js'

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  if (event.httpMethod !== 'GET') return withCors(json(405, { error: 'Method not allowed' }))

  const auth = requireAuth(event)
  if (!auth?.sub) return withCors(json(401, { error: 'Unauthorized' }))

  const id = String(event.queryStringParameters?.id || '').trim()
  if (!id) return withCors(json(400, { error: 'Missing credential id' }))

  try {
    const sql = getSql()
    const rows = await sql`
      SELECT id, mime_type, data_url
      FROM tutor_credentials
      WHERE id = ${id}
      LIMIT 1
    `
    if (!rows[0]) return withCors(json(404, { error: 'Credential not found' }))
    const row = rows[0]
    return withCors(
      json(200, {
        id: String(row.id),
        mimeType: String(row.mime_type || ''),
        dataUrl: String(row.data_url || ''),
      })
    )
  } catch (error) {
    return withCors(json(500, { error: 'Tutor credential API failed', detail: String(error) }))
  }
}
