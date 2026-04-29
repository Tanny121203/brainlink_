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
const ALLOWED_PHOTO_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
])
const MAX_PHOTO_SIZE_BYTES = 3 * 1024 * 1024

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

function isMissingTutorAvailabilityTable(error) {
  const code = error && typeof error === 'object' ? error.code : ''
  const message = String(error?.message || error || '').toLowerCase()
  return code === '42P01' || (message.includes('relation') && message.includes('tutor_availability'))
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

function sanitizeTutorPhotoDataUrl(value) {
  if (value == null || value === '') return undefined
  const raw = String(value)
  const match = raw.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/)
  if (!match) throw new Error('Invalid tutor profile photo payload')
  const mimeType = String(match[1] || '').toLowerCase()
  const base64 = String(match[2] || '')
  if (!ALLOWED_PHOTO_MIME_TYPES.has(mimeType)) {
    throw new Error('Unsupported tutor profile photo type')
  }
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  const byteSize = Math.floor((base64.length * 3) / 4) - padding
  if (!Number.isFinite(byteSize) || byteSize <= 0 || byteSize > MAX_PHOTO_SIZE_BYTES) {
    throw new Error('Tutor profile photo is too large')
  }
  return raw
}

function toCredentialSummary(item) {
  return {
    id: String(item.id || ''),
    fileName: String(item.fileName || ''),
    mimeType: String(item.mimeType || ''),
    sizeBytes: Number(item.sizeBytes || 0),
    uploadedAtIso: String(item.uploadedAtIso || ''),
    dataUrl: typeof item.dataUrl === 'string' ? item.dataUrl : undefined,
  }
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
          SELECT id, tutor_user_id, file_name, mime_type, size_bytes, uploaded_at
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
            uploadedAtIso:
              row.uploaded_at instanceof Date
                ? row.uploaded_at.toISOString()
                : String(row.uploaded_at || ''),
          })
        }
      } catch (error) {
        // Credentials are optional for tutor browse. Degrade gracefully instead
        // of failing the whole endpoint when this table is unavailable.
        console.error('tutors:get credentials query failed', error)
      }

      let availabilityByEmail = new Map()
      try {
        const availabilityRows = await sql`
          SELECT owner_email, slot_key
          FROM tutor_availability
          WHERE is_open = true
          ORDER BY owner_email ASC, slot_key ASC
        `
        for (const row of availabilityRows) {
          const key = String(row.owner_email || '').toLowerCase()
          if (!key) continue
          if (!availabilityByEmail.has(key)) availabilityByEmail.set(key, [])
          availabilityByEmail.get(key).push(String(row.slot_key || ''))
        }
      } catch (error) {
        // Availability should not take the full tutor directory down.
        // Fallback to profile.availability if DB query fails.
        console.error('tutors:get availability query failed', error)
      }

      const tutors = rows.map((row) => {
        const profile = normalizeTutorProfile(row.profile)
        const subjects = toArray(profile.subjects)
        const email = String(row.email || '').toLowerCase()
        const availabilityFromDb = availabilityByEmail.get(email)
        const credentials =
          credentialsByTutor.get(String(row.id)) ??
          (Array.isArray(profile.credentials)
            ? profile.credentials.map((item) => toCredentialSummary(item))
            : [])
        return {
          id: String(row.id),
          name: String(row.display_name || 'Tutor'),
          email: String(row.email || ''),
          subjects,
          level: ['Elementary', 'JHS', 'SHS', 'College'].includes(String(profile.level || ''))
            ? String(profile.level)
            : undefined,
          mode: ['Online', 'In-person', 'Hybrid'].includes(String(profile.mode || ''))
            ? String(profile.mode)
            : undefined,
          hourlyRate: Number(profile.hourlyRate || 0) || undefined,
          rating: Number(profile.rating || 0) || undefined,
          availability:
            availabilityFromDb ??
            (Array.isArray(profile.availability)
              ? profile.availability.map((x) => String(x || ''))
              : undefined),
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
      photoDataUrl: sanitizeTutorPhotoDataUrl(incomingProfile.photoDataUrl),
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

