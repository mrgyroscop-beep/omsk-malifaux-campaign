PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  organizer_token_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  dossier_json TEXT NOT NULL DEFAULT '{}',
  dossier_revision INTEGER NOT NULL DEFAULT 1 CHECK (dossier_revision >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS campaign_players (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  crew_name TEXT NOT NULL DEFAULT '',
  faction TEXT NOT NULL DEFAULT '',
  campaign_rating INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
  wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_campaign_players_campaign
  ON campaign_players(campaign_id, created_at);

CREATE TABLE IF NOT EXISTS campaign_events (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  week INTEGER NOT NULL DEFAULT 1 CHECK (week BETWEEN 1 AND 99),
  event_type TEXT NOT NULL DEFAULT 'note'
    CHECK (event_type IN ('game', 'note', 'milestone')),
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign
  ON campaign_events(campaign_id, week DESC, created_at DESC);
