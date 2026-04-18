import type { ReactNode } from 'react'
import type { IconType } from './icons'

export function Stat({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: IconType
  label: string
  value: string
  hint?: string
  accent?: 'student' | 'parent' | 'tutor'
}) {
  const bg =
    accent === 'student'
      ? 'var(--student-soft)'
      : accent === 'parent'
        ? 'var(--parent-soft)'
        : accent === 'tutor'
          ? 'var(--tutor-soft)'
          : 'rgba(255,255,255,0.55)'

  return (
    <div className="stat">
      <div className="stat-icon" style={{ background: bg }}>
        {Icon({ size: 18 })}
      </div>
      <div className="stat-meta">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {hint ? <div className="stat-hint">{hint}</div> : null}
      </div>
    </div>
  )
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="section-title">
      <div>
        <h2 style={{ fontSize: 20 }}>{title}</h2>
        {subtitle ? (
          <p className="subtle" style={{ marginTop: 6 }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {right ? <div className="section-title-right">{right}</div> : null}
    </div>
  )
}

