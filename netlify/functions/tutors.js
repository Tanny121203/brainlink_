import { getSql } from './_lib/db.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { requireAuth } from './_lib/request.js'

const ALLOWED_CREDENTIAL_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
])
const MAX_CREDENTIALS = 5
const MAX_CREDENTIAL_SIZE_BYTES = 5 * 1024 * 1024

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

function parseBody(event) {
  if (!event.body) return {}
  try {
    return JSON.parse(event.body)
  } catch {
    return {}
  }
}

function isMissingTutorCredentialsTable(error) {
  const code = error && typeof error === 'object' ? error.code : ''
  const message = String(error?.message || error || '').toLowerCase()
  return code === '42P01' || (message.includes('relation') && message.includes('tutor_credentials'))
}

function normalizeTutorProfile(profile) {
  if (!profile || typeof profile !== 'object') return {}
  return profile
}

function sanitizeIncomingCredentials(value) {
  const raw = Array.isArray(value) ? value : []
  const credentials = raw.slice(0, MAX_CREDENTIALS).map((item) => ({
    fileName: String(item.fileName || '').slice(0, 255),
    mimeType: String(item.mimeType || '').slice(0, 80),
    sizeBytes: Number(item.sizeBytes || 0),
    dataUrl: String(item.dataUrl || ''),
    uploadedAtIso: String(item.uploadedAtIso || new Date().toISOString()),
  }))

  for (const cred of credentials) {
    if (
      !cred.fileName ||
      !ALLOWED_CREDENTIAL_MIME_TYPES.has(cred.mimeType) ||
      !Number.isFinite(cred.sizeBytes) ||
      cred.sizeBytes <= 0 ||
      cred.sizeBytes > MAX_CREDENTIAL_SIZE_BYTES ||
      !cred.dataUrl.startsWith(`data:${cred.mimeType};base64,`)
    ) {
      throw new Error('Invalid credential file payload')
    }
  }
  return credentials
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'PATCH') {
    return withCors(json(405, { error: 'Method not allowed' }))
  }

  const auth = requireAuth(event)
  if (!auth?.email || !auth?.sub || !auth?.role) return withCors(json(401, { error: 'Unauthorized' }))

  try {
    const sql = getSql()
    if (event.httpMethod === 'GET') {
      const rows = await sql`
        SELECT id, display_name, email, profile
        FROM users
        WHERE role = 'tutor'
        ORDER BY created_at DESC
      `
      let credentialsByTutor = new Map()
      try {
        const credentialsRows = await sql`
          SELECT id, tutor_user_id, file_name, mime_type, size_bytes, data_url, uploaded_at
          FROM tutor_credentials
          ORDER BY uploaded_at DESC
        `
        for (const row of credentialsRows) {
          const key = String(row.tutor_user_id)
          if (!credentialsByTutor.has(key)) credentialsByTutor.set(key, [])
          credentialsByTutor.get(key).push({
            id: String(row.id),
            fileName: String(row.file_name || ''),
            mimeType: String(row.mime_type || ''),
            sizeBytes: Number(row.size_bytes || 0),
            dataUrl: String(row.data_url || ''),
            uploadedAtIso:
              row.uploaded_at instanceof Date
                ? row.uploaded_at.toISOString()
                : String(row.uploaded_at || ''),
          })
        }
      } catch (error) {
        if (!isMissingTutorCredentialsTable(error)) throw error
      }

      const tutors = rows.map((row) => {
        const profile = normalizeTutorProfile(row.profile)
        const subjects = toArray(profile.subjects)
        const credentials =
          credentialsByTutor.get(String(row.id)) ??
          (Array.isArray(profile.credentials) ? profile.credentials : [])
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
          credentials,
        }
      })
      return withCors(json(200, { tutors }))
    }

    if (auth.role !== 'tutor') {
      return withCors(json(403, { error: 'Only tutor accounts can update tutor profile' }))
    }
    const body = parseBody(event)
    const incomingProfile = normalizeTutorProfile(body.profile)
    const nextProfile = {
      subjects: String(incomingProfile.subjects || ''),
      yearsExperience: String(incomingProfile.yearsExperience || ''),
      city: String(incomingProfile.city || ''),
      shortBio: String(incomingProfile.shortBio || ''),
      photoDataUrl:
        typeof incomingProfile.photoDataUrl === 'string'
          ? incomingProfile.photoDataUrl
          : undefined,
    }
    const incomingCredentials = sanitizeIncomingCredentials(body.newCredentials)

    await sql`
      UPDATE users
      SET profile = ${nextProfile}, updated_at = now()
      WHERE id = ${String(auth.sub)} AND role = 'tutor'
    `

    let createdCredentials = []
    try {
      for (const cred of incomingCredentials) {
        const inserted = await sql`
          INSERT INTO tutor_credentials (
            id, tutor_user_id, file_name, mime_type, size_bytes, data_url, uploaded_at
          ) VALUES (
            ${`cred-${Math.random().toString(36).slice(2, 10)}`},
            ${String(auth.sub)},
            ${cred.fileName},
            ${cred.mimeType},
            ${cred.sizeBytes},
            ${cred.dataUrl},
            ${cred.uploadedAtIso}
          )
          RETURNING id, file_name, mime_type, size_bytes, data_url, uploaded_at
        `
        if (inserted[0]) {
          const row = inserted[0]
          createdCredentials.push({
            id: String(row.id),
            fileName: String(row.file_name || ''),
            mimeType: String(row.mime_type || ''),
            sizeBytes: Number(row.size_bytes || 0),
            dataUrl: String(row.data_url || ''),
            uploadedAtIso:
              row.uploaded_at instanceof Date
                ? row.uploaded_at.toISOString()
                : String(row.uploaded_at || ''),
          })
        }
      }
    } catch (error) {
      if (!isMissingTutorCredentialsTable(error)) throw error
      createdCredentials = []
    }

    return withCors(
      json(200, {
        ok: true,
        profile: {
          ...nextProfile,
          credentials: createdCredentials,
        },
      })
    )
  } catch (error) {
    return withCors(json(500, { error: 'Tutors API failed', detail: String(error) }))
  }
}

