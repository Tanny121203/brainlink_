import type { ReactNode } from 'react'

export type IconProps = {
  size?: number
  className?: string
  strokeWidth?: number
}

type BaseProps = Required<Pick<IconProps, 'size' | 'strokeWidth'>> &
  Omit<IconProps, 'size' | 'strokeWidth'>

function Svg({
  size,
  className,
  strokeWidth,
  children,
}: BaseProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </g>
    </svg>
  )
}

export type IconType = (props: IconProps) => React.ReactNode

const defaults = (p: IconProps): BaseProps => ({
  size: p.size ?? 18,
  strokeWidth: p.strokeWidth ?? 2,
  className: p.className,
})

export const Icons = {
  ArrowLeft: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M15 18l-6-6 6-6" />
    </Svg>
  ),
  Dashboard: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M4 13h7V4H4v9z" />
      <path d="M13 20h7v-7h-7v7z" />
      <path d="M13 11h7V4h-7v7z" />
      <path d="M4 20h7v-5H4v5z" />
    </Svg>
  ),
  LogIn: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H4" />
      <path d="M20 4v16" />
    </Svg>
  ),
  LogOut: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M14 7l5 5-5 5" />
      <path d="M19 12H8" />
      <path d="M4 4v16" />
    </Svg>
  ),
  UserPlus: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </Svg>
  ),
  Sparkles: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M12 2l1.2 3.6L17 7l-3.8 1.4L12 12l-1.2-3.6L7 7l3.8-1.4L12 2z" />
      <path d="M5 12l.8 2.4L8 15l-2.2.6L5 18l-.8-2.4L2 15l2.2-.6L5 12z" />
      <path d="M19 13l.8 2.4L22 16l-2.2.6L19 19l-.8-2.4L16 16l2.2-.6L19 13z" />
    </Svg>
  ),
  Book: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M4 19a2 2 0 0 0 2 2h14" />
      <path d="M6 2h14v18H6a2 2 0 0 0-2 2V4a2 2 0 0 1 2-2z" />
    </Svg>
  ),
  Cap: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M22 10L12 4 2 10l10 6 10-6z" />
      <path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" />
    </Svg>
  ),
  Shield: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </Svg>
  ),
  Handshake: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M7 12l2-2a3 3 0 0 1 4 0l1 1" />
      <path d="M2 12l5 5 3-3" />
      <path d="M22 12l-5 5-3-3" />
      <path d="M9 14l2 2a2 2 0 0 0 3 0l3-3" />
    </Svg>
  ),
  Search: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
      <path d="M21 21l-4.3-4.3" />
    </Svg>
  ),
  Calendar: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M8 2v3" />
      <path d="M16 2v3" />
      <path d="M3 7h18" />
      <path d="M5 5h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M8 12h2" />
      <path d="M12 12h2" />
      <path d="M16 12h2" />
    </Svg>
  ),
  Filter: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </Svg>
  ),
  Mail: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M4 6h16v12H4V6z" />
      <path d="M4 7l8 6 8-6" />
    </Svg>
  ),
  Pin: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M12 22s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    </Svg>
  ),
  Message: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z" />
    </Svg>
  ),
  Send: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </Svg>
  ),
  Star: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M12 2l3 7 7 .5-5.3 4.4 1.8 7.1L12 17l-6.5 4 1.8-7.1L2 9.5 9 9l3-7z" />
    </Svg>
  ),
  Users: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M17 21v-1a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v1" />
      <path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      <path d="M23 21v-1a4 4 0 0 0-3-3.8" />
      <path d="M16 4a4 4 0 0 1 0 7.8" />
    </Svg>
  ),
  CheckBook: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M4 19a2 2 0 0 0 2 2h14" />
      <path d="M6 2h14v18H6a2 2 0 0 0-2 2V4a2 2 0 0 1 2-2z" />
      <path d="M9 11l2 2 4-4" />
    </Svg>
  ),
  Key: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M21 10l-4 4" />
      <path d="M7 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
      <path d="M17 14l-2-2" />
      <path d="M15 16l-2-2" />
      <path d="M21 10h-4l-2-2" />
    </Svg>
  ),
  User: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M20 21v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    </Svg>
  ),
  Building: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 9h1" />
      <path d="M9 12h1" />
      <path d="M9 15h1" />
      <path d="M14 9h1" />
      <path d="M14 12h1" />
      <path d="M14 15h1" />
    </Svg>
  ),
  Clipboard: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M9 5h6" />
      <path d="M9 3h6v4H9V3z" />
      <path d="M7 7h10v14H7V7z" />
    </Svg>
  ),
  Math: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M7 3h10" />
      <path d="M5 7h14" />
      <path d="M7 21h10" />
      <path d="M8 14l-2-2 2-2 2 2-2 2z" />
      <path d="M16 14l-2-2 2-2 2 2-2 2z" />
      <path d="M11 14l2-4" />
    </Svg>
  ),
  English: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M12 2L1 21h4l1.5-3H17L18.5 21H23L12 2z" />
      <path d="M7.8 15h8.4" />
      <path d="M9.5 12h5" />
    </Svg>
  ),
  Science: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M4.93 4.93l2.83 2.83" />
      <path d="M16.24 16.24l2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M4.93 19.07l2.83-2.83" />
      <path d="M16.24 7.76l2.83-2.83" />
      <path d="M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8z" />
    </Svg>
  ),
  Accounting: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M4 19V9" />
      <path d="M9 19V5" />
      <path d="M14 19v-7" />
      <path d="M19 19v-3" />
      <path d="M3 19h18" />
      <path d="M7 10h4" />
      <path d="M9 8v4" />
    </Svg>
  ),
  Language: (p: IconProps) => (
    <Svg {...defaults(p)}>
      <path d="M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0z" />
      <path d="M2 12h20" />
      <path d="M12 2a15 15 0 0 1 0 20" />
      <path d="M12 2a15 15 0 0 0 0 20" />
    </Svg>
  ),
} as const

