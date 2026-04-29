import { getSql } from './_lib/db.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { parseBody, requireAuth } from './_lib/request.js'

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  if (event.httpMethod !== 'PATCH') return withCors(json(405, { error: 'Method not allowed' }))

  const auth = requireAuth(event)
  if (!auth?.sub || !auth?.email || !auth?.role) return withCors(json(401, { error: 'Unauthorized' }))

  const body = parseBody(event)
  const nextDisplayName = String(body.displayName || auth.displayName || '').trim()
  const nextEmail = String(body.email || auth.email || '').trim().toLowerCase()
  const nextProfile = body.profile && typeof body.profile === 'object' ? body.profile : {}
  if (!nextDisplayName || !nextEmail) {
    return withCors(json(400, { error: 'Missing displayName or email' }))
  }

  try {
    const sql = getSql()
    const rows = await sql`
      UPDATE users
      SET display_name = ${nextDisplayName},
          email = ${nextEmail},
          profile = ${nextProfile},
          updated_at = now()
      WHERE id = ${String(auth.sub)}
      RETURNING role, email, display_name, profile
    `
    if (rows.length === 0) return withCors(json(404, { error: 'User not found' }))
    const user = rows[0]
    return withCors(
      json(200, {
        ok: true,
        session: {
          role: user.role,
          email: user.email,
          displayName: user.display_name,
          profile: user.profile,
        },
      })
    )
  } catch (error) {
    return withCors(json(500, { error: 'Profile update failed', detail: String(error) }))
  }
}

