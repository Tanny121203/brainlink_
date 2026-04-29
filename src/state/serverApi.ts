import { apiRequest } from '../lib/api'
import type { ChildProfile } from './session'

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

export type SessionNote = {
  id: string
  session_id: string
  request_id: string
  tutor_email: string
  tutor_display_name: string
  student_name: string
  subject: string
  headline: string
  summary: string
  next_steps: string[]
  visibility: string
  sent_at: string
  updated_at: string
}

export async function fetchServerSessionNotes(requestId: string) {
  return apiRequest<{ notes: SessionNote[] }>(
    `session-notes?requestId=${encodeURIComponent(requestId)}`,
    { method: 'GET' }
  )
}

export async function createServerSessionNote(payload: {
  sessionId: string
  requestId: string
  tutorDisplayName: string
  studentName: string
  subject: string
  headline: string
  summary: string
  nextSteps: string[]
  visibility?: 'student' | 'parent' | 'both'
}) {
  return apiRequest<{ id: string }>('session-notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchServerChildren() {
  return apiRequest<{ children: ChildProfile[] }>('children', { method: 'GET' })
}

export async function createServerChild(payload: Omit<ChildProfile, 'id'>) {
  return apiRequest<{ id: string }>('children', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateServerChild(payload: ChildProfile) {
  return apiRequest<{ ok: boolean }>('children', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteServerChild(id: string) {
  return apiRequest<{ ok: boolean }>(`children?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export type ServerTutor = {
  id: string
  name: string
  email: string
  subjects: string[]
  level?: 'Elementary' | 'JHS' | 'SHS' | 'College'
  mode?: 'Online' | 'In-person' | 'Hybrid'
  hourlyRate?: number
  rating?: number
  availability?: string[]
  city: string
  yearsExperience: string
  shortBio: string
  photoDataUrl?: string
  credentials: Array<{
    id: string
    fileName: string
    mimeType: string
    sizeBytes: number
    uploadedAtIso: string
    dataUrl?: string
  }>
}

export async function fetchServerTutors() {
  return apiRequest<{ tutors: ServerTutor[] }>('tutors', { method: 'GET' })
}

export async function fetchServerTutorCredentialData(credentialId: string) {
  return apiRequest<{ id: string; dataUrl: string; mimeType: string }>(
    `tutor-credential?id=${encodeURIComponent(credentialId)}`,
    { method: 'GET' }
  )
}

export async function updateServerTutorProfile(payload: {
  profile: {
    subjects: string
    yearsExperience: string
    city?: string
    shortBio?: string
    photoDataUrl?: string
  }
  newCredentials: Array<{
    fileName: string
    mimeType: string
    sizeBytes: number
    uploadedAtIso: string
    dataUrl: string
  }>
}) {
  return apiRequest<{
    ok: boolean
    profile: {
      subjects: string
      yearsExperience: string
      city?: string
      shortBio?: string
      photoDataUrl?: string
      credentials?: ServerTutor['credentials']
    }
  }>('tutors', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

