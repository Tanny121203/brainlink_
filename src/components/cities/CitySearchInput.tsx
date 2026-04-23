import { useEffect, useMemo, useRef, useState } from 'react'
import { Icons } from '../icons'
import { PHILIPPINE_CITIES } from './cityCatalog'

type CitySearchInputProps = {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  options?: string[]
  allowCustom?: boolean
}

type Row =
  | { kind: 'match'; value: string }
  | { kind: 'custom'; value: string }

export function CitySearchInput({
  value,
  onChange,
  placeholder = 'Search city...',
  options = PHILIPPINE_CITIES,
  allowCustom = true,
}: CitySearchInputProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [focused, setFocused] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const rows = useMemo<Row[]>(() => {
    const trimmed = value.trim()
    const q = trimmed.toLowerCase()
    if (!q) return []
    const matches = options
      .filter((c) => c.toLowerCase().includes(q))
      .slice(0, 6)
    const exactInCatalog = options.some((c) => c.toLowerCase() === q)
    const list: Row[] = matches.map((v) => ({ kind: 'match', value: v }))
    if (allowCustom && !exactInCatalog) {
      list.push({ kind: 'custom', value: trimmed })
    }
    return list
  }, [value, options, allowCustom])

  const showSuggestions = focused && rows.length > 0

  useEffect(() => {
    setHighlight(0)
  }, [value])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function commit(next: string) {
    onChange(next)
    setFocused(false)
  }

  function clear() {
    onChange('')
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions) {
      if (e.key === 'Enter' && value.trim()) {
        e.preventDefault()
        commit(value.trim())
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
      else if (value.trim()) commit(value.trim())
    } else if (e.key === 'Escape') {
      setFocused(false)
    }
  }

  const hasValue = value.trim().length > 0

  return (
    <div className="search-combo" ref={wrapRef}>
      <div className="input-group">
        <span className="input-icon">{Icons.Pin({ size: 16 })}</span>
        <input
          type="text"
          className={`input with-icon ${hasValue ? 'with-clear' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="city-suggestions"
          role="combobox"
        />
        {hasValue ? (
          <button
            type="button"
            className="input-clear"
            onClick={clear}
            aria-label="Clear city"
            title="Clear"
          >
            ×
          </button>
        ) : null}
      </div>
      {showSuggestions ? (
        <ul
          id="city-suggestions"
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
                  <span className="search-suggestion-hint">Select</span>
                </>
              ) : (
                <>
                  <span>
                    <span className="search-suggestion-plus" aria-hidden="true">
                      +
                    </span>
                    Use &ldquo;{row.value}&rdquo; as city
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
