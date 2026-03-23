import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'pos.db');
const db = new Database(dbPath);

const tables = db.prepare("SELECT * FROM tables").all();
console.log(tables);
