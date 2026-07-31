CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('bug', 'idea', 'data', 'other')),
  message TEXT NOT NULL
    CHECK (length(message) BETWEEN 10 AND 2000),
  contact TEXT NOT NULL DEFAULT ''
    CHECK (length(contact) <= 180),
  app_version TEXT NOT NULL
    CHECK (length(app_version) BETWEEN 1 AND 64),
  locale TEXT NOT NULL
    CHECK (locale IN ('ru', 'en')),
  section TEXT NOT NULL
    CHECK (length(section) BETWEEN 1 AND 64),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'retry', 'delivered', 'ignored')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  claim_token TEXT,
  lease_expires_at TEXT,
  available_at TEXT NOT NULL,
  last_error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  processed_at TEXT
) STRICT;

CREATE INDEX IF NOT EXISTS idx_feedback_automation_queue
  ON feedback(status, available_at, created_at);
