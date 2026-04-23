export type RescheduleRequestStatus =
  | 'Pending'
  | 'Accepted'
  | 'Declined'
  | 'Counter proposed'

export type RescheduleRequest = {
  id: string
  sessionId: string
  tutorId: string
  requesterEmail: string
  requesterName: string
  originalWhen: string
  requestedWhen: string
  note?: string
  status: RescheduleRequestStatus
  counterWhen?: string
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'brainlink.rescheduleRequests.v1'

function loadAll(): RescheduleRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as RescheduleRequest[]
    return []
  } catch {
    return []
  }
}

function saveAll(list: RescheduleRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

export function listRequestsForTutor(tutorId: string): RescheduleRequest[] {
  return loadAll()
    .filter((r) => r.tutorId === tutorId)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function listRequestsForRequester(email: string): RescheduleRequest[] {
  return loadAll()
    .filter((r) => r.requesterEmail === email)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function createRescheduleRequest(
  input: Omit<RescheduleRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): RescheduleRequest {
  const all = loadAll()
  const now = Date.now()
  const req: RescheduleRequest = {
    ...input,
    id: 'rq-' + Math.random().toString(36).slice(2, 10),
    status: 'Pending',
    createdAt: now,
    updatedAt: now,
  }
  saveAll([req, ...all])
  return req
}

export function updateRescheduleRequest(
  id: string,
  patch: Partial<RescheduleRequest>
): RescheduleRequest | null {
  const all = loadAll()
  let updated: RescheduleRequest | null = null
  const next = all.map((r) => {
    if (r.id !== id) return r
    updated = { ...r, ...patch, updatedAt: Date.now() }
    return updated
  })
  if (updated) saveAll(next)
  return updated
}
