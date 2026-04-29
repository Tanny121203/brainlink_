const STORAGE_KEY = 'brainlink.inbox.v1'

export type TutorSentOfferMessage = {
  id: string
  requestId: string
  studentName: string
  subject: string
  proposedRate: number
  availability: string
  message: string
  sentAtIso: string
}

/** Tutor formal offer (parent/tutor negotiation). */
export type SharedThreadOfferMessage = {
  id: string
  requestId: string
  sentAtIso: string
  kind: 'offer'
  fromRole: 'tutor'
  fromDisplayName: string
  fromEmail: string
  studentName: string
  subject: string
  proposedRate: number
  availability: string
  message: string
  toEmail?: string
}

/**
 * Tutor message aimed at the learner — homework, session prep, encouragement.
 * Not persisted to sharedThreads; merged in the UI for the student role only (see mock).
 */
export type SharedTutorNoteMessage = {
  id: string
  requestId: string
  sentAtIso: string
  kind: 'tutor_note'
  fromRole: 'tutor'
  fromDisplayName: string
  fromEmail: string
  subject: string
  headline: string
  text: string
}

export type SharedThreadChatMessage = {
  id: string
  requestId: string
  sentAtIso: string
  kind: 'chat'
  fromRole: 'tutor' | 'student' | 'parent'
  fromDisplayName: string
  fromEmail: string
  text: string
  toEmail: string
}

export type SharedThreadMessage =
  | SharedThreadOfferMessage
  | SharedTutorNoteMessage
  | SharedThreadChatMessage

type InboxStore = {
  tutorSentOffers: Record<string, TutorSentOfferMessage[]>
  /** requestId → timeline (e.g. s-1) */
  sharedThreads: Record<string, SharedThreadMessage[]>
}

function load(): InboxStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { tutorSentOffers: {}, sharedThreads: {} }
    const parsed = JSON.parse(raw) as InboxStore
    if (!parsed.tutorSentOffers || typeof parsed.tutorSentOffers !== 'object') {
      parsed.tutorSentOffers = {}
    }
    if (!parsed.sharedThreads || typeof parsed.sharedThreads !== 'object') {
      parsed.sharedThreads = {}
    }
    let migratedShared = false
    if (Object.keys(parsed.sharedThreads).length === 0 && parsed.tutorSentOffers) {
      for (const [email, msgs] of Object.entries(parsed.tutorSentOffers)) {
        for (const m of msgs) {
          const shared: SharedThreadOfferMessage = {
            id: m.id,
            requestId: m.requestId,
            sentAtIso: m.sentAtIso,
            kind: 'offer',
            fromRole: 'tutor',
            fromDisplayName: 'Tutor',
            fromEmail: email,
            studentName: m.studentName,
            subject: m.subject,
            proposedRate: m.proposedRate,
            availability: m.availability,
            message: m.message,
          }
          if (!parsed.sharedThreads[m.requestId]) parsed.sharedThreads[m.requestId] = []
          parsed.sharedThreads[m.requestId].push(shared)
          migratedShared = true
        }
      }
    }
    if (migratedShared) save(parsed)
    return parsed
  } catch {
    return { tutorSentOffers: {}, sharedThreads: {} }
  }
}

function save(store: InboxStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function notifyInboxUpdated() {
  window.dispatchEvent(new Event('brainlink-inbox-updated'))
}

export function recordTutorSentOffer(
  email: string,
  payload: Omit<TutorSentOfferMessage, 'id' | 'sentAtIso'>,
  tutorDisplayName: string
): TutorSentOfferMessage {
  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const sentAtIso = new Date().toISOString()
  const msg: TutorSentOfferMessage = {
    ...payload,
    id,
    sentAtIso,
  }
  const store = load()
  if (!store.tutorSentOffers[email]) store.tutorSentOffers[email] = []
  store.tutorSentOffers[email].unshift(msg)

  const shared: SharedThreadOfferMessage = {
    id,
    requestId: payload.requestId,
    sentAtIso,
    kind: 'offer',
    fromRole: 'tutor',
    fromDisplayName: tutorDisplayName,
    fromEmail: email,
    studentName: payload.studentName,
    subject: payload.subject,
    proposedRate: payload.proposedRate,
    availability: payload.availability,
    message: payload.message,
  }
  if (!store.sharedThreads[payload.requestId]) store.sharedThreads[payload.requestId] = []
  store.sharedThreads[payload.requestId].push(shared)

  save(store)
  notifyInboxUpdated()
  return msg
}

export function getTutorSentOffers(email: string): TutorSentOfferMessage[] {
  return load().tutorSentOffers[email] ?? []
}

export function getSharedThreadMessages(requestId: string): SharedThreadMessage[] {
  const list = load().sharedThreads[requestId] ?? []
  return [...list].sort((a, b) => a.sentAtIso.localeCompare(b.sentAtIso))
}

export function getSharedThreadIdsOrdered(): string[] {
  const store = load()
  const rows: { id: string; latest: string }[] = []
  for (const [requestId, msgs] of Object.entries(store.sharedThreads)) {
    if (!msgs?.length) continue
    const latest = msgs.reduce((max, m) =>
      m.sentAtIso > max ? m.sentAtIso : max, msgs[0].sentAtIso)
    rows.push({ id: requestId, latest })
  }
  rows.sort((a, b) => b.latest.localeCompare(a.latest))
  return rows.map((r) => r.id)
}
