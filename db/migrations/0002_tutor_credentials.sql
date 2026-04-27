CREATE TABLE IF NOT EXISTS tutor_credentials (
  id varchar(64) PRIMARY KEY,
  tutor_user_id varchar(40) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name varchar(255) NOT NULL,
  mime_type varchar(80) NOT NULL,
  size_bytes integer NOT NULL,
  data_url text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tutor_credentials_tutor_user_idx
  ON tutor_credentials (tutor_user_id);
