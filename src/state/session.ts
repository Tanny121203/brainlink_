import { apiRequest } from '../lib/api'

export type Role = 'student' | 'parent' | 'tutor'

export type Session = {
  role: Role
  displayName: string
  email: string
  profile?: StudentProfile | ParentProfile | TutorProfile
}

export type StudentProfile = {
  yearLevel: string
  schoolName?: string
  subjectsToImprove?: string
  learningGoal?: string
}

export type ParentProfile = {
  childName: string
  childYearLevel: string
  city?: string
}

export type TutorProfile = {
  subjects: string
  yearsExperience: string
  city?: string
  shortBio?: string
  photoDataUrl?: string
}

const STORAGE_KEY = 'brainlink.session.v1'

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function setSession(session: Session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function updateSession(patch: Partial<Session>): Session | null {
  const current = getSession()
  if (!current) return null
  const next: Session = { ...current, ...patch }
  setSession(next)
  return next
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}

const ROLE_KEY = 'brainlink.role.v1'
export function getPreferredRole(): Role | null {
  const raw = localStorage.getItem(ROLE_KEY)
  if (raw === 'student' || raw === 'parent' || raw === 'tutor') return raw
  return null
}

export function setPreferredRole(role: Role) {
  localStorage.setItem(ROLE_KEY, role)
}

type AuthPayload = {
  role: Role
  email: string
  displayName: string
  password: string
  profile?: StudentProfile | ParentProfile | TutorProfile
}

export async function signUpWithServer(payload: AuthPayload): Promise<Session> {
  const result = await apiRequest<{ session: Session }>('auth-register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setSession(result.session)
  return result.session
}

export async function signInWithServer(
  role: Role,
  email: string,
  password: string
): Promise<Session> {
  const result = await apiRequest<{ session: Session }>('auth-login', {
    method: 'POST',
    body: JSON.stringify({ role, email, password }),
  })
  setSession(result.session)
  return result.session
}

export async function refreshSessionFromServer(): Promise<Session | null> {
  try {
    const result = await apiRequest<{ session: Session }>('auth-me', { method: 'GET' })
    setSession(result.session)
    return result.session
  } catch {
    clearSession()
    return null
  }
}

export async function signOutFromServer() {
  try {
    await apiRequest<{ ok: boolean }>('auth-logout', { method: 'POST', body: '{}' })
  } finally {
    clearSession()
  }
}
