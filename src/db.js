import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_stocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  stock_symbol TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

export default db;