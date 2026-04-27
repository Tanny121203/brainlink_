import { clearSessionCookie } from './_lib/auth.js'
import { json, withCors, handleOptions } from './_lib/http.js'

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  if (event.httpMethod !== 'POST') return withCors(json(405, { error: 'Method not allowed' }))
  const response = withCors(json(200, { ok: true }))
  response.headers['set-cookie'] = clearSessionCookie()
  return response
}

