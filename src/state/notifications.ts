import type { Role } from './session'

export type NotificationKind = 'message' | 'session' | 'offer' | 'request'

export type Notification = {
  id: string
  kind: NotificationKind
  title: string
  text: string
  createdAt: number
}

const READ_KEY = 'brainlink.notifRead.v1'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const studentNotifications: Notification[] = [
  {
    id: 'n-s-1',
    kind: 'message',
    title: 'New message from A. Santos',
    text: 'Great job on last session — here are the exercises for next time.',
    createdAt: Date.now() - 25 * MINUTE,
  },
  {
    id: 'n-s-2',
    kind: 'session',
    title: 'Session reminder',
    text: 'Algebra review with A. Santos starts in 2 hours.',
    createdAt: Date.now() - 3 * HOUR,
  },
  {
    id: 'n-s-3',
    kind: 'offer',
    title: 'Tutor sent you an offer',
    text: 'M. Dela Cruz proposed a weekly English plan at ₱450/hr.',
    createdAt: Date.now() - 1 * DAY,
  },
]

const parentNotifications: Notification[] = [
  {
    id: 'n-p-1',
    kind: 'session',
    title: 'Upcoming session tomorrow',
    text: 'Maria has Math with A. Santos at 4pm.',
    createdAt: Date.now() - 40 * MINUTE,
  },
  {
    id: 'n-p-2',
    kind: 'message',
    title: 'Tutor left session notes',
    text: 'A. Santos shared today’s lesson recap.',
    createdAt: Date.now() - 5 * HOUR,
  },
]

const tutorNotifications: Notification[] = [
  {
    id: 'n-t-1',
    kind: 'request',
    title: 'New student request',
    text: 'JHS algebra support needed in Quezon City.',
    createdAt: Date.now() - 15 * MINUTE,
  },
  {
    id: 'n-t-2',
    kind: 'message',
    title: 'Parent replied to your offer',
    text: 'Mrs. Reyes has a question about schedule.',
    createdAt: Date.now() - 2 * HOUR,
  },
  {
    id: 'n-t-3',
    kind: 'session',
    title: 'Session starts soon',
    text: 'Chemistry tutorial with R. begins in 30 minutes.',
    createdAt: Date.now() - 10 * MINUTE,
  },
]

export function notificationsForRole(role: Role): Notification[] {
  if (role === 'student') return studentNotifications
  if (role === 'parent') return parentNotifications
  return tutorNotifications
}

export function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return new Set(parsed as string[])
    return new Set()
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(ids)))
  } catch {
    /* ignore */
  }
}

export function markRead(id: string) {
  const ids = getReadIds()
  ids.add(id)
  saveReadIds(ids)
}

export function markAllRead(role: Role) {
  const ids = getReadIds()
  notificationsForRole(role).forEach((n) => ids.add(n.id))
  saveReadIds(ids)
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < MINUTE) return 'just now'
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE)
    return `${m}m ago`
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR)
    return `${h}h ago`
  }
  const d = Math.floor(diff / DAY)
  return `${d}d ago`
}
