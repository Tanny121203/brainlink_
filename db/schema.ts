import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: varchar('id', { length: 40 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: varchar('display_name', { length: 120 }).notNull(),
  role: varchar('role', { length: 16 }).notNull(),
  profile: jsonb('profile').$type<Record<string, unknown> | null>().default(null),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 40 }).primaryKey(),
  userId: varchar('user_id', { length: 40 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenId: varchar('token_id', { length: 40 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const tutorAvailability = pgTable(
  'tutor_availability',
  {
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    slotKey: varchar('slot_key', { length: 20 }).notNull(),
    isOpen: boolean('is_open').notNull().default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.ownerEmail, table.slotKey] })]
)

export const learningSessions = pgTable('learning_sessions', {
  id: varchar('id', { length: 40 }).primaryKey(),
  tutorId: varchar('tutor_id', { length: 64 }).notNull(),
  tutorName: varchar('tutor_name', { length: 120 }).notNull(),
  subject: varchar('subject', { length: 120 }).notNull(),
  whenIso: text('when_iso').notNull(),
  durationMins: integer('duration_mins').notNull(),
  mode: varchar('mode', { length: 16 }).notNull(),
  status: varchar('status', { length: 40 }).notNull(),
  bookedByEmail: varchar('booked_by_email', { length: 255 }).notNull(),
  bookedForRole: varchar('booked_for_role', { length: 16 }).notNull(),
  hiddenFromUi: boolean('hidden_from_ui').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const rescheduleRequests = pgTable('reschedule_requests', {
  id: varchar('id', { length: 40 }).primaryKey(),
  sessionId: varchar('session_id', { length: 40 }).notNull(),
  tutorId: varchar('tutor_id', { length: 64 }).notNull(),
  requesterEmail: varchar('requester_email', { length: 255 }).notNull(),
  requesterName: varchar('requester_name', { length: 120 }).notNull(),
  originalWhen: text('original_when').notNull(),
  requestedWhen: text('requested_when').notNull(),
  note: text('note'),
  status: varchar('status', { length: 32 }).notNull().default('Pending'),
  counterWhen: text('counter_when'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sharedMessages = pgTable('shared_messages', {
  id: varchar('id', { length: 40 }).primaryKey(),
  requestId: varchar('request_id', { length: 64 }).notNull(),
  kind: varchar('kind', { length: 24 }).notNull(),
  fromRole: varchar('from_role', { length: 16 }).notNull(),
  fromDisplayName: varchar('from_display_name', { length: 120 }).notNull(),
  fromEmail: varchar('from_email', { length: 255 }).notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
})

export const reviews = pgTable('reviews', {
  id: varchar('id', { length: 40 }).primaryKey(),
  tutorId: varchar('tutor_id', { length: 64 }).notNull(),
  rating: integer('rating').notNull(),
  text: text('text').notNull(),
  authorName: varchar('author_name', { length: 120 }).notNull(),
  authorEmail: varchar('author_email', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const notificationReads = pgTable(
  'notification_reads',
  {
    userEmail: varchar('user_email', { length: 255 }).notNull(),
    notificationId: varchar('notification_id', { length: 64 }).notNull(),
    readAt: timestamp('read_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userEmail, table.notificationId] })]
)

