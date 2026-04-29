# BrainLink API Contracts (Netlify Functions)

Base URL (deployed): `/.netlify/functions`

## Auth

### `POST /auth-register`
- Body:
  - `role`: `'student' | 'parent' | 'tutor'`
  - `email`: string
  - `displayName`: string
  - `password`: string
  - `profile`: object (optional)
- Returns: `{ session: { role, email, displayName, profile? } }`
- Side effect: sets HttpOnly `brainlink_token` cookie.

### `POST /auth-login`
- Body: `{ role, email, password }`
- Returns: `{ session }`
- Side effect: sets HttpOnly `brainlink_token` cookie.

### `GET /auth-me`
- Auth: cookie required.
- Returns: `{ session }`
- For parent accounts, `session.profile.children` is included when available.

### `POST /auth-logout`
- Auth: optional.
- Returns: `{ ok: true }`
- Side effect: clears `brainlink_token` cookie.

## Sessions

### `GET /sessions`
- Auth: required.
- Returns: `{ sessions: SessionRow[] }` for current signed-in email.

### `POST /sessions`
- Auth: required.
- Body:
  - `tutorId`, `tutorName`, `subject`, `when`, `durationMins`, `mode`, `status`
- Returns: `{ id }`

### `PATCH /sessions`
- Auth: required.
- Body: `{ id, status?, when?, durationMins?, mode?, hiddenFromUi? }`
- Returns: `{ ok: true }`

## Availability

### `GET /availability`
- Auth: required.
- Returns: `{ slots: string[] }`

### `PUT /availability`
- Auth: required.
- Body: `{ slots: string[] }`
- Returns: `{ ok: true }`

## Reschedule Requests

### `GET /reschedule-requests`
- Auth: required.
- Returns: `{ requests: RescheduleRequestRow[] }`

### `POST /reschedule-requests`
- Auth: required.
- Body:
  - `sessionId`, `tutorId`, `requesterName`, `originalWhen`, `requestedWhen`, `note?`
- Returns: `{ id }`

### `PATCH /reschedule-requests`
- Auth: required.
- Body: `{ id, status?, counterWhen?, note? }`
- Returns: `{ ok: true }`

## Inbox / Shared Threads

### `GET /inbox?requestId=<id>`
- Auth: required.
- Returns: `{ messages: MessageRow[] }`

### `POST /inbox`
- Auth: required.
- Body:
  - `requestId`: string
  - `kind`: `'offer' | 'tutor_note'`
  - `fromDisplayName`: string
  - `payload`: object
- Returns: `{ id }`

## Children (Parent)

### `GET /children`
- Auth: required (`parent` role).
- Returns: `{ children: ChildRow[] }` for current parent user.

### `POST /children`
- Auth: required (`parent` role).
- Body: `{ name, age, grade, details? }`
- Returns: `{ id }`

### `PATCH /children`
- Auth: required (`parent` role).
- Body: `{ id, name, age, grade, details? }`
- Returns: `{ ok: true }`

### `DELETE /children?id=<childId>`
- Auth: required (`parent` role).
- Returns: `{ ok: true }`

## Session Notes

### `GET /session-notes?requestId=<id>`
- Auth: required.
- Returns: `{ notes: SessionNoteRow[] }`
- Access: tutor note author or booked client of the linked session.

### `POST /session-notes`
- Auth: required (`tutor` role).
- Body:
  - `sessionId`: string
  - `requestId`: string
  - `tutorDisplayName`: string
  - `studentName`: string
  - `subject`: string
  - `headline`: string
  - `summary`: string
  - `nextSteps`: string[]
  - `visibility?`: `'student' | 'parent' | 'both'`
- Returns: `{ id }`
- Side effect: creates a `tutor_note` row in `shared_messages` for thread visibility.

