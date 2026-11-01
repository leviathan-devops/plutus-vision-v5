-- base-schema.sql - the ONE table the Backtest room does not create for itself.
--
-- The room (backtest-room/store.mjs) ADDS columns to the dashboard's own `backtest_sessions`,
-- which the dashboard's Electron server creates (electron/server/db.js, CREATE_BACKTEST_SESSIONS).
-- A fresh per-instance database has no such table, so the room crashed at init
-- ("no such table: backtest_sessions"). Pinebox seeds it from THIS file before starting the room.
--
-- It must equal db.js's definition: pb_room_preflight compares the two (whitespace/case
-- normalised) and refuses ROOM_SCHEMA_DRIFT if they differ, so this copy cannot silently rot.
CREATE TABLE IF NOT EXISTS backtest_sessions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    session_uid         TEXT    NOT NULL UNIQUE,
    agent_id            TEXT    NOT NULL,
    agent_version       TEXT    NOT NULL,
    trading_week        TEXT,
    pairs_traded        TEXT,
    started_at          TEXT    NOT NULL,
    completed_at        TEXT,
    status              TEXT    NOT NULL DEFAULT 'RUNNING',
    total_trades        INTEGER DEFAULT 0,
    win_rate            REAL,
    profit_factor       REAL,
    total_pnl_pips      REAL,
    max_drawdown_pips   REAL,
    sharpe_ratio        REAL,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);
