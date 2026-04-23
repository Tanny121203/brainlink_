import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icons, type IconProps } from './icons'

export type OverflowMenuItem = {
  key: string
  label: string
  icon?: (p: IconProps) => ReactNode
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

type Props = {
  items: OverflowMenuItem[]
  label?: string
}

export function OverflowMenu({ items, label = 'More actions' }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return
      if (rootRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div className="overflow-menu" ref={rootRef}>
      <button
        type="button"
        className="btn overflow-menu-trigger"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {Icons.MoreHorizontal({ size: 16 })}
      </button>
      {open ? (
        <div className="overflow-menu-dropdown" role="menu" aria-label={label}>
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={`overflow-menu-item${
                item.destructive ? ' is-destructive' : ''
              }`}
              onClick={() => {
                setOpen(false)
                if (!item.disabled) item.onSelect()
              }}
            >
              {item.icon ? (
                <span className="overflow-menu-item-icon" aria-hidden="true">
                  {item.icon({ size: 16 })}
                </span>
              ) : null}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
