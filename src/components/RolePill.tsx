import type { Role } from '../state/session'

function roleMeta(role: Role) {
  switch (role) {
    case 'student':
      return { label: 'Student', soft: 'var(--student-soft)' }
    case 'parent':
      return { label: 'Parent', soft: 'var(--parent-soft)' }
    case 'tutor':
      return { label: 'Tutor', soft: 'var(--tutor-soft)' }
  }
}

export function RolePill({ role }: { role: Role }) {
  const meta = roleMeta(role)
  return (
    <span className="pill">
      <span className="pill-dot" style={{ background: meta.soft }} />
      {meta.label}
    </span>
  )
}

