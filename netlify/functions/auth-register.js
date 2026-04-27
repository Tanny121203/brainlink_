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

const ALLOWED_CREDENTIAL_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
])
const MAX_CREDENTIALS = 5
const MAX_CREDENTIAL_SIZE_BYTES = 5 * 1024 * 1024

function isMissingTutorCredentialsTable(error) {
  const code = error && typeof error === 'object' ? error.code : ''
  const message = String(error?.message || error || '').toLowerCase()
  return code === '42P01' || message.includes('relation') && message.includes('tutor_credentials')
}

function sanitizeTutorProfile(profile) {
  if (!profile || typeof profile !== 'object') return null
  const raw = profile
  const credentialsRaw = Array.isArray(raw.credentials) ? raw.credentials : []
  const credentials = credentialsRaw.slice(0, MAX_CREDENTIALS).map((item) => ({
    id: String(item.id || ''),
    fileName: String(item.fileName || '').slice(0, 255),
    mimeType: String(item.mimeType || '').slice(0, 80),
    sizeBytes: Number(item.sizeBytes || 0),
    dataUrl: String(item.dataUrl || ''),
    uploadedAtIso: String(item.uploadedAtIso || new Date().toISOString()),
  }))

  for (const cred of credentials) {
    if (
      !cred.id ||
      !cred.fileName ||
      !ALLOWED_CREDENTIAL_MIME_TYPES.has(cred.mimeType) ||
      !Number.isFinite(cred.sizeBytes) ||
      cred.sizeBytes <= 0 ||
      cred.sizeBytes > MAX_CREDENTIAL_SIZE_BYTES ||
      !cred.dataUrl.startsWith(`data:${cred.mimeType};base64,`)
    ) {
      throw new Error('Invalid tutor credential payload')
    }
  }

  if (!credentials.length) throw new Error('Tutors must upload at least one credential')
  return {
    ...raw,
    credentials,
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  if (event.httpMethod !== 'POST') return withCors(json(405, { error: 'Method not allowed' }))

  try {
    const body = parseBody(event)
    const role = String(body.role || '')
    const email = normalizeEmail(body.email)
    const displayName = normalizeText(body.displayName, 120)
    const password = String(body.password || '').trim()
    let profile = body.profile ?? null

    if (!email || !displayName || !password || !role) {
      return withCors(json(400, { error: 'Missing required fields' }))
    }
    if (!isValidRole(role)) return withCors(json(400, { error: 'Invalid role' }))
    if (!isValidEmail(email)) return withCors(json(400, { error: 'Invalid email format' }))
    if (!isStrongEnoughPassword(password)) {
      return withCors(json(400, { error: 'Password must be at least 8 characters' }))
    }
    if (role === 'tutor') {
      profile = sanitizeTutorProfile(profile)
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
    if (role === 'tutor') {
      const credentials = Array.isArray(profile?.credentials) ? profile.credentials : []
      try {
        for (const cred of credentials) {
          await sql`
            INSERT INTO tutor_credentials (
              id, tutor_user_id, file_name, mime_type, size_bytes, data_url, uploaded_at
            )
            VALUES (
              ${id('cred')},
              ${userId},
              ${cred.fileName},
              ${cred.mimeType},
              ${cred.sizeBytes},
              ${cred.dataUrl},
              ${cred.uploadedAtIso}
            )
          `
        }
      } catch (error) {
        if (!isMissingTutorCredentialsTable(error)) throw error
      }
    }

    const token = createSignedToken({ sub: userId, email, role })
    const response = withCors(
      json(201, {
        session: { role, email, displayName, profile },
      })
    )
    response.headers['set-cookie'] = sessionCookie(token)
    return response
  } catch (error) {
    if (error instanceof Error && error.message.includes('credential')) {
      return withCors(json(400, { error: error.message }))
    }
    return withCors(json(500, { error: 'Registration failed', detail: String(error) }))
  }
}

