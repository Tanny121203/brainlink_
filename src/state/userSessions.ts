import type { Role } from './session'

export type UserSessionStatus =
  | 'Upcoming'
  | 'Completed'
  | 'Canceled'
  | 'Pending tutor approval'

export type UserSession = {
  id: string
  tutorId: string
  tutorName: string
  subject: string
  when: string
  durationMins: number
  mode: 'Online' | 'In-person' | 'Hybrid'
  status: UserSessionStatus
  bookedByEmail: string
  bookedForRole: Role
  createdAt: number
}

const STORAGE_KEY = 'brainlink.userSessions.v1'
const HIDDEN_MOCK_KEY = 'brainlink.hiddenMockSessions.v1'

export function loadUserSessions(): UserSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as UserSession[]
    return []
  } catch {
    return []
  }
}

export function saveUserSessions(sessions: UserSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {
    /* ignore */
  }
}

export function addUserSession(
  session: Omit<UserSession, 'id' | 'createdAt'>
): UserSession {
  const all = loadUserSessions()
  const created: UserSession = {
    ...session,
    id: 'us-' + Math.random().toString(36).slice(2, 10),
    createdAt: Date.now(),
  }
  saveUserSessions([created, ...all])
  return created
}

export function removeUserSession(id: string) {
  const all = loadUserSessions()
  saveUserSessions(all.filter((s) => s.id !== id))
}

export function updateUserSession(
  id: string,
  patch: Partial<UserSession>
): UserSession | null {
  const all = loadUserSessions()
  let updated: UserSession | null = null
  const next = all.map((s) => {
    if (s.id !== id) return s
    updated = { ...s, ...patch }
    return updated
  })
  if (updated) saveUserSessions(next)
  return updated
}

export function isUserBookedId(id: string): boolean {
  return id.startsWith('us-')
}

export function loadHiddenMockIds(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_MOCK_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return new Set(parsed as string[])
    return new Set()
  } catch {
    return new Set()
  }
}

export function saveHiddenMockIds(ids: Set<string>) {
  try {
    localStorage.setItem(HIDDEN_MOCK_KEY, JSON.stringify(Array.from(ids)))
  } catch {
    /* ignore */
  }
}

export function hideMockSession(id: string) {
  const ids = loadHiddenMockIds()
  ids.add(id)
  saveHiddenMockIds(ids)
}
