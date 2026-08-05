PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email_normalized TEXT NOT NULL COLLATE NOCASE UNIQUE,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 60),
  password_algorithm TEXT NOT NULL,
  password_version INTEGER NOT NULL CHECK (password_version >= 1),
  password_iterations INTEGER NOT NULL CHECK (password_iterations >= 100000),
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE account_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
) STRICT;

CREATE INDEX idx_account_sessions_user
  ON account_sessions(user_id, created_at DESC);
CREATE INDEX idx_account_sessions_expiry
  ON account_sessions(expires_at) WHERE revoked_at IS NULL;

CREATE TABLE auth_attempts (
  attempt_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL CHECK (attempts >= 1),
  window_started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE INDEX idx_auth_attempts_updated ON auth_attempts(updated_at);

ALTER TABLE campaigns
  ADD COLUMN owner_user_id TEXT REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE campaigns
  ADD COLUMN access_mode TEXT NOT NULL DEFAULT 'legacy_public'
  CHECK (access_mode IN ('legacy_public', 'account_private'));

CREATE UNIQUE INDEX idx_campaigns_account_owner
  ON campaigns(owner_user_id) WHERE owner_user_id IS NOT NULL;
