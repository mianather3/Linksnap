const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = process.env.DB_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(path.join(DB_DIR, 'linksnap.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    short_code  TEXT    NOT NULL UNIQUE,
    original_url TEXT   NOT NULL,
    title       TEXT,
    created_at  DATETIME DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id     INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    ip_hash     TEXT,
    referrer    TEXT,
    user_agent  TEXT,
    country     TEXT,
    clicked_at  DATETIME DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_clicks_link_id   ON clicks(link_id);
  CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at);
  CREATE INDEX IF NOT EXISTS idx_links_short_code  ON links(short_code);
`);

module.exports = db;
