import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'pos.db');
const db = new Database(dbPath);

console.log('Deleting default tables...');
const result = db.prepare("DELETE FROM tables WHERE nombre LIKE 'Mesa %'").run();
console.log(`Deleted ${result.changes} tables.`);
