export const AVAILABILITY_DAYS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
] as const

export type AvailabilityDay = (typeof AVAILABILITY_DAYS)[number]

export const AVAILABILITY_SLOTS = [
  { key: 'morning', label: 'Morning', range: '8–12' },
  { key: 'afternoon', label: 'Afternoon', range: '12–5' },
  { key: 'evening', label: 'Evening', range: '5–9' },
] as const

export type AvailabilitySlotKey = (typeof AVAILABILITY_SLOTS)[number]['key']

export type Availability = Set<string>

export function slotKey(day: AvailabilityDay, slot: AvailabilitySlotKey): string {
  return `${day}:${slot}`
}

export function createAvailability(initial: string[] = []): Availability {
  return new Set(initial)
}

export function toggleSlot(
  av: Availability,
  day: AvailabilityDay,
  slot: AvailabilitySlotKey
): Availability {
  const key = slotKey(day, slot)
  const next = new Set(av)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}

export function isSlotFree(
  av: Availability,
  day: AvailabilityDay,
  slot: AvailabilitySlotKey
): boolean {
  return av.has(slotKey(day, slot))
}

export function countFreeSlots(av: Availability): number {
  return av.size
}

export function summarizeAvailability(av: Availability): string {
  const count = countFreeSlots(av)
  const total = AVAILABILITY_DAYS.length * AVAILABILITY_SLOTS.length
  if (count === 0) return 'No slots marked'
  if (count === total) return 'Available every slot'
  return `${count} of ${total} slots open`
}

const STORAGE_PREFIX = 'brainlink.availability.v1.'

export function loadAvailabilityFor(ownerId: string): Availability {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + ownerId)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return new Set(parsed as string[])
    return new Set()
  } catch {
    return new Set()
  }
}

export function saveAvailabilityFor(ownerId: string, av: Availability) {
  try {
    localStorage.setItem(STORAGE_PREFIX + ownerId, JSON.stringify(Array.from(av)))
  } catch {
    /* ignore */
  }
}
