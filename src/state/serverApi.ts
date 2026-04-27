import { apiRequest } from '../lib/api'

export async function fetchServerSessions() {
  return apiRequest<{ sessions: unknown[] }>('sessions', { method: 'GET' })
}

export async function createServerSession(payload: Record<string, unknown>) {
  return apiRequest<{ id: string }>('sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateServerSession(payload: Record<string, unknown>) {
  return apiRequest<{ ok: boolean }>('sessions', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function fetchServerAvailability() {
  return apiRequest<{ slots: string[] }>('availability', { method: 'GET' })
}

export async function saveServerAvailability(slots: string[]) {
  return apiRequest<{ ok: boolean }>('availability', {
    method: 'PUT',
    body: JSON.stringify({ slots }),
  })
}

export async function fetchServerRescheduleRequests() {
  return apiRequest<{ requests: unknown[] }>('reschedule-requests', { method: 'GET' })
}

export async function createServerRescheduleRequest(payload: Record<string, unknown>) {
  return apiRequest<{ id: string }>('reschedule-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateServerRescheduleRequest(payload: Record<string, unknown>) {
  return apiRequest<{ ok: boolean }>('reschedule-requests', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function fetchServerThread(requestId: string) {
  return apiRequest<{ messages: unknown[] }>(`inbox?requestId=${encodeURIComponent(requestId)}`, {
    method: 'GET',
  })
}

export async function addServerThreadMessage(payload: Record<string, unknown>) {
  return apiRequest<{ id: string }>('inbox', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

