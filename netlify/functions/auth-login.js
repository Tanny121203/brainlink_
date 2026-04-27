import { getSql } from './_lib/db.js'
import { createSignedToken, sessionCookie, verifyPassword } from './_lib/auth.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { parseBody } from './_lib/request.js'
import { isValidEmail, isValidRole, normalizeEmail } from './_lib/validate.js'

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  if (event.httpMethod !== 'POST') return withCors(json(405, { error: 'Method not allowed' }))

  try {
    const body = parseBody(event)
    const role = String(body.role || '')
    const email = normalizeEmail(body.email)
    const password = String(body.password || '').trim()

    if (!email || !password || !role) {
      return withCors(json(400, { error: 'Missing credentials' }))
    }
    if (!isValidRole(role)) return withCors(json(400, { error: 'Invalid role' }))
    if (!isValidEmail(email)) return withCors(json(400, { error: 'Invalid email format' }))

    const sql = getSql()
    const rows = await sql`
      SELECT id, email, display_name, role, profile, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `
    if (rows.length === 0) return withCors(json(401, { error: 'Invalid email or password' }))

    const user = rows[0]
    const passwordMatches = await verifyPassword(password, String(user.password_hash))
    if (!passwordMatches) {
      return withCors(json(401, { error: 'Invalid email or password' }))
    }
    if (user.role !== role) return withCors(json(401, { error: 'Role does not match account' }))

    const token = createSignedToken({ sub: user.id, email: user.email, role: user.role })
    const response = withCors(
      json(200, {
        session: {
          role: user.role,
          email: user.email,
          displayName: user.display_name,
          profile: user.profile,
        },
      })
    )
    response.headers['set-cookie'] = sessionCookie(token)
    return response
  } catch (error) {
    return withCors(json(500, { error: 'Sign in failed', detail: String(error) }))
  }
}

