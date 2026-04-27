import { getSql } from './_lib/db.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { requireAuth } from './_lib/request.js'

function toArray(value) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v || '').trim())
      .filter(Boolean)
  }
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  if (event.httpMethod !== 'GET') return withCors(json(405, { error: 'Method not allowed' }))

  const auth = requireAuth(event)
  if (!auth?.email) return withCors(json(401, { error: 'Unauthorized' }))

  try {
    const sql = getSql()
    const rows = await sql`
      SELECT id, display_name, email, profile
      FROM users
      WHERE role = 'tutor'
      ORDER BY created_at DESC
    `
    const tutors = rows.map((row) => {
      const profile =
        row.profile && typeof row.profile === 'object' ? row.profile : {}
      const subjects = toArray(profile.subjects)
      return {
        id: String(row.id),
        name: String(row.display_name || 'Tutor'),
        email: String(row.email || ''),
        subjects,
        city: String(profile.city || ''),
        yearsExperience: String(profile.yearsExperience || ''),
        shortBio: String(profile.shortBio || ''),
        photoDataUrl:
          typeof profile.photoDataUrl === 'string' ? profile.photoDataUrl : undefined,
        credentials: Array.isArray(profile.credentials) ? profile.credentials : [],
      }
    })
    return withCors(json(200, { tutors }))
  } catch (error) {
    return withCors(json(500, { error: 'Tutors API failed', detail: String(error) }))
  }
}

