import type { Role } from '../../state/session'

type SubjectChipProps = {
  label: string
  selected?: boolean
  disabled?: boolean
  removable?: boolean
  onClick?: () => void
  ariaLabel?: string
  role?: Role
}

export function SubjectChip({
  label,
  selected = false,
  disabled = false,
  removable = false,
  onClick,
  ariaLabel,
  role = 'student',
}: SubjectChipProps) {
  return (
    <button
      type="button"
      className={`subject-chip ${selected ? 'is-on' : ''}`}
      data-role={role}
      aria-pressed={selected}
      aria-label={ariaLabel ?? label}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="subject-chip-label">{label}</span>
      {removable && selected ? (
        <span aria-hidden="true" className="subject-chip-x">
          ×
        </span>
      ) : null}
    </button>
  )
}
