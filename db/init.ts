import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const isDev = process.env.NODE_ENV === 'development';

let userDataPath = '';
try {
  // Try to get electron app path, fallback to local directory for web preview
  const electron = require('electron');
  userDataPath = electron.app ? electron.app.getPath('userData') : path.join(__dirname, '../../');
} catch (e) {
  userDataPath = path.join(__dirname, '../../');
}

const dbPath = isDev 
  ? path.resolve(process.cwd(), 'pos.db') 
  : path.join(userDataPath, 'pos.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initDB() {
  const schemaPath = isDev 
    ? path.resolve(process.cwd(), 'db/schema.sql')
    : path.join(process.resourcesPath, 'app/db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  // Seed admin user if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin', 10);
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash, 'ADMIN');
  }

  // Seed cajero user if not exists
  const cajeroExists = db.prepare('SELECT id FROM users WHERE username = ?').get('cajero');
  if (!cajeroExists) {
    const hash = bcrypt.hashSync('cajero', 10);
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('cajero', hash, 'CAJERO');
  }
}

export default db;
