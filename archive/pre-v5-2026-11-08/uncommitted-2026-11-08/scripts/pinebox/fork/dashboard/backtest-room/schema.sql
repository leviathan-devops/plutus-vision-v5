-- backtest-room/schema.sql — THE BACKTEST ROOM's persistence (SHELL_ANCHOR §5.2 · W-S3 T1)
-- Idempotent by construction: CREATE ... IF NOT EXISTS everywhere.
-- The SESSION truth-table is the dashboard's EXISTING `backtest_sessions` (it shipped
-- empty). This file ADDS the room's own columns to it (guarded by a PRAGMA check in
-- store.mjs, because SQLite has no ADD COLUMN IF NOT EXISTS) and creates the two tables
-- the room owns outright: `backtest_trades` (the fill ledger) and `backtest_events`
-- (the audit trail the operator + a supervising agent read live).
--
-- Apply:  node dashboard/backtest-room/store.mjs --init      (or on first control boot)
-- Target: ~/.plutus-dashboard/data.db   (override: PLUTUS_DASHBOARD_DB)

-- ── 1 · the room's fill ledger ─ one row per FILL (entry, each partial, the exit) ──
CREATE TABLE IF NOT EXISTS backtest_trades (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_uid           TEXT    NOT NULL UNIQUE,
    session_uid         TEXT    NOT NULL,
    position_id         TEXT    NOT NULL,
    order_id            TEXT,
    seq                 INTEGER NOT NULL,
    symbol              TEXT    NOT NULL,
    timeframe           TEXT,
    side                TEXT    NOT NULL,          -- buy | sell
    kind                TEXT    NOT NULL,          -- entry | partial | exit
    reason              TEXT,                      -- ENTRY | PARTIAL | MANUAL | SL | TP
    qty                 REAL    NOT NULL,
    price               REAL    NOT NULL,
    pct_of_position     REAL,                      -- null on the entry row
    pnl                 REAL    DEFAULT 0,         -- 0 on the entry row
    r_multiple          REAL,                      -- set on the EXIT row (the settled position)
    position_pnl        REAL,                      -- set on the EXIT row (aggregate)
    position_bars       INTEGER,                   -- set on the EXIT row
    qty_remaining       REAL,
    sl                  REAL,
    tp                  REAL,
    bar_index           INTEGER NOT NULL,
    bar_time            INTEGER NOT NULL,
    bar_iso             TEXT    NOT NULL,
    note                TEXT,
    tags                TEXT,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bt_trades_session  ON backtest_trades(session_uid, seq);
CREATE INDEX IF NOT EXISTS idx_bt_trades_position ON backtest_trades(session_uid, position_id);
CREATE INDEX IF NOT EXISTS idx_bt_trades_kind     ON backtest_trades(session_uid, kind);

-- ── 2 · the audit trail (create / step / jump / place / close / cancel) ─────────────
-- Every state transition that a supervising agent or the operator can see. Append-only.
CREATE TABLE IF NOT EXISTS backtest_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_uid     TEXT    NOT NULL,
    seq             INTEGER NOT NULL,
    at              TEXT    NOT NULL DEFAULT (datetime('now')),
    actor           TEXT    NOT NULL DEFAULT 'human',   -- human | agent | system
    verb            TEXT    NOT NULL,                   -- create|step|jump|play|pause|place|modify|close|cancel|note|finish
    detail          TEXT,
    cursor          INTEGER,
    visible_bars    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_bt_events_session ON backtest_events(session_uid, seq);

-- ── 3 · the room's columns on the SHIPPED `backtest_sessions` table ────────────────
-- (executed by store.mjs as guarded ALTER TABLEs; listed here as the declared shape)
--   name TEXT · strategy TEXT · playbook TEXT · symbol TEXT · timeframe TEXT · symbols TEXT
--   start_date TEXT · end_date TEXT · starting_balance REAL · cursor INTEGER
--   balance REAL · realized REAL · equity REAL · bars_total INTEGER · visible_bars INTEGER
--   session_notes TEXT · tags TEXT · last_activity_at TEXT · fills INTEGER
--   started_index INTEGER · exit_index INTEGER · finished_at TEXT · source TEXT
