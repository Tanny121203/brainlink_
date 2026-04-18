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
  preferredMode?: 'Online' | 'In-person' | 'Hybrid'
  city?: string
}

export type TutorProfile = {
  subjects: string
  yearsExperience: string
  teachingMode?: 'Online' | 'In-person' | 'Hybrid'
  city?: string
  shortBio?: string
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
