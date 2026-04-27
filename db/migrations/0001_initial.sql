CREATE TABLE IF NOT EXISTS users (
  id varchar(40) PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name varchar(120) NOT NULL,
  role varchar(16) NOT NULL,
  profile jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id varchar(40) PRIMARY KEY,
  user_id varchar(40) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_id varchar(40) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tutor_availability (
  owner_email varchar(255) NOT NULL,
  slot_key varchar(20) NOT NULL,
  is_open boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_email, slot_key)
);

CREATE TABLE IF NOT EXISTS learning_sessions (
  id varchar(40) PRIMARY KEY,
  tutor_id varchar(64) NOT NULL,
  tutor_name varchar(120) NOT NULL,
  subject varchar(120) NOT NULL,
  when_iso text NOT NULL,
  duration_mins integer NOT NULL,
  mode varchar(16) NOT NULL,
  status varchar(40) NOT NULL,
  booked_by_email varchar(255) NOT NULL,
  booked_for_role varchar(16) NOT NULL,
  hidden_from_ui boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reschedule_requests (
  id varchar(40) PRIMARY KEY,
  session_id varchar(40) NOT NULL,
  tutor_id varchar(64) NOT NULL,
  requester_email varchar(255) NOT NULL,
  requester_name varchar(120) NOT NULL,
  original_when text NOT NULL,
  requested_when text NOT NULL,
  note text,
  status varchar(32) NOT NULL DEFAULT 'Pending',
  counter_when text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shared_messages (
  id varchar(40) PRIMARY KEY,
  request_id varchar(64) NOT NULL,
  kind varchar(24) NOT NULL,
  from_role varchar(16) NOT NULL,
  from_display_name varchar(120) NOT NULL,
  from_email varchar(255) NOT NULL,
  payload jsonb NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id varchar(40) PRIMARY KEY,
  tutor_id varchar(64) NOT NULL,
  rating integer NOT NULL,
  text text NOT NULL,
  author_name varchar(120) NOT NULL,
  author_email varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_reads (
  user_email varchar(255) NOT NULL,
  notification_id varchar(64) NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_email, notification_id)
);

