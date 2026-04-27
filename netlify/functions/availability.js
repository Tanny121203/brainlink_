import { getSql } from './_lib/db.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { parseBody, requireAuth } from './_lib/request.js'

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  const auth = requireAuth(event)
  if (!auth?.email) return withCors(json(401, { error: 'Unauthorized' }))

  const sql = getSql()
  const ownerEmail = String(auth.email).toLowerCase()

  try {
    if (event.httpMethod === 'GET') {
      const rows = await sql`
        SELECT slot_key FROM tutor_availability
        WHERE owner_email = ${ownerEmail} AND is_open = true
        ORDER BY slot_key ASC
      `
      return withCors(json(200, { slots: rows.map((r) => r.slot_key) }))
    }

    if (event.httpMethod === 'PUT') {
      const body = parseBody(event)
      const slots = Array.isArray(body.slots) ? body.slots.map(String) : []
      await sql`DELETE FROM tutor_availability WHERE owner_email = ${ownerEmail}`
      for (const slot of slots) {
        await sql`
          INSERT INTO tutor_availability (owner_email, slot_key, is_open)
          VALUES (${ownerEmail}, ${slot}, true)
        `
      }
      return withCors(json(200, { ok: true }))
    }

    return withCors(json(405, { error: 'Method not allowed' }))
  } catch (error) {
    return withCors(json(500, { error: 'Availability API failed', detail: String(error) }))
  }
}

