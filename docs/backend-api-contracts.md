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
  - `kind`: `'offer' | 'tutor_note' | string`
  - `fromDisplayName`: string
  - `payload`: object
- Returns: `{ id }`

