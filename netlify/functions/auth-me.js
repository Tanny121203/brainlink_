import { getSql } from './_lib/db.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { requireAuth } from './_lib/request.js'

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  if (event.httpMethod !== 'GET') return withCors(json(405, { error: 'Method not allowed' }))

  const auth = requireAuth(event)
  if (!auth?.sub) return withCors(json(401, { error: 'Unauthorized' }))

  try {
    const sql = getSql()
    const rows = await sql`
      SELECT email, role, display_name, profile
      FROM users
      WHERE id = ${String(auth.sub)}
      LIMIT 1
    `
    if (rows.length === 0) return withCors(json(401, { error: 'Unauthorized' }))
    const user = rows[0]
    return withCors(
      json(200, {
        session: {
          role: user.role,
          email: user.email,
          displayName: user.display_name,
          profile: user.profile,
        },
      })
    )
  } catch (error) {
    return withCors(json(500, { error: 'Could not load session', detail: String(error) }))
  }
}

