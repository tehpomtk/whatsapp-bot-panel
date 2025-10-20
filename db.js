
// Simple better-sqlite3 wrapper + schema
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data.sqlite');
const db = new Database(dbPath);

// Schema
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  passhash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auto_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern TEXT NOT NULL,        -- substring or exact
  is_regex INTEGER DEFAULT 0,   -- 0=substring,1=regex
  reply TEXT NOT NULL,
  scope TEXT DEFAULT 'all',     -- 'all' or chatId like '7701...@c.us' or 'groupId'
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scheduled (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  message TEXT NOT NULL,
  cron TEXT,                    -- if set -> recurring
  run_at DATETIME,              -- one-shot
  enabled INTEGER DEFAULT 1,
  last_run_at DATETIME
);

CREATE TABLE IF NOT EXISTS deleted_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  author_id TEXT,
  message_id TEXT,
  message_type TEXT,
  body TEXT,
  timestamp_ms INTEGER,
  deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

module.exports = db;
