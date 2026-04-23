import { useEffect, useMemo, useRef, useState } from 'react'
import { Icons } from '../icons'

type SearchBarProps = {
  query: string
  onQueryChange: (next: string) => void
  onSelect: (subject: string) => void
  allSubjects: string[]
  excludedSubjects: string[]
  disabled?: boolean
  placeholder?: string
}

export function SearchBar({
  query,
  onQueryChange,
  onSelect,
  allSubjects,
  excludedSubjects,
  disabled = false,
  placeholder = 'Search subjects...',
}: SearchBarProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [focused, setFocused] = useState(false)
  const [highlight, setHighlight] = useState(0)

  type Row =
    | { kind: 'match'; value: string }
    | { kind: 'custom'; value: string }

  const rows = useMemo<Row[]>(() => {
    const trimmed = query.trim()
    const q = trimmed.toLowerCase()
    if (!q) return []
    const excluded = new Set(excludedSubjects.map((s) => s.toLowerCase()))
    const matches = allSubjects
      .filter((s) => !excluded.has(s.toLowerCase()) && s.toLowerCase().includes(q))
      .slice(0, 6)
    const exactInCatalog = allSubjects.some((s) => s.toLowerCase() === q)
    const alreadySelected = excluded.has(q)
    const list: Row[] = matches.map((v) => ({ kind: 'match', value: v }))
    if (!exactInCatalog && !alreadySelected) {
      list.push({ kind: 'custom', value: trimmed })
    }
    return list
  }, [query, allSubjects, excludedSubjects])

  const showSuggestions = focused && rows.length > 0

  useEffect(() => {
    setHighlight(0)
  }, [query])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function commit(subject: string) {
    onSelect(subject)
    onQueryChange('')
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions) {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault()
        commit(query.trim())
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, rows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const picked = rows[highlight] ?? rows[0]
      if (picked) commit(picked.value)
      else if (query.trim()) commit(query.trim())
    } else if (e.key === 'Escape') {
      setFocused(false)
    }
  }

  return (
    <div className="search-combo" ref={wrapRef}>
      <div className="input-group">
        <span className="input-icon">{Icons.Search({ size: 16 })}</span>
        <input
          className="input with-icon"
          type="text"
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="subject-suggestions"
          role="combobox"
        />
      </div>
      {showSuggestions ? (
        <ul
          id="subject-suggestions"
          role="listbox"
          className="search-suggestions"
        >
          {rows.map((row, i) => (
            <li
              key={`${row.kind}:${row.value}`}
              role="option"
              aria-selected={i === highlight}
              className={`search-suggestion ${
                i === highlight ? 'is-active' : ''
              } ${row.kind === 'custom' ? 'is-custom' : ''}`}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                commit(row.value)
              }}
            >
              {row.kind === 'match' ? (
                <>
                  <span>{row.value}</span>
                  <span className="search-suggestion-hint">Add</span>
                </>
              ) : (
                <>
                  <span>
                    <span className="search-suggestion-plus" aria-hidden="true">
                      +
                    </span>
                    Add &ldquo;{row.value}&rdquo; as custom subject
                  </span>
                  <span className="search-suggestion-hint">Custom</span>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
