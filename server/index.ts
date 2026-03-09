import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import db, { initDB } from '../db/init.js';
import { createServer as createViteServer } from 'vite';

export async function startServer() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  app.use(cors());
  app.use(express.json());

  try {
    initDB();
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }

  // --- API Routes ---

  // Auth
  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      const user = db.prepare('SELECT id, username, role, password_hash FROM users WHERE username = ?').get(username) as any;
      
      if (user) {
        let isValid = false;
        
        // Check if it's a bcrypt hash
        if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
          isValid = bcrypt.compareSync(password, user.password_hash);
        } else {
          // Fallback for plain text passwords (from before the fix)
          isValid = password === user.password_hash;
          // Upgrade to hash
          if (isValid) {
            const newHash = bcrypt.hashSync(password, 10);
            db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
          }
        }

        if (isValid) {
          res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
          return;
        }
      }
      
      res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Users
  app.get('/api/users', (req, res) => {
    try {
      const users = db.prepare('SELECT id, username, role FROM users').all();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });
  app.post('/api/users', (req, res) => {
    try {
      const { username, password, role } = req.body;
      const hash = bcrypt.hashSync(password || '', 10);
      const stmt = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
      const info = stmt.run(username, hash, role);
      res.json({ id: info.lastInsertRowid, username, role });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });
  app.put('/api/users/:id', (req, res) => {
    try {
      const { username, role, password } = req.body;
      if (password) {
        const hash = bcrypt.hashSync(password, 10);
        db.prepare('UPDATE users SET username = ?, role = ?, password_hash = ? WHERE id = ?').run(username, role, hash, req.params.id);
      } else {
        db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?').run(username, role, req.params.id);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });
  app.delete('/api/users/:id', (req, res) => {
    try {
      const transaction = db.transaction(() => {
        // We can't easily delete users with sales/shifts. For now, just try to delete.
        // If it fails, we catch it.
        db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
      });
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting user:', err);
      if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        res.status(400).json({ error: 'No se puede eliminar el usuario porque tiene ventas o turnos asociados.' });
      } else {
        res.status(500).json({ error: 'Database error' });
      }
    }
  });

  // Inventory (Insumos)
  app.get('/api/inventory', (req, res) => {
    try {
      const items = db.prepare('SELECT id, nombre, contenido_gramos as contenido, peso_envase_gramos as peso_envase, modo_stock as modo, stock FROM inventory_items').all();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });
  app.post('/api/inventory', (req, res) => {
    try {
      const { nombre, contenido, peso_envase, modo, stock } = req.body;
      const stmt = db.prepare('INSERT INTO inventory_items (nombre, contenido_gramos, peso_envase_gramos, modo_stock, stock) VALUES (?, ?, ?, ?, ?)');
      const info = stmt.run(nombre, contenido, peso_envase, modo, stock);
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });
  app.put('/api/inventory/:id', (req, res) => {
    try {
      const { nombre, contenido, peso_envase, modo, stock } = req.body;
      db.prepare('UPDATE inventory_items SET nombre = ?, contenido_gramos = ?, peso_envase_gramos = ?, modo_stock = ?, stock = ? WHERE id = ?')
        .run(nombre, contenido, peso_envase, modo, stock, req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });
  app.delete('/api/inventory/:id', (req, res) => {
    try {
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM product_components WHERE inventory_item_id = ?').run(req.params.id);
        db.prepare('DELETE FROM inventory_items WHERE id = ?').run(req.params.id);
      });
      transaction();
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Products
  app.get('/api/products', (req, res) => {
    try {
      const products = db.prepare('SELECT * FROM products').all();
      const components = db.prepare('SELECT * FROM product_components').all();
      
      const productsWithComponents = products.map((p: any) => ({
        ...p,
        componentes: components.filter((c: any) => c.product_id === p.id).map((c: any) => ({
          insumo_id: c.inventory_item_id,
          cantidad: c.cantidad
        }))
      }));
      
      res.json(productsWithComponents);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });
  app.post('/api/products', (req, res) => {
    try {
      const { nombre, precio, tipo, componentes, imagen_path } = req.body;
      
      const transaction = db.transaction(() => {
        const stmt = db.prepare('INSERT INTO products (nombre, precio, tipo, imagen_path) VALUES (?, ?, ?, ?)');
        const info = stmt.run(nombre, precio, tipo, imagen_path || null);
        const productId = info.lastInsertRowid;
        
        if (componentes && Array.isArray(componentes)) {
          const compStmt = db.prepare('INSERT INTO product_components (product_id, inventory_item_id, cantidad) VALUES (?, ?, ?)');
          for (const comp of componentes) {
            compStmt.run(productId, comp.insumo_id, comp.cantidad);
          }
        }
        
        return productId;
      });
      
      const newId = transaction();
      res.json({ id: newId, ...req.body });
    } catch (err) {
      console.error('Error creating product:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });
  app.put('/api/products/:id', (req, res) => {
    try {
      const { nombre, precio, tipo, componentes, imagen_path } = req.body;
      const productId = req.params.id;
      
      const transaction = db.transaction(() => {
        db.prepare('UPDATE products SET nombre = ?, precio = ?, tipo = ?, imagen_path = ? WHERE id = ?')
          .run(nombre, precio, tipo, imagen_path || null, productId);
          
        if (componentes && Array.isArray(componentes)) {
          db.prepare('DELETE FROM product_components WHERE product_id = ?').run(productId);
          const compStmt = db.prepare('INSERT INTO product_components (product_id, inventory_item_id, cantidad) VALUES (?, ?, ?)');
          for (const comp of componentes) {
            compStmt.run(productId, comp.insumo_id, comp.cantidad);
          }
        }
      });
      
      transaction();
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating product:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });
  app.delete('/api/products/:id', (req, res) => {
    try {
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM product_components WHERE product_id = ?').run(req.params.id);
        db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
      });
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting product:', err);
      if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        res.status(400).json({ error: 'No se puede eliminar el producto porque tiene ventas asociadas.' });
      } else {
        res.status(500).json({ error: 'Database error' });
      }
    }
  });

  // Tables
  app.get('/api/tables', (req, res) => {
    try {
      const tables = db.prepare('SELECT id, nombre, color_rgb as color, rect_x as x, rect_y as y, rect_w as w, rect_h as h, estado FROM tables').all();
      res.json(tables);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });
  app.post('/api/tables', (req, res) => {
    try {
      const { nombre, color, x, y, w, h } = req.body;
      const stmt = db.prepare('INSERT INTO tables (nombre, color_rgb, rect_x, rect_y, rect_w, rect_h) VALUES (?, ?, ?, ?, ?, ?)');
      const info = stmt.run(nombre, color, x, y, w, h);
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });
  app.put('/api/tables/:id', (req, res) => {
    try {
      const { nombre, color, x, y, w, h } = req.body;
      db.prepare('UPDATE tables SET nombre = ?, color_rgb = ?, rect_x = ?, rect_y = ?, rect_w = ?, rect_h = ? WHERE id = ?')
        .run(nombre, color, x, y, w, h, req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });
  app.delete('/api/tables/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM tables WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Shifts
  app.post('/api/shifts/close', (req, res) => {
    try {
      const { user_id } = req.body;
      // In a real app, we would calculate the totals from the sales table for this shift
      // and update the shift record. For now, we'll just mark it as ended.
      db.prepare('UPDATE shifts SET end_at = CURRENT_TIMESTAMP WHERE user_id = ? AND end_at IS NULL').run(user_id);
      res.json({ success: true });
    } catch (err) {
      console.error('Error closing shift:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Sales
  app.delete('/api/sales/:id', (req, res) => {
    try {
      const { id } = req.params;
      db.transaction(() => {
        db.prepare('DELETE FROM payments WHERE sale_id = ?').run(id);
        db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(id);
        db.prepare('DELETE FROM sales WHERE id = ?').run(id);
      })();
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting sale:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.put('/api/sales/:id/method', (req, res) => {
    try {
      const { id } = req.params;
      const { metodo_pago, monto_efectivo, monto_qr } = req.body;
      db.transaction(() => {
        db.prepare('UPDATE sales SET metodo_pago = ? WHERE id = ?').run(metodo_pago, id);
        const sale = db.prepare('SELECT total FROM sales WHERE id = ?').get(id) as any;
        if (sale) {
          if (metodo_pago === 'EFECTIVO') {
            db.prepare('UPDATE payments SET efectivo = ?, qr = 0 WHERE sale_id = ?').run(sale.total, id);
          } else if (metodo_pago === 'QR') {
            db.prepare('UPDATE payments SET efectivo = 0, qr = ? WHERE sale_id = ?').run(sale.total, id);
          } else if (metodo_pago === 'MIXTO') {
            db.prepare('UPDATE payments SET efectivo = ?, qr = ? WHERE sale_id = ?').run(monto_efectivo || 0, monto_qr || 0, id);
          }
        }
      })();
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating sale:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/sales', (req, res) => {
    try {
      const { user_id, total, metodo_pago, items, monto_efectivo, monto_qr } = req.body;
      
      const transaction = db.transaction(() => {
        const shift = db.prepare('SELECT id FROM shifts WHERE user_id = ? AND end_at IS NULL ORDER BY id DESC LIMIT 1').get(user_id) as any;
        let final_shift_id = shift ? shift.id : null;
        
        if (!final_shift_id) {
           const info = db.prepare('INSERT INTO shifts (user_id, caja_inicial) VALUES (?, 0)').run(user_id);
           final_shift_id = info.lastInsertRowid;
        }

        const stmt = db.prepare('INSERT INTO sales (user_id, shift_id, total, metodo_pago) VALUES (?, ?, ?, ?)');
        const info = stmt.run(user_id, final_shift_id, total, metodo_pago);
        const saleId = info.lastInsertRowid;
        
        const itemStmt = db.prepare('INSERT INTO sale_items (sale_id, product_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)');
        for (const item of items) {
          itemStmt.run(saleId, item.id, item.cant, item.precio, item.precio * item.cant);
        }

        let efectivo = 0;
        let qr = 0;
        if (metodo_pago === 'EFECTIVO') efectivo = total;
        else if (metodo_pago === 'QR') qr = total;
        else if (metodo_pago === 'MIXTO') {
          efectivo = monto_efectivo || 0;
          qr = monto_qr || 0;
        }

        db.prepare('INSERT INTO payments (sale_id, efectivo, qr) VALUES (?, ?, ?)').run(saleId, efectivo, qr);
        
        return saleId;
      });
      
      const saleId = transaction();
      res.json({ success: true, saleId });
    } catch (err) {
      console.error('Error creating sale:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Reports
  app.get('/api/reports', (req, res) => {
    try {
      const reports = db.prepare(`
        SELECT s.id, u.username as cajero, s.start_at as fecha, s.tot_efectivo as efectivo, s.tot_qr as qr, (s.tot_efectivo + s.tot_qr) as total
        FROM shifts s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.start_at DESC
      `).all();
      res.json(reports);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/reports/sales', (req, res) => {
    try {
      const { start, end } = req.query;
      let query = `
        SELECT 
          s.id,
          s.fecha as hora_venta, 
          p.nombre as producto, 
          u.username as cajero, 
          s.metodo_pago,
          si.subtotal as total,
          pm.efectivo as monto_efectivo,
          pm.qr as monto_qr
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        JOIN products p ON si.product_id = p.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN payments pm ON s.id = pm.sale_id
      `;
      
      const params: any[] = [];
      if (start && end) {
        query += ` WHERE date(s.fecha) BETWEEN ? AND ?`;
        params.push(start, end);
      } else if (start) {
        query += ` WHERE date(s.fecha) >= ?`;
        params.push(start);
      } else if (end) {
        query += ` WHERE date(s.fecha) <= ?`;
        params.push(end);
      }
      
      query += ` ORDER BY s.fecha DESC`;
      
      const sales = db.prepare(query).all(...params);
      res.json(sales);
    } catch (err) {
      console.error('Error fetching sales report:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/reports/top-products', (req, res) => {
    try {
      const { start, end } = req.query;
      let query = `
        SELECT p.nombre, SUM(si.cantidad) as total_vendido
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
      `;
      
      const params: any[] = [];
      if (start && end) {
        query += ` WHERE date(s.fecha) BETWEEN ? AND ?`;
        params.push(start, end);
      } else if (start) {
        query += ` WHERE date(s.fecha) >= ?`;
        params.push(start);
      } else if (end) {
        query += ` WHERE date(s.fecha) <= ?`;
        params.push(end);
      }
      
      query += ` GROUP BY p.id ORDER BY total_vendido DESC`;
      
      const topProducts = db.prepare(query).all(...params);
      res.json(topProducts);
    } catch (err) {
      console.error('Error fetching top products:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Settings
  app.get('/api/settings', (req, res) => {
    try {
      const settings = db.prepare('SELECT clave as key, valor_json as value FROM settings').all();
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });
  app.post('/api/settings', (req, res) => {
    try {
      const { key, value } = req.body;
      db.prepare('INSERT OR REPLACE INTO settings (clave, valor_json) VALUES (?, ?)').run(key, value);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Pedidos API
  app.get('/api/menu', (req, res) => {
    try {
      const products = db.prepare('SELECT * FROM products WHERE activo = 1').all();
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Socket.IO
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_table', (tableId) => {
      socket.join(`table_${tableId}`);
    });

    socket.on('chat_message', (data) => {
      const { tableId, message, fromRole } = data;
      db.prepare('INSERT INTO chat_messages (table_id, message, from_role) VALUES (?, ?, ?)')
        .run(tableId, message, fromRole);
      io.emit('new_message', data); // Broadcast to DJ panel
      io.to(`table_${tableId}`).emit('new_message', data); // Broadcast to table
    });

    socket.on('add_playlist', (data) => {
      const { tableId, title, youtubeId, tipo } = data;
      db.prepare('INSERT INTO playlist (table_id, title, youtube_id, tipo) VALUES (?, ?, ?, ?)')
        .run(tableId, title, youtubeId, tipo);
      io.emit('new_playlist_item', data); // Broadcast to DJ panel
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Vite middleware for development preview
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}

// Only start the server automatically if we are running this file directly (e.g. via tsx)
if (process.argv[1] && process.argv[1].endsWith('server/index.ts')) {
  startServer();
}

