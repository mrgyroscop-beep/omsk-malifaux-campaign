-- Existing campaigns remain independent arsenals, with their original URLs and ACLs.
CREATE TABLE organizer_campaigns (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  week INTEGER NOT NULL DEFAULT 1 CHECK (week BETWEEN 1 AND 99),
  duration INTEGER NOT NULL DEFAULT 8 CHECK (duration BETWEEN 1 AND 99),
  notes TEXT NOT NULL DEFAULT '',
  invite_token TEXT NOT NULL UNIQUE,
  revision INTEGER NOT NULL DEFAULT 1,
  legacy_source_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX idx_organizer_campaigns_owner ON organizer_campaigns(owner_user_id, updated_at DESC);
CREATE UNIQUE INDEX idx_organizer_legacy_source ON organizer_campaigns(owner_user_id, legacy_source_id)
  WHERE legacy_source_id IS NOT NULL;

CREATE TABLE organizer_members (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES organizer_campaigns(id) ON DELETE CASCADE,
  arsenal_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  crew_name TEXT NOT NULL DEFAULT '',
  faction TEXT NOT NULL DEFAULT '',
  campaign_rating INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  UNIQUE (campaign_id, arsenal_id)
) STRICT;
CREATE INDEX idx_organizer_members_arsenal ON organizer_members(arsenal_id, campaign_id);

CREATE TABLE organizer_events (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES organizer_campaigns(id) ON DELETE CASCADE,
  week INTEGER NOT NULL CHECK (week BETWEEN 1 AND 99),
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
) STRICT;
CREATE INDEX idx_organizer_events_campaign ON organizer_events(campaign_id, created_at DESC);
