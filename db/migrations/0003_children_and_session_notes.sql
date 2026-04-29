CREATE TABLE IF NOT EXISTS children (
  id varchar(40) PRIMARY KEY,
  parent_user_id varchar(40) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL,
  age integer NOT NULL,
  grade varchar(80) NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS children_parent_user_idx
  ON children (parent_user_id);

CREATE TABLE IF NOT EXISTS session_notes (
  id varchar(40) PRIMARY KEY,
  session_id varchar(40) NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  request_id varchar(64) NOT NULL,
  tutor_email varchar(255) NOT NULL,
  tutor_display_name varchar(120) NOT NULL,
  student_name varchar(120) NOT NULL,
  subject varchar(120) NOT NULL,
  headline varchar(180) NOT NULL,
  summary text NOT NULL,
  next_steps jsonb NOT NULL,
  visibility varchar(16) NOT NULL DEFAULT 'both',
  sent_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_notes_session_idx
  ON session_notes (session_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS session_notes_request_idx
  ON session_notes (request_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS session_notes_tutor_idx
  ON session_notes (tutor_email, sent_at DESC);
