import type { SharedThreadMessage, SharedTutorNoteMessage } from '../state/inbox'

/** Threads that always show sample learner-facing notes for the student role (prototype). */
export const STUDENT_DEMO_THREAD_IDS = ['s-1', 's-2'] as const

const MOCK_TUTOR_NOTES: Record<string, SharedTutorNoteMessage[]> = {
  's-1': [
    {
      kind: 'tutor_note',
      id: 'mock-stu-s1-note-1',
      requestId: 's-1',
      sentAtIso: '2026-04-18T14:30:00.000Z',
      fromRole: 'tutor',
      fromDisplayName: 'A. Santos',
      fromEmail: 'mock.tutor.math@brainlink.local',
      subject: 'Math',
      headline: 'Before our next session',
      text: 'Hi! Please finish Practice Set A (items 1–8) on fractions. Bring one problem you found tricky so we can work through it together. If you get stuck, jot where you stopped—that counts as good work too.',
    },
    {
      kind: 'tutor_note',
      id: 'mock-stu-s1-note-2',
      requestId: 's-1',
      sentAtIso: '2026-04-19T09:15:00.000Z',
      fromRole: 'tutor',
      fromDisplayName: 'A. Santos',
      fromEmail: 'mock.tutor.math@brainlink.local',
      subject: 'Math',
      headline: 'Quick win',
      text: 'Nice job on yesterday’s worksheet snapshot you sent. Next time we’ll connect that to the word problems in section 3—no need to redo the whole page, just star two questions to review.',
    },
  ],
  's-2': [
    {
      kind: 'tutor_note',
      id: 'mock-stu-s2-note-1',
      requestId: 's-2',
      sentAtIso: '2026-04-17T16:00:00.000Z',
      fromRole: 'tutor',
      fromDisplayName: 'M. Dela Cruz',
      fromEmail: 'mock.tutor.english@brainlink.local',
      subject: 'English',
      headline: 'Essay draft',
      text: 'For Friday, bring a rough thesis + three bullet points for body paragraphs (doesn’t have to be polished). We’ll tighten the thesis and check that each paragraph actually supports it.',
    },
  ],
}

export function getMockStudentTutorNotes(requestId: string): SharedTutorNoteMessage[] {
  return MOCK_TUTOR_NOTES[requestId] ?? []
}

export function mergeStudentThreadTimeline(
  stored: SharedThreadMessage[],
  requestId: string
): SharedThreadMessage[] {
  const mock = getMockStudentTutorNotes(requestId)
  return [...stored, ...mock].sort((a, b) => a.sentAtIso.localeCompare(b.sentAtIso))
}
