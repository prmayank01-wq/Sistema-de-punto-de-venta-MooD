const Database = require('better-sqlite3');
const db = new Database('pos.db');
const tables = db.prepare('SELECT id, nombre FROM tables').all();
console.log(tables);
