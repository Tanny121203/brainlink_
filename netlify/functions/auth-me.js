import { getSql } from './_lib/db.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { requireAuth } from './_lib/request.js'

function isMissingTutorCredentialsTable(error) {
  const code = error && typeof error === 'object' ? error.code : ''
  const message = String(error?.message || error || '').toLowerCase()
  return code === '42P01' || message.includes('relation') && message.includes('tutor_credentials')
}

function isMissingChildrenTable(error) {
  const code = error && typeof error === 'object' ? error.code : ''
  const message = String(error?.message || error || '').toLowerCase()
  return code === '42P01' || (message.includes('relation') && message.includes('children'))
}

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
    let profile = user.profile
    if (user.role === 'tutor') {
      try {
        const credentials = await sql`
          SELECT id, file_name, mime_type, size_bytes, data_url, uploaded_at
          FROM tutor_credentials
          WHERE tutor_user_id = ${String(auth.sub)}
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
    if (user.role === 'parent') {
      try {
        const children = await sql`
          SELECT id, name, age, grade, details, created_at, updated_at
          FROM children
          WHERE parent_user_id = ${String(auth.sub)}
          ORDER BY created_at DESC
        `
        profile = {
          ...(profile && typeof profile === 'object' ? profile : {}),
          children: children.map((row) => ({
            id: row.id,
            name: row.name,
            age: row.age,
            grade: row.grade,
            details: row.details ?? '',
          })),
        }
      } catch (error) {
        if (!isMissingChildrenTable(error)) throw error
      }
    }
    return withCors(
      json(200, {
        session: {
          role: user.role,
          email: user.email,
          displayName: user.display_name,
          profile,
        },
      })
    )
  } catch (error) {
    return withCors(json(500, { error: 'Could not load session', detail: String(error) }))
  }
}

