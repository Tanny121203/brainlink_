import { useState } from 'react'
import type { Role } from '../../state/session'
import { Icons } from '../icons'
import { BrowseSubjectsModal } from './BrowseSubjectsModal'
import { SearchBar } from './SearchBar'
import { SubjectChip } from './SubjectChip'
import { ALL_SUBJECTS, MAX_SELECTIONS, SUBJECT_CATEGORIES } from './subjectCatalog'

type SubjectPickerProps = {
  selected: string[]
  onChange: (next: string[]) => void
  maxSelections?: number
  role?: Role
}

export function SubjectPicker({
  selected,
  onChange,
  maxSelections = MAX_SELECTIONS,
  role = 'student',
}: SubjectPickerProps) {
  const [query, setQuery] = useState('')
  const [browseOpen, setBrowseOpen] = useState(false)

  const selectedLc = new Set(selected.map((s) => s.toLowerCase()))
  const atLimit = selected.length >= maxSelections

  function hasSubject(subject: string) {
    return selectedLc.has(subject.toLowerCase())
  }

  function addSubject(subject: string) {
    const trimmed = subject.trim()
    if (!trimmed) return
    if (hasSubject(trimmed)) return
    if (selected.length >= maxSelections) return
    onChange([...selected, trimmed])
  }

  function removeSubject(subject: string) {
    onChange(selected.filter((s) => s.toLowerCase() !== subject.toLowerCase()))
  }

  function toggleSubject(subject: string) {
    if (hasSubject(subject)) removeSubject(subject)
    else addSubject(subject)
  }

  return (
    <div className="subject-picker" data-role={role}>
      <div className="subject-search-row">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          onSelect={addSubject}
          allSubjects={ALL_SUBJECTS}
          excludedSubjects={selected}
          disabled={atLimit}
          placeholder={
            atLimit
              ? `Limit of ${maxSelections} reached`
              : 'Search subjects or type your own...'
          }
        />
        <button
          type="button"
          className="browse-cta"
          data-role={role}
          onClick={() => setBrowseOpen(true)}
        >
          <span className="browse-cta-icon">{Icons.Book({ size: 18 })}</span>
          <span className="browse-cta-text">
            <span className="browse-cta-title">Browse all</span>
            <span className="browse-cta-subtitle">
              {Object.keys(SUBJECT_CATEGORIES).length} categories
            </span>
          </span>
          <span className="browse-cta-arrow" aria-hidden="true">
            →
          </span>
        </button>
      </div>

      <div className="picker-section">
        <div className="picker-section-head">
          <h4 className="picker-section-title">
            Selected <span className="muted">({selected.length}/{maxSelections})</span>
          </h4>
        </div>
        {selected.length === 0 ? (
          <p className="muted">
            No subjects picked yet. Search above or browse all subjects.
          </p>
        ) : (
          <div className="subject-chip-row">
            {selected.map((subject) => (
              <SubjectChip
                key={subject}
                label={subject}
                selected
                removable
                role={role}
                ariaLabel={`Remove ${subject}`}
                onClick={() => removeSubject(subject)}
              />
            ))}
          </div>
        )}
      </div>

      <BrowseSubjectsModal
        open={browseOpen}
        selected={selected}
        onToggle={toggleSubject}
        onClose={() => setBrowseOpen(false)}
        maxSelections={maxSelections}
        role={role}
      />
    </div>
  )
}
