import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(process.cwd(), 'brag-docs.db');
export const db = new Database(dbPath);

export function initDb() {
  console.log('Initializing database at', dbPath);

  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT NOT NULL,
      week        TEXT NOT NULL,
      file_path   TEXT NOT NULL,
      raw_content TEXT NOT NULL,
      parsed_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id  INTEGER REFERENCES entries(id) ON DELETE CASCADE,
      ticket_id TEXT,
      title     TEXT NOT NULL,
      project   TEXT NOT NULL,
      date      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activities (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id     INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      type        TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_entries_file ON entries(file_path);
    CREATE INDEX IF NOT EXISTS idx_tasks_date        ON tasks(date);
    CREATE INDEX IF NOT EXISTS idx_tasks_project     ON tasks(project);
    CREATE INDEX IF NOT EXISTS idx_tasks_ticket      ON tasks(ticket_id);
  `);

  console.log('Database initialized successfully.');
}
