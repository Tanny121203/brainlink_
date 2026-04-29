import type { ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BellOff,
  BookCheck,
  BookOpen,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Filter,
  FlaskConical,
  Globe2,
  GraduationCap,
  Handshake,
  KeyRound,
  Languages,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  User,
  UserPlus,
  Users,
  X,
  Calculator,
  Trash2,
  type LucideIcon,
} from 'lucide-react'

export type IconProps = {
  size?: number
  className?: string
  strokeWidth?: number
}

export type IconType = (props: IconProps) => ReactNode

const renderIcon = (IconComponent: LucideIcon, props: IconProps) => (
  <IconComponent
    size={props.size ?? 18}
    strokeWidth={props.strokeWidth ?? 2}
    className={props.className}
    aria-hidden="true"
  />
)

export const Icons = {
  ArrowLeft: (p: IconProps) => renderIcon(ArrowLeft, p),
  Dashboard: (p: IconProps) => renderIcon(BarChart3, p),
  LogIn: (p: IconProps) => renderIcon(LogIn, p),
  LogOut: (p: IconProps) => renderIcon(LogOut, p),
  UserPlus: (p: IconProps) => renderIcon(UserPlus, p),
  Sparkles: (p: IconProps) => renderIcon(Sparkles, p),
  Book: (p: IconProps) => renderIcon(BookOpen, p),
  Cap: (p: IconProps) => renderIcon(GraduationCap, p),
  Shield: (p: IconProps) => renderIcon(ShieldCheck, p),
  Handshake: (p: IconProps) => renderIcon(Handshake, p),
  Search: (p: IconProps) => renderIcon(Search, p),
  Calendar: (p: IconProps) => renderIcon(CalendarDays, p),
  Filter: (p: IconProps) => renderIcon(Filter, p),
  Mail: (p: IconProps) => renderIcon(Mail, p),
  Pin: (p: IconProps) => renderIcon(MapPin, p),
  Message: (p: IconProps) => renderIcon(MessageSquare, p),
  Send: (p: IconProps) => renderIcon(Send, p),
  Star: (p: IconProps) => renderIcon(Star, p),
  Users: (p: IconProps) => renderIcon(Users, p),
  CheckBook: (p: IconProps) => renderIcon(BookCheck, p),
  Key: (p: IconProps) => renderIcon(KeyRound, p),
  User: (p: IconProps) => renderIcon(User, p),
  Building: (p: IconProps) => renderIcon(Building2, p),
  Clipboard: (p: IconProps) => renderIcon(ClipboardList, p),
  Math: (p: IconProps) => renderIcon(Calculator, p),
  English: (p: IconProps) => renderIcon(Languages, p),
  Science: (p: IconProps) => renderIcon(FlaskConical, p),
  Accounting: (p: IconProps) => renderIcon(BarChart3, p),
  Language: (p: IconProps) => renderIcon(Globe2, p),
  Close: (p: IconProps) => renderIcon(X, p),
  Camera: (p: IconProps) => renderIcon(Camera, p),
  Trash: (p: IconProps) => renderIcon(Trash2, p),
  Bell: (p: IconProps) => renderIcon(Bell, p),
  BellOff: (p: IconProps) => renderIcon(BellOff, p),
  CheckCircle: (p: IconProps) => renderIcon(CheckCircle2, p),
  MoreHorizontal: (p: IconProps) => renderIcon(MoreHorizontal, p),
  Sun: (p: IconProps) => renderIcon(Sun, p),
  Moon: (p: IconProps) => renderIcon(Moon, p),
  ChevronRight: (p: IconProps) => renderIcon(ChevronRight, p),
  ArrowRight: (p: IconProps) => renderIcon(ArrowRight, p),
} as const

