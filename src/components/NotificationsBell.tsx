import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icons } from './icons'
import type { Role } from '../state/session'
import {
  formatRelativeTime,
  getReadIds,
  markAllRead,
  markRead,
  notificationsForRole,
  type Notification,
} from '../state/notifications'

export function NotificationsBell({ role }: { role: Role }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds())
  const rootRef = useRef<HTMLDivElement | null>(null)

  const items = useMemo(
    () => [...notificationsForRole(role)].sort((a, b) => b.createdAt - a.createdAt),
    [role]
  )

  const unreadCount = useMemo(
    () => items.filter((n) => !readIds.has(n.id)).length,
    [items, readIds]
  )

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

  function onItemClick(n: Notification) {
    if (!readIds.has(n.id)) {
      markRead(n.id)
      setReadIds(new Set(getReadIds()))
    }
    if (n.kind === 'message') navigate('/app/messages')
    else if (n.kind === 'session') navigate('/app')
    else if (n.kind === 'offer') navigate('/app/messages')
    else navigate('/app')
    setOpen(false)
  }

  function onMarkAll() {
    markAllRead(role)
    setReadIds(new Set(getReadIds()))
  }

  return (
    <div className="notif-root" ref={rootRef}>
      <button
        type="button"
        className={`btn notif-trigger${unreadCount > 0 ? ' has-unread' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {Icons.Bell({ size: 16 })}
        {unreadCount > 0 ? (
          <span className="notif-badge" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="notif-dropdown" role="menu" aria-label="Notifications">
          <div className="notif-header">
            <span className="notif-header-title">Notifications</span>
            {items.length > 0 && unreadCount > 0 ? (
              <button className="link-btn" onClick={onMarkAll} type="button">
                Mark all read
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className="notif-empty">
              <div className="notif-empty-icon">{Icons.BellOff({ size: 18 })}</div>
              <div style={{ fontWeight: 600 }}>You’re all caught up</div>
              <div className="muted" style={{ marginTop: 4 }}>
                No notifications right now.
              </div>
            </div>
          ) : (
            <div className="notif-list">
              {items.map((n) => {
                const unread = !readIds.has(n.id)
                return (
                  <button
                    key={n.id}
                    className={`notif-item${unread ? ' is-unread' : ''}`}
                    onClick={() => onItemClick(n)}
                    type="button"
                  >
                    <span className={`notif-item-icon kind-${n.kind}`} aria-hidden="true">
                      {n.kind === 'message'
                        ? Icons.Message({ size: 14 })
                        : n.kind === 'session'
                          ? Icons.Calendar({ size: 14 })
                          : n.kind === 'offer'
                            ? Icons.Send({ size: 14 })
                            : Icons.Users({ size: 14 })}
                    </span>
                    <span className="notif-item-body">
                      <span className="notif-item-title">{n.title}</span>
                      <span className="notif-item-text">{n.text}</span>
                      <span className="notif-item-time">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </span>
                    {unread ? <span className="notif-item-dot" aria-hidden="true" /> : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
