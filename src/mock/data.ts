import type { Role } from '../state/session'

export type TutorProfile = {
  id: string
  name: string
  subjects: string[]
  level: 'Elementary' | 'JHS' | 'SHS' | 'College'
  mode: 'Online' | 'In-person' | 'Hybrid'
  hourlyRate: number
  classesCount: number
  city: string
  rating: number
  /** Weekly availability slots ("Mon:morning", "Tue:evening", ...). */
  availability: string[]
  yearsExperience?: string
  shortBio?: string
  credentials?: Array<{ id: string; title: string; fileName: string; url: string }>
}

export const tutorProfiles: TutorProfile[] = [
  {
    id: 't-1',
    name: 'A. Santos',
    subjects: ['Math', 'Algebra', 'Geometry'],
    level: 'JHS',
    mode: 'Online',
    hourlyRate: 350,
    classesCount: 88,
    city: 'Quezon City',
    rating: 4.8,
    yearsExperience: '5',
    shortBio: 'Math-focused tutor helping students build mastery and confidence.',
    credentials: [
      {
        id: 'c-t1-1',
        title: 'BS Mathematics Diploma',
        fileName: 'santos-bs-math.pdf',
        url: '#',
      },
    ],
    availability: [
      'Mon:evening',
      'Tue:evening',
      'Wed:afternoon',
      'Thu:evening',
      'Sat:morning',
      'Sat:afternoon',
    ],
  },
  {
    id: 't-2',
    name: 'M. Dela Cruz',
    subjects: ['English', 'Reading', 'Essay Writing'],
    level: 'SHS',
    mode: 'Hybrid',
    hourlyRate: 450,
    classesCount: 63,
    city: 'Manila',
    rating: 4.7,
    yearsExperience: '4',
    shortBio: 'English and writing tutor focused on clear structure and expression.',
    credentials: [
      {
        id: 'c-t2-1',
        title: 'Teaching Certificate',
        fileName: 'delacruz-teaching-cert.pdf',
        url: '#',
      },
    ],
    availability: [
      'Mon:afternoon',
      'Wed:afternoon',
      'Wed:evening',
      'Fri:evening',
      'Sat:morning',
    ],
  },
  {
    id: 't-3',
    name: 'J. Reyes',
    subjects: ['Science', 'Biology'],
    level: 'College',
    mode: 'Online',
    hourlyRate: 600,
    classesCount: 41,
    city: 'Cebu City',
    rating: 4.9,
    yearsExperience: '6',
    shortBio: 'Science tutor with strong coaching for biology and exam prep.',
    credentials: [
      {
        id: 'c-t3-1',
        title: 'BS Biology Diploma',
        fileName: 'reyes-biology-diploma.pdf',
        url: '#',
      },
    ],
    availability: [
      'Tue:morning',
      'Tue:afternoon',
      'Thu:morning',
      'Thu:afternoon',
      'Sun:morning',
    ],
  },
  {
    id: 't-4',
    name: 'L. Tan',
    subjects: ['Filipino', 'Araling Panlipunan'],
    level: 'JHS',
    mode: 'In-person',
    hourlyRate: 380,
    classesCount: 52,
    city: 'Quezon City',
    rating: 4.6,
    yearsExperience: '3',
    shortBio: 'Filipino and AP tutor focused on comprehension and critical thinking.',
    availability: ['Mon:afternoon', 'Wed:afternoon', 'Fri:afternoon'],
  },
  {
    id: 't-5',
    name: 'R. Villanueva',
    subjects: ['Chemistry', 'Physics', 'Gen. Science'],
    level: 'SHS',
    mode: 'Hybrid',
    hourlyRate: 520,
    classesCount: 71,
    city: 'Makati',
    rating: 4.8,
    yearsExperience: '7',
    shortBio: 'STEM tutor specializing in chemistry and physics for SHS learners.',
    availability: [
      'Mon:evening',
      'Wed:evening',
      'Fri:evening',
      'Sat:morning',
      'Sat:afternoon',
      'Sun:afternoon',
    ],
  },
]

export type StudentNeed = {
  id: string
  studentName: string
  subject: string
  level: TutorProfile['level']
  goal: string
  schedule: string
  city: string
}

export const studentNeeds: StudentNeed[] = [
  {
    id: 's-1',
    studentName: 'K. (Grade 8)',
    subject: 'Math',
    level: 'JHS',
    goal: 'Improve fundamentals + exam prep',
    schedule: 'Tue/Thu 6–7pm',
    city: 'Quezon City',
  },
  {
    id: 's-2',
    studentName: 'R. (Grade 11)',
    subject: 'English',
    level: 'SHS',
    goal: 'Essay structure and grammar',
    schedule: 'Sat 10–12',
    city: 'Manila',
  },
]

export type StudentSession = {
  id: string
  title: string
  tutorId: string
  when: string
  durationMins: number
  mode: TutorProfile['mode']
  status: 'Upcoming' | 'Completed' | 'Needs reschedule'
}

export type StudentTodo = {
  id: string
  title: string
  subject: string
  due: string
  status: 'To do' | 'In progress' | 'Done'
}

export const studentTutors = [
  { tutorId: 't-1', relationship: 'Primary tutor', since: 'Feb 2026' },
  { tutorId: 't-2', relationship: 'Writing coach', since: 'Mar 2026' },
] as const

export const studentSessions: StudentSession[] = [
  {
    id: 'ss-1',
    title: 'Math fundamentals — diagnostic + plan',
    tutorId: 't-1',
    when: 'Tue 6:00 PM',
    durationMins: 60,
    mode: 'Online',
    status: 'Upcoming',
  },
  {
    id: 'ss-2',
    title: 'Essay structure — thesis + outline',
    tutorId: 't-2',
    when: 'Sat 10:00 AM',
    durationMins: 90,
    mode: 'Hybrid',
    status: 'Upcoming',
  },
  {
    id: 'ss-3',
    title: 'Math practice — fractions and decimals',
    tutorId: 't-1',
    when: 'Last Thu',
    durationMins: 60,
    mode: 'Online',
    status: 'Completed',
  },
]

export const studentTodos: StudentTodo[] = [
  {
    id: 'td-1',
    title: 'Finish Algebra worksheet (Set A)',
    subject: 'Math',
    due: 'Tomorrow',
    status: 'To do',
  },
  {
    id: 'td-2',
    title: 'Write 1-paragraph thesis + 3 supporting points',
    subject: 'English',
    due: 'Fri',
    status: 'In progress',
  },
  {
    id: 'td-3',
    title: 'Review notes: fractions + decimals',
    subject: 'Math',
    due: 'Completed',
    status: 'Done',
  },
]

export type ParentChild = {
  name: string
  yearLevel: string
}

export const parentChild: ParentChild = {
  name: 'Joshua',
  yearLevel: 'Grade 8',
}

export const parentTutors = studentTutors
export const parentSessions = studentSessions
export const parentTodos = studentTodos

export type TutorClient = {
  id: string
  name: string
  yearLevel: string
  subjectFocus: string
  city: string
  status: 'Active' | 'Trial' | 'Paused'
}

export const tutorClients: TutorClient[] = [
  {
    id: 'c-1',
    name: 'K. (Grade 8)',
    yearLevel: 'Grade 8',
    subjectFocus: 'Math',
    city: 'Quezon City',
    status: 'Active',
  },
  {
    id: 'c-2',
    name: 'R. (Grade 11)',
    yearLevel: 'Grade 11',
    subjectFocus: 'English',
    city: 'Manila',
    status: 'Trial',
  },
]

export type TutorOffer = {
  id: string
  requestId: string
  toStudentName: string
  subject: string
  proposedRate: number
  availability: string
  status: 'Sent' | 'Accepted' | 'Declined' | 'Pending'
  sentAt: string
}

export const tutorOffers: TutorOffer[] = [
  {
    id: 'of-1',
    requestId: 's-1',
    toStudentName: 'K. (Grade 8)',
    subject: 'Math',
    proposedRate: 450,
    availability: 'Tue/Thu 6–8pm',
    status: 'Pending',
    sentAt: 'Today',
  },
]

export type TutorSession = {
  id: string
  withClientId: string
  subject: string
  when: string
  durationMins: number
  mode: TutorProfile['mode']
  status: 'Upcoming' | 'Completed'
}

export const tutorSessions: TutorSession[] = [
  {
    id: 'ts-1',
    withClientId: 'c-1',
    subject: 'Math',
    when: 'Tue 6:00 PM',
    durationMins: 60,
    mode: 'Online',
    status: 'Upcoming',
  },
  {
    id: 'ts-2',
    withClientId: 'c-2',
    subject: 'English',
    when: 'Sat 10:00 AM',
    durationMins: 90,
    mode: 'Hybrid',
    status: 'Upcoming',
  },
]

export function roleTitle(role: Role) {
  switch (role) {
    case 'student':
      return 'Student'
    case 'parent':
      return 'Parent'
    case 'tutor':
      return 'Tutor'
  }
}

