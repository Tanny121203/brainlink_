export type Review = {
  id: string
  tutorId: string
  rating: 1 | 2 | 3 | 4 | 5
  text: string
  authorName: string
  authorEmail: string
  createdAt: number
}

export type TutorRatingSummary = {
  count: number
  average: number
}

const STORAGE_KEY = 'brainlink.reviews.v1'

type ReviewStore = Record<string, Review[]>

function loadStore(): ReviewStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as ReviewStore
    return {}
  } catch {
    return {}
  }
}

function saveStore(store: ReviewStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* ignore */
  }
}

export function getReviewsForTutor(tutorId: string): Review[] {
  const store = loadStore()
  return [...(store[tutorId] ?? [])].sort((a, b) => b.createdAt - a.createdAt)
}

export function addReview(review: Omit<Review, 'id' | 'createdAt'>): Review {
  const store = loadStore()
  const list = store[review.tutorId] ?? []
  const newReview: Review = {
    ...review,
    id: 'r-' + Math.random().toString(36).slice(2, 10),
    createdAt: Date.now(),
  }
  store[review.tutorId] = [newReview, ...list]
  saveStore(store)
  return newReview
}

export function getTutorRatingSummary(tutorId: string): TutorRatingSummary {
  const reviews = getReviewsForTutor(tutorId)
  if (reviews.length === 0) return { count: 0, average: 0 }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return {
    count: reviews.length,
    average: Math.round((sum / reviews.length) * 10) / 10,
  }
}
