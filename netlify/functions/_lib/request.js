import { getTokenFromHeaders, verifyToken } from './auth.js'

export function parseBody(event) {
  if (!event.body) return {}
  try {
    return JSON.parse(event.body)
  } catch {
    return {}
  }
}

export function requireAuth(event) {
  const token = getTokenFromHeaders(event.headers || {})
  if (!token) return null
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}

export function id(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

