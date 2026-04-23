export const SUBJECT_CATEGORIES: Record<string, string[]> = {
  Math: ['Mathematics', 'Algebra', 'Geometry', 'Calculus', 'Statistics'],
  Science: ['Biology', 'Chemistry', 'Physics', 'Earth Science'],
  Technology: ['Programming', 'Artificial Intelligence', 'Data Science', 'Web Development'],
  Languages: ['English', 'Filipino', 'Reading', 'Writing'],
  Humanities: ['History', 'Social Studies', 'Values Education'],
  Business: ['Business', 'Accounting', 'Economics', 'Finance'],
}

export const ALL_SUBJECTS: string[] = Array.from(
  new Set(Object.values(SUBJECT_CATEGORIES).flat())
)

export const MAX_SELECTIONS = 5
