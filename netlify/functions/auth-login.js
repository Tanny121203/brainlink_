import { getSql } from './_lib/db.js'
import { createSignedToken, sessionCookie, verifyPassword } from './_lib/auth.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { parseBody } from './_lib/request.js'
import { isValidEmail, isValidRole, normalizeEmail } from './_lib/validate.js'

function isMissingTutorCredentialsTable(error) {
  const code = error && typeof error === 'object' ? error.code : ''
  const message = String(error?.message || error || '').toLowerCase()
  return code === '42P01' || message.includes('relation') && message.includes('tutor_credentials')
}

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

    let profile = user.profile
    if (user.role === 'tutor') {
      try {
        const credentials = await sql`
          SELECT id, file_name, mime_type, size_bytes, data_url, uploaded_at
          FROM tutor_credentials
          WHERE tutor_user_id = ${user.id}
          ORDER BY uploaded_at DESC
        `
        profile = {
          ...(profile && typeof profile === 'object' ? profile : {}),
          credentials: credentials.map((row) => ({
            id: row.id,
            fileName: row.file_name,
            mimeType: row.mime_type,
            sizeBytes: row.size_bytes,
            dataUrl: row.data_url,
            uploadedAtIso:
              row.uploaded_at instanceof Date
                ? row.uploaded_at.toISOString()
                : String(row.uploaded_at),
          })),
        }
      } catch (error) {
        if (!isMissingTutorCredentialsTable(error)) throw error
      }
    }

    const token = createSignedToken({ sub: user.id, email: user.email, role: user.role })
    const response = withCors(
      json(200, {
        session: {
          role: user.role,
          email: user.email,
          displayName: user.display_name,
          profile,
        },
      })
    )
    response.headers['set-cookie'] = sessionCookie(token)
    return response
  } catch (error) {
    return withCors(json(500, { error: 'Sign in failed', detail: String(error) }))
  }
}

