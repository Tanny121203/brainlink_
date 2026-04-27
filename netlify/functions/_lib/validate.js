const ROLES = new Set(['student', 'parent', 'tutor'])

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function normalizeText(value, maxLength = 255) {
  return String(value || '').trim().slice(0, maxLength)
}

export function isValidRole(role) {
  return ROLES.has(String(role || ''))
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isStrongEnoughPassword(password) {
  return password.length >= 8
}

