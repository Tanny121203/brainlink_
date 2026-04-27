import { getSql } from './_lib/db.js'
import { createSignedToken, hashPassword, sessionCookie } from './_lib/auth.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { parseBody, id } from './_lib/request.js'
import {
  isStrongEnoughPassword,
  isValidEmail,
  isValidRole,
  normalizeEmail,
  normalizeText,
} from './_lib/validate.js'

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  if (event.httpMethod !== 'POST') return withCors(json(405, { error: 'Method not allowed' }))

  try {
    const body = parseBody(event)
    const role = String(body.role || '')
    const email = normalizeEmail(body.email)
    const displayName = normalizeText(body.displayName, 120)
    const password = String(body.password || '').trim()
    const profile = body.profile ?? null

    if (!email || !displayName || !password || !role) {
      return withCors(json(400, { error: 'Missing required fields' }))
    }
    if (!isValidRole(role)) return withCors(json(400, { error: 'Invalid role' }))
    if (!isValidEmail(email)) return withCors(json(400, { error: 'Invalid email format' }))
    if (!isStrongEnoughPassword(password)) {
      return withCors(json(400, { error: 'Password must be at least 8 characters' }))
    }

    const sql = getSql()
    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
    if (existing.length > 0) return withCors(json(409, { error: 'Email already exists' }))

    const userId = id('u')
    const passwordHash = await hashPassword(password)
    await sql`
      INSERT INTO users (id, email, password_hash, display_name, role, profile)
      VALUES (${userId}, ${email}, ${passwordHash}, ${displayName}, ${role}, ${profile})
    `

    const token = createSignedToken({ sub: userId, email, role })
    const response = withCors(
      json(201, {
        session: { role, email, displayName, profile },
      })
    )
    response.headers['set-cookie'] = sessionCookie(token)
    return response
  } catch (error) {
    return withCors(json(500, { error: 'Registration failed', detail: String(error) }))
  }
}

