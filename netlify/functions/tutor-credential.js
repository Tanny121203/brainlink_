import { getSql } from './_lib/db.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { requireAuth } from './_lib/request.js'

function isMissingTutorCredentialsTable(error) {
  const code = error && typeof error === 'object' ? error.code : ''
  const message = String(error?.message || error || '').toLowerCase()
  return code === '42P01' || (message.includes('relation') && message.includes('tutor_credentials'))
}

function extractCredentialFromProfile(profile, credentialId) {
  if (!profile || typeof profile !== 'object') return null
  const credentials = Array.isArray(profile.credentials) ? profile.credentials : []
  for (const item of credentials) {
    if (String(item?.id || '') !== credentialId) continue
    const dataUrl = String(item?.dataUrl || '')
    if (!dataUrl) continue
    return {
      id: credentialId,
      mimeType: String(item?.mimeType || ''),
      dataUrl,
    }
  }
  return null
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  if (event.httpMethod !== 'GET') return withCors(json(405, { error: 'Method not allowed' }))

  const auth = requireAuth(event)
  if (!auth?.sub) return withCors(json(401, { error: 'Unauthorized' }))

  const id = String(event.queryStringParameters?.id || '').trim()
  if (!id) return withCors(json(400, { error: 'Missing credential id' }))

  try {
    const sql = getSql()
    try {
      const rows = await sql`
        SELECT id, mime_type, data_url
        FROM tutor_credentials
        WHERE id = ${id}
        LIMIT 1
      `
      if (rows[0]) {
        const row = rows[0]
        return withCors(
          json(200, {
            id: String(row.id),
            mimeType: String(row.mime_type || ''),
            dataUrl: String(row.data_url || ''),
          })
        )
      }
    } catch (error) {
      if (!isMissingTutorCredentialsTable(error)) throw error
    }

    // Fallback path when tutor_credentials is unavailable:
    // try to resolve credential payload from tutor profile JSON.
    const tutors = await sql`
      SELECT profile
      FROM users
      WHERE role = 'tutor'
    `
    for (const row of tutors) {
      const found = extractCredentialFromProfile(row.profile, id)
      if (found) return withCors(json(200, found))
    }
    return withCors(json(404, { error: 'Credential not found' }))
  } catch (error) {
    return withCors(json(500, { error: 'Tutor credential API failed', detail: String(error) }))
  }
}
