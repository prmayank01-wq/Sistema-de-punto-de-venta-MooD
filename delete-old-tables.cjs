const Database = require('better-sqlite3');
const db = new Database('pos.db');

const idsToDelete = [1, 2, 3, 4, 5, 6, 7, 8];

db.transaction(() => {
  for (const id of idsToDelete) {
    db.prepare('DELETE FROM table_links WHERE table_id = ?').run(id);
    db.prepare('DELETE FROM chat_messages WHERE table_id = ?').run(id);
    db.prepare('DELETE FROM playlist WHERE table_id = ?').run(id);
    db.prepare('DELETE FROM tables WHERE id = ?').run(id);
  }
})();

console.log('Deleted old tables');
