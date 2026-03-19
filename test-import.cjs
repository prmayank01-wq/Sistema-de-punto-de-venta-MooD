const Database = require('better-sqlite3');
const db = new Database('pos.db');

const inventory = [
  { id: 1, nombre: 'Test', contenido: 1000, peso_envase: 100, modo: 'GRAMOS', stock: 10 }
];
const products = [
  { id: 1, nombre: 'Test Prod', precio: 100, tipo: 'BOTELLA', imagen_path: null, componentes: [{ insumo_id: 1, cantidad: 1 }] }
];

try {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM product_components').run();
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM inventory_items').run();
    
    const invStmt = db.prepare('INSERT INTO inventory_items (id, nombre, contenido_gramos, peso_envase_gramos, modo_stock, stock) VALUES (?, ?, ?, ?, ?, ?)');
    for (const item of inventory) {
      invStmt.run(item.id, item.nombre, item.contenido, item.peso_envase, item.modo, item.stock);
    }
    
    const prodStmt = db.prepare('INSERT INTO products (id, nombre, precio, tipo, imagen_path) VALUES (?, ?, ?, ?, ?)');
    const compStmt = db.prepare('INSERT INTO product_components (product_id, inventory_item_id, cantidad) VALUES (?, ?, ?)');
    
    for (const prod of products) {
      prodStmt.run(prod.id, prod.nombre, prod.precio, prod.tipo, prod.imagen_path || null);
      if (prod.componentes && Array.isArray(prod.componentes)) {
        for (const comp of prod.componentes) {
          compStmt.run(prod.id, comp.insumo_id, comp.cantidad);
        }
      }
    }
  });
  transaction();
  console.log('Success');
} catch (e) {
  console.error(e);
}
