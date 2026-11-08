CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,            -- pv-<week>-<pair>
  pair TEXT NOT NULL,
  week TEXT NOT NULL,
  anchor_ms INTEGER NOT NULL,
  status TEXT NOT NULL,           -- armed | sealed | failed
  card_sha TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS runs_by_pair_week ON runs (pair, week);
