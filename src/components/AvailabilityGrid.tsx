import { Icons } from './icons'
import {
  AVAILABILITY_DAYS,
  AVAILABILITY_SLOTS,
  isSlotFree,
  slotKey,
  summarizeAvailability,
  type Availability,
  type AvailabilityDay,
  type AvailabilitySlotKey,
} from '../state/availability'

type Props = {
  availability: Availability
  editable?: boolean
  compact?: boolean
  onToggle?: (day: AvailabilityDay, slot: AvailabilitySlotKey) => void
  title?: string
  showSummary?: boolean
}

export function AvailabilityGrid({
  availability,
  editable = false,
  compact = false,
  onToggle,
  title = 'Weekly availability',
  showSummary = true,
}: Props) {
  const variantClass = compact ? 'availability-compact' : 'availability-full'

  return (
    <div className="availability-strip">
      <div className="availability-strip-head">
        <span className="availability-strip-title">
          {Icons.Calendar({ size: 12 })}
          {title}
        </span>
        {showSummary ? (
          <span className="availability-strip-summary">
            {summarizeAvailability(availability)}
          </span>
        ) : null}
      </div>
      <div
        className={`availability-grid ${variantClass}${editable ? ' is-editable' : ''}`}
        role={editable ? 'grid' : undefined}
      >
        <div className="availability-corner" aria-hidden="true" />
        {AVAILABILITY_DAYS.map((d) => (
          <div key={d} className="availability-day-head">
            {d}
          </div>
        ))}

        {AVAILABILITY_SLOTS.map((slot) => (
          <Row
            key={slot.key}
            slot={slot}
            availability={availability}
            editable={editable}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
}

function Row({
  slot,
  availability,
  editable,
  onToggle,
}: {
  slot: (typeof AVAILABILITY_SLOTS)[number]
  availability: Availability
  editable: boolean
  onToggle?: (day: AvailabilityDay, slotKey: AvailabilitySlotKey) => void
}) {
  return (
    <>
      <div className="availability-slot-head">
        <span className="availability-slot-label">{slot.label}</span>
        <span className="availability-slot-range">{slot.range}</span>
      </div>
      {AVAILABILITY_DAYS.map((d) => {
        const free = isSlotFree(availability, d, slot.key)
        const key = slotKey(d, slot.key)
        const cellProps = {
          className: `availability-cell${free ? ' is-free' : ''}`,
          'aria-label': `${d} ${slot.label}: ${free ? 'available' : 'not available'}`,
        }
        if (editable) {
          return (
            <button
              key={key}
              type="button"
              {...cellProps}
              onClick={() => onToggle?.(d, slot.key)}
            >
              <span className="availability-cell-dot" aria-hidden="true" />
            </button>
          )
        }
        return (
          <div key={key} {...cellProps}>
            <span className="availability-cell-dot" aria-hidden="true" />
          </div>
        )
      })}
    </>
  )
}
