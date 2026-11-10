
const Database = require("better-sqlite3");
const path = require("node:path");
const fs = require("node:fs");

const dataDirectory = path.join(__dirname, "../data");

if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

const databasePath = path.join(dataDirectory, "railroad.sqlite");
const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Server settings
db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 1,
    min_xp INTEGER DEFAULT 15,
    max_xp INTEGER DEFAULT 25,
    cooldown INTEGER DEFAULT 60,
    announcement_channel TEXT,
    announcement_enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    last_message INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS xp_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_users_leaderboard
  ON users (guild_id, xp DESC);

  CREATE INDEX IF NOT EXISTS idx_xp_history_user
  ON xp_history (guild_id, user_id);
`);

console.log("Railroad database initialized.");

function initializeDatabase() {
  return db;
}

module.exports = initializeDatabase;
