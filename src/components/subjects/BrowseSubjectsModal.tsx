import type { Role } from '../../state/session'
import { Modal } from '../Modal'
import { SUBJECT_CATEGORIES } from './subjectCatalog'

type BrowseSubjectsModalProps = {
  open: boolean
  selected: string[]
  onToggle: (subject: string) => void
  onClose: () => void
  maxSelections: number
  role?: Role
}

export function BrowseSubjectsModal({
  open,
  selected,
  onToggle,
  onClose,
  maxSelections,
  role = 'student',
}: BrowseSubjectsModalProps) {
  const selectedSet = new Set(selected.map((s) => s.toLowerCase()))
  const atLimit = selected.length >= maxSelections

  return (
    <Modal open={open} title="Browse all subjects" onClose={onClose}>
      <div className="subject-browse" data-role={role}>
        <p className="muted" style={{ marginBottom: 12 }}>
          {selected.length}/{maxSelections} selected. Pick any subject across categories.
        </p>
        <div className="subject-browse-grid">
          {Object.entries(SUBJECT_CATEGORIES).map(([category, subjects]) => (
            <section key={category} className="subject-category">
              <h4 className="subject-category-title">{category}</h4>
              <div className="subject-category-items">
                {subjects.map((subject) => {
                  const isSelected = selectedSet.has(subject.toLowerCase())
                  const isDisabled = atLimit && !isSelected
                  return (
                    <label
                      key={subject}
                      className={`checkbox-row ${isSelected ? 'is-on' : ''} ${
                        isDisabled ? 'is-disabled' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => onToggle(subject)}
                      />
                      <span>{subject}</span>
                    </label>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  )
}
