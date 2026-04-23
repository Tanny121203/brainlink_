import { useEffect, useSyncExternalStore } from 'react'
import { Icons } from './icons'

export type ToastKind = 'info' | 'success' | 'error'

export type ToastItem = {
  id: string
  kind: ToastKind
  message: string
  ttl: number
}

let toasts: ToastItem[] = []
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

function getSnapshot() {
  return toasts
}

function nextId() {
  return 'toast-' + Math.random().toString(36).slice(2, 9)
}

function push(kind: ToastKind, message: string, ttl = 3500) {
  const item: ToastItem = { id: nextId(), kind, message, ttl }
  toasts = [...toasts, item]
  emit()
  if (ttl > 0) {
    setTimeout(() => dismiss(item.id), ttl)
  }
  return item.id
}

function dismiss(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export const toast = {
  info: (message: string, ttl?: number) => push('info', message, ttl),
  success: (message: string, ttl?: number) => push('success', message, ttl),
  error: (message: string, ttl?: number) => push('error', message, ttl),
  dismiss,
}

function ToastIcon({ kind }: { kind: ToastKind }) {
  if (kind === 'success') return Icons.CheckCircle({ size: 16 })
  if (kind === 'error') return Icons.Close({ size: 16 })
  return Icons.Bell({ size: 16 })
}

export function Toaster() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  if (items.length === 0) return null
  return (
    <div className="toaster" role="region" aria-live="polite" aria-label="Notifications">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          <span className="toast-icon" aria-hidden="true">
            <ToastIcon kind={t.kind} />
          </span>
          <span className="toast-message">{t.message}</span>
          <button
            type="button"
            className="toast-close"
            aria-label="Dismiss notification"
            onClick={() => dismiss(t.id)}
          >
            {Icons.Close({ size: 14 })}
          </button>
        </div>
      ))}
    </div>
  )
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    if (!title) return
    const prev = document.title
    document.title = title
    return () => {
      document.title = prev
    }
  }, [title])
}
