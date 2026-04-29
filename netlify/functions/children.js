import { getSql } from './_lib/db.js'
import { json, withCors, handleOptions } from './_lib/http.js'
import { parseBody, requireAuth, id } from './_lib/request.js'

function normalizeChild(body) {
  const name = String(body.name || '').trim()
  const age = Number(body.age)
  const grade = String(body.grade || '').trim()
  const details = String(body.details || '').trim()
  if (!name || !grade || !Number.isFinite(age) || age <= 0) return null
  return {
    name: name.slice(0, 120),
    age: Math.min(30, Math.max(1, Math.round(age))),
    grade: grade.slice(0, 80),
    details: details ? details.slice(0, 2000) : null,
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  const auth = requireAuth(event)
  if (!auth?.sub || auth.role !== 'parent') return withCors(json(401, { error: 'Unauthorized' }))

  const sql = getSql()
  const parentUserId = String(auth.sub)

  try {
    if (event.httpMethod === 'GET') {
      const rows = await sql`
        SELECT id, name, age, grade, details, created_at, updated_at
        FROM children
        WHERE parent_user_id = ${parentUserId}
        ORDER BY created_at DESC
      `
      return withCors(json(200, { children: rows }))
    }

    if (event.httpMethod === 'POST') {
      const body = parseBody(event)
      const child = normalizeChild(body)
      if (!child) return withCors(json(400, { error: 'Invalid child payload' }))
      const childId = id('child')
      await sql`
        INSERT INTO children (id, parent_user_id, name, age, grade, details)
        VALUES (${childId}, ${parentUserId}, ${child.name}, ${child.age}, ${child.grade}, ${child.details})
      `
      return withCors(json(201, { id: childId }))
    }

    if (event.httpMethod === 'PATCH') {
      const body = parseBody(event)
      const childId = String(body.id || '')
      if (!childId) return withCors(json(400, { error: 'Missing id' }))
      const child = normalizeChild(body)
      if (!child) return withCors(json(400, { error: 'Invalid child payload' }))
      await sql`
        UPDATE children
        SET name = ${child.name},
            age = ${child.age},
            grade = ${child.grade},
            details = ${child.details},
            updated_at = now()
        WHERE id = ${childId} AND parent_user_id = ${parentUserId}
      `
      return withCors(json(200, { ok: true }))
    }

    if (event.httpMethod === 'DELETE') {
      const childId = String(event.queryStringParameters?.id || '')
      if (!childId) return withCors(json(400, { error: 'Missing id' }))
      await sql`
        DELETE FROM children
        WHERE id = ${childId} AND parent_user_id = ${parentUserId}
      `
      return withCors(json(200, { ok: true }))
    }

    return withCors(json(405, { error: 'Method not allowed' }))
  } catch (error) {
    return withCors(json(500, { error: 'Children API failed', detail: String(error) }))
  }
}
