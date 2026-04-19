/** Prototype session notes — structured post-session summaries (separate from chat). */
export type SessionNote = {
  id: string
  dateLabel: string
  subject: string
  sessionTitle: string
  tutorName: string
  studentLabel: string
  summary: string
  nextSteps: string[]
}

export const sessionNotesMock: SessionNote[] = [
  {
    id: 'note-1',
    dateLabel: 'Thu, Apr 17, 2026',
    subject: 'Math',
    sessionTitle: 'Math fundamentals — diagnostic + plan',
    tutorName: 'A. Santos',
    studentLabel: 'K. (Grade 8)',
    summary:
      'We mapped strengths in arithmetic and gaps in fraction ↔ decimal conversion. You solved most practice items independently; we’ll tighten word-problem setup next.',
    nextSteps: [
      'Complete Practice Set A (items 1–8)',
      'Bring one problem you got stuck on (a photo is fine)',
    ],
  },
  {
    id: 'note-2',
    dateLabel: 'Sat, Apr 12, 2026',
    subject: 'English',
    sessionTitle: 'Essay structure — thesis + outline',
    tutorName: 'M. Dela Cruz',
    studentLabel: 'R. (Grade 11)',
    summary:
      'Draft thesis is clear. Body paragraphs need explicit topic sentences that tie back to the thesis—we outlined two paragraphs and a revision checklist.',
    nextSteps: [
      'Revise thesis to one sentence',
      'Add topic sentence + one quote per body paragraph',
    ],
  },
  {
    id: 'note-3',
    dateLabel: 'Tue, Apr 8, 2026',
    subject: 'Math',
    sessionTitle: 'Algebra practice — linear equations',
    tutorName: 'A. Santos',
    studentLabel: 'K. (Grade 8)',
    summary:
      'Strong improvement on isolating variables. We spent extra time on distributing negatives—use the “double line” trick we drew in session.',
    nextSteps: ['Review worksheet p. 12–13', 'Quick 5-problem check at start of next session'],
  },
]
