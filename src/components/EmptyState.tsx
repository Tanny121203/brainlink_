import type { ReactNode } from 'react'
import type { IconProps } from './icons'

type Props = {
  icon?: (p: IconProps) => ReactNode
  title: string
  body?: ReactNode
  action?: ReactNode
  compact?: boolean
}

export function EmptyState({ icon, title, body, action, compact }: Props) {
  return (
    <div className={`empty-state${compact ? ' empty-state-compact' : ''}`}>
      {icon ? (
        <div className="empty-state-icon" aria-hidden="true">
          {icon({ size: compact ? 18 : 22 })}
        </div>
      ) : null}
      <div className="empty-state-title">{title}</div>
      {body ? <div className="empty-state-body">{body}</div> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  )
}
