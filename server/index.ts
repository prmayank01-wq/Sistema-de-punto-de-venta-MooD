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
      const tables = db.prepare('SELECT id, nombre, color_rgb as color, rect_x as x, rect_y as y, rect_w as w, rect_h as h, estado, orden FROM tables ORDER BY orden ASC, id ASC').all();
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
      io.emit('tables_updated');
      res.json({ id: info.lastInsertRowid, ...req.body });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });
  app.put('/api/tables/reorder', (req, res) => {
    try {
      const { orders } = req.body; // Array of { id, orden }
      db.transaction(() => {
        const stmt = db.prepare('UPDATE tables SET orden = ? WHERE id = ?');
        for (const item of orders) {
          stmt.run(item.orden, item.id);
        }
      })();
      io.emit('tables_updated');
      res.json({ success: true });
    } catch (err) {
      console.error('Error reordering tables:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.put('/api/tables/:id', (req, res) => {
    try {
      const { nombre, color, x, y, w, h } = req.body;
      db.prepare('UPDATE tables SET nombre = ?, color_rgb = ?, rect_x = ?, rect_y = ?, rect_w = ?, rect_h = ? WHERE id = ?')
        .run(nombre, color, x, y, w, h, req.params.id);
      io.emit('tables_updated');
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });
  app.delete('/api/tables/:id', (req, res) => {
    try {
      db.transaction(() => {
        db.prepare('DELETE FROM table_links WHERE table_id = ?').run(req.params.id);
        db.prepare('DELETE FROM chat_messages WHERE table_id = ?').run(req.params.id);
        db.prepare('DELETE FROM playlist WHERE table_id = ?').run(req.params.id);
        db.prepare('DELETE FROM tables WHERE id = ?').run(req.params.id);
      })();
      io.emit('tables_updated');
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting table:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Shifts
  app.post('/api/shifts/close', (req, res) => {
    try {
      const { user_id } = req.body;
      db.transaction(() => {
        const shift = db.prepare('SELECT id FROM shifts WHERE user_id = ? AND end_at IS NULL ORDER BY id DESC LIMIT 1').get(user_id) as any;
        if (shift) {
          const totals = db.prepare(`
            SELECT 
              SUM(CASE WHEN s.metodo_pago = 'EFECTIVO' THEN s.total WHEN s.metodo_pago = 'MIXTO' THEN p.efectivo ELSE 0 END) as tot_efectivo,
              SUM(CASE WHEN s.metodo_pago = 'QR' THEN s.total WHEN s.metodo_pago = 'MIXTO' THEN p.qr ELSE 0 END) as tot_qr
            FROM sales s
            LEFT JOIN payments p ON s.id = p.sale_id
            WHERE s.shift_id = ? AND s.is_deleted = 0
          `).get(shift.id) as any;
          
          db.prepare('UPDATE shifts SET end_at = CURRENT_TIMESTAMP, tot_efectivo = ?, tot_qr = ? WHERE id = ?').run(totals.tot_efectivo || 0, totals.tot_qr || 0, shift.id);
        }
      })();
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
      const { user_id, total, metodo_pago, items, monto_efectivo, monto_qr, is_deleted } = req.body;
      
      const transaction = db.transaction(() => {
        const shift = db.prepare('SELECT id FROM shifts WHERE user_id = ? AND end_at IS NULL ORDER BY id DESC LIMIT 1').get(user_id) as any;
        let final_shift_id = shift ? shift.id : null;
        
        if (!final_shift_id) {
           const info = db.prepare('INSERT INTO shifts (user_id, caja_inicial) VALUES (?, 0)').run(user_id);
           final_shift_id = info.lastInsertRowid;
        }

        const deleted_flag = is_deleted ? 1 : 0;
        const stmt = db.prepare('INSERT INTO sales (user_id, shift_id, total, metodo_pago, is_deleted) VALUES (?, ?, ?, ?, ?)');
        const info = stmt.run(user_id, final_shift_id, total, metodo_pago, deleted_flag);
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

  app.get('/api/chats/active', (req, res) => {
    try {
      const lastClosedShift = db.prepare('SELECT end_at FROM shifts WHERE end_at IS NOT NULL ORDER BY id DESC LIMIT 1').get() as any;
      const startTime = lastClosedShift ? lastClosedShift.end_at : '1970-01-01T00:00:00.000Z';

      const chats = db.prepare(`
        SELECT c.*, t.nombre as table_name
        FROM chat_messages c
        JOIN tables t ON c.table_id = t.id
        WHERE c.ts > ?
        ORDER BY c.ts ASC
      `).all(startTime);
      res.json(chats);
    } catch (err) {
      console.error('Error fetching active chats:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/search-youtube', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') return res.status(400).json({ error: 'Missing query' });
      
      const ytSearch = (await import('yt-search')).default;
      const r = await ytSearch(q);
      const videos = r.videos.slice(0, 10).map(v => ({
        title: v.title,
        artist: v.author.name,
        thumbnail: v.thumbnail,
        url: v.url,
        videoId: v.videoId
      }));
      res.json(videos);
    } catch (err) {
      console.error('Error searching YouTube:', err);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  app.get('/api/playlist/active', (req, res) => {
    try {
      const lastClosedShift = db.prepare('SELECT end_at FROM shifts WHERE end_at IS NOT NULL ORDER BY id DESC LIMIT 1').get() as any;
      const startTime = lastClosedShift ? lastClosedShift.end_at : '1970-01-01T00:00:00.000Z';

      const playlist = db.prepare(`
        SELECT p.*, t.nombre as table_name
        FROM playlist p
        JOIN tables t ON p.table_id = t.id
        WHERE p.ts > ?
        ORDER BY p.ts ASC
      `).all(startTime);
      res.json(playlist);
    } catch (err) {
      console.error('Error fetching active playlist:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Shifts
  app.get('/api/shifts', (req, res) => {
    try {
      const shifts = db.prepare(`
        SELECT s.id, s.start_at, s.end_at, u.username as cajero
        FROM shifts s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.start_at DESC
      `).all();
      res.json(shifts);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/shifts/:id/chats', (req, res) => {
    try {
      const shiftId = req.params.id;
      const shift = db.prepare('SELECT start_at, end_at FROM shifts WHERE id = ?').get(shiftId) as any;
      if (!shift) return res.status(404).json({ error: 'Shift not found' });
      
      const endAt = shift.end_at || new Date().toISOString();
      
      const chats = db.prepare(`
        SELECT c.*, t.nombre as table_name
        FROM chat_messages c
        JOIN tables t ON c.table_id = t.id
        WHERE c.ts >= ? AND c.ts <= ?
        ORDER BY c.ts ASC
      `).all(shift.start_at, endAt);
      
      res.json(chats);
    } catch (err) {
      console.error('Error fetching shift chats:', err);
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

  app.get('/api/sales/current-shift', (req, res) => {
    try {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });

      const shift = db.prepare('SELECT id FROM shifts WHERE user_id = ? AND end_at IS NULL ORDER BY id DESC LIMIT 1').get(user_id) as any;
      if (!shift) return res.json([]);

      const query = `
        SELECT 
          s.id,
          s.fecha as hora_venta, 
          p.nombre as producto, 
          u.username as cajero, 
          s.metodo_pago,
          si.cantidad,
          si.subtotal as total,
          pm.efectivo as monto_efectivo,
          pm.qr as monto_qr,
          s.is_deleted
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        JOIN products p ON si.product_id = p.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN payments pm ON s.id = pm.sale_id
        WHERE s.shift_id = ?
        ORDER BY s.id DESC
      `;
      const sales = db.prepare(query).all(shift.id);
      res.json(sales);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/sales/current-shift/inventory', (req, res) => {
    try {
      const { user_id } = req.query;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });

      const shift = db.prepare('SELECT id FROM shifts WHERE user_id = ? AND end_at IS NULL ORDER BY id DESC LIMIT 1').get(user_id) as any;
      if (!shift) return res.json([]);

      const query = `
        SELECT 
          ii.nombre as insumo,
          ii.modo_stock,
          ii.contenido_gramos,
          SUM(si.cantidad * pc.cantidad) as cantidad_usada
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        JOIN product_components pc ON si.product_id = pc.product_id
        JOIN inventory_items ii ON pc.inventory_item_id = ii.id
        WHERE s.shift_id = ? AND s.is_deleted = 0
        GROUP BY ii.id, ii.nombre, ii.modo_stock, ii.contenido_gramos
        ORDER BY cantidad_usada DESC
      `;
      const inventoryUsed = db.prepare(query).all(shift.id);
      res.json(inventoryUsed);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/reports/sales', (req, res) => {
    try {
      const { start, end, shift_id } = req.query;
      let query = `
        SELECT 
          s.id,
          s.fecha as hora_venta, 
          p.nombre as producto, 
          u.username as cajero, 
          s.metodo_pago,
          si.subtotal as total,
          pm.efectivo as monto_efectivo,
          pm.qr as monto_qr,
          s.is_deleted
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        JOIN products p ON si.product_id = p.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN payments pm ON s.id = pm.sale_id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      if (shift_id) {
        query += ` AND s.shift_id = ?`;
        params.push(shift_id);
      } else {
        if (start && end) {
          query += ` AND date(s.fecha) BETWEEN ? AND ?`;
          params.push(start, end);
        } else if (start) {
          query += ` AND date(s.fecha) >= ?`;
          params.push(start);
        } else if (end) {
          query += ` AND date(s.fecha) <= ?`;
          params.push(end);
        }
      }
      
      query += ` ORDER BY s.fecha DESC`;
      
      const sales = db.prepare(query).all(...params);
      res.json(sales);
    } catch (err) {
      console.error('Error fetching sales report:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/reports/inventory-used', (req, res) => {
    try {
      const { start, end, shift_id } = req.query;
      let query = `
        SELECT 
          ii.nombre as insumo,
          ii.modo_stock,
          ii.contenido_gramos,
          SUM(si.cantidad * pc.cantidad) as cantidad_usada
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        JOIN product_components pc ON si.product_id = pc.product_id
        JOIN inventory_items ii ON pc.inventory_item_id = ii.id
        WHERE s.is_deleted = 0
      `;
      
      const params: any[] = [];
      if (shift_id) {
        query += ` AND s.shift_id = ?`;
        params.push(shift_id);
      } else {
        if (start && end) {
          query += ` AND date(s.fecha) BETWEEN ? AND ?`;
          params.push(start, end);
        } else if (start) {
          query += ` AND date(s.fecha) >= ?`;
          params.push(start);
        } else if (end) {
          query += ` AND date(s.fecha) <= ?`;
          params.push(end);
        }
      }
      
      query += ` GROUP BY ii.id, ii.nombre, ii.modo_stock, ii.contenido_gramos ORDER BY cantidad_usada DESC`;
      
      const inventoryUsed = db.prepare(query).all(...params);
      res.json(inventoryUsed);
    } catch (err) {
      console.error('Error fetching inventory used report:', err);
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
        WHERE s.is_deleted = 0
      `;
      
      const params: any[] = [];
      if (start && end) {
        query += ` AND date(s.fecha) BETWEEN ? AND ?`;
        params.push(start, end);
      } else if (start) {
        query += ` AND date(s.fecha) >= ?`;
        params.push(start);
      } else if (end) {
        query += ` AND date(s.fecha) <= ?`;
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

  // Import/Export
  app.post('/api/import', (req, res) => {
    try {
      const { inventory, products, tables } = req.body;
      
      const invArray = inventory ? (Array.isArray(inventory) ? inventory : Object.values(inventory)) : [];
      const prodArray = products ? (Array.isArray(products) ? products : Object.values(products)) : [];
      const tableArray = tables ? (Array.isArray(tables) ? tables : Object.values(tables)) : [];
      
      const transaction = db.transaction(() => {
        // Clear existing data only if new data is provided
        if (inventory !== undefined) {
          db.prepare('DELETE FROM inventory_items').run();
        }
        if (products !== undefined) {
          db.prepare('DELETE FROM product_components').run(); // Must delete components if products change
          db.prepare('DELETE FROM products').run();
        }
        if (tables !== undefined) {
          db.prepare('DELETE FROM table_links').run();
          db.prepare('DELETE FROM chat_messages').run();
          db.prepare('DELETE FROM playlist').run();
          db.prepare('DELETE FROM tables').run();
        }
        
        // Insert inventory
        if (invArray.length > 0) {
          const invStmt = db.prepare('INSERT INTO inventory_items (id, nombre, contenido_gramos, peso_envase_gramos, modo_stock, stock) VALUES (?, ?, ?, ?, ?, ?)');
          for (const item of invArray as any[]) {
            invStmt.run(item.id || null, item.nombre, item.contenido || item.contenido_gramos || 0, item.peso_envase || item.peso_envase_gramos || 0, item.modo || item.modo_stock || 'UNIDADES', item.stock || 0);
          }
        }
        
        // Insert products and components
        if (prodArray.length > 0) {
          const prodStmt = db.prepare('INSERT INTO products (id, nombre, precio, tipo, imagen_path, activo) VALUES (?, ?, ?, ?, ?, ?)');
          const compStmt = db.prepare('INSERT INTO product_components (product_id, inventory_item_id, cantidad) VALUES (?, ?, ?)');
          
          for (const prod of prodArray as any[]) {
            prodStmt.run(prod.id || null, prod.nombre, prod.precio || 0, prod.tipo || 'OTROS', prod.imagen_path || null, prod.activo !== undefined ? prod.activo : 1);
            if (prod.componentes && Array.isArray(prod.componentes)) {
              for (const comp of prod.componentes) {
                compStmt.run(prod.id, comp.insumo_id, comp.cantidad);
              }
            }
          }
        }

        // Insert tables
        if (tableArray.length > 0) {
          const tableStmt = db.prepare('INSERT INTO tables (id, nombre, color_rgb, rect_x, rect_y, rect_w, rect_h, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
          for (const table of tableArray as any[]) {
            const nombre = table.nombre || table.numero;
            tableStmt.run(table.id || null, nombre, table.color_rgb || table.color || '#ffffff', table.rect_x || table.x || table.grid_x || 0, table.rect_y || table.y || table.grid_y || 0, table.rect_w || table.w || table.grid_w || 120, table.rect_h || table.h || table.grid_h || 80, table.estado || 'LIBRE');
          }
        }
      });
      
      try {
        db.pragma('foreign_keys = OFF');
        transaction();
      } finally {
        db.pragma('foreign_keys = ON');
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error importing data:', err);
      res.status(500).json({ error: err.message || 'Database error during import' });
    }
  });

  // Clear History
  app.post('/api/clear-history', (req, res) => {
    try {
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM sale_items').run();
        db.prepare('DELETE FROM payments').run();
        db.prepare('DELETE FROM sales').run();
        db.prepare('DELETE FROM expenses').run();
        db.prepare('DELETE FROM shifts').run();
      });
      transaction();
      res.json({ success: true });
    } catch (err) {
      console.error('Error clearing history:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Factory Reset
  app.post('/api/factory-reset', (req, res) => {
    try {
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM sale_items').run();
        db.prepare('DELETE FROM payments').run();
        db.prepare('DELETE FROM sales').run();
        db.prepare('DELETE FROM expenses').run();
        db.prepare('DELETE FROM shifts').run();
        db.prepare('DELETE FROM product_components').run();
        db.prepare('DELETE FROM products').run();
        db.prepare('DELETE FROM inventory_items').run();
        db.prepare('DELETE FROM tables').run();
        db.prepare('DELETE FROM table_links').run();
        db.prepare('DELETE FROM chat_messages').run();
        db.prepare('DELETE FROM playlist').run();
        db.prepare('DELETE FROM settings').run();
      });
      transaction();
      res.json({ success: true });
    } catch (err) {
      console.error('Error factory reset:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Export DB
  app.get('/api/export-db', (req, res) => {
    try {
      const dbPath = db.name;
      res.download(dbPath, 'pos_backup.db');
    } catch (err) {
      console.error('Error exporting DB:', err);
      res.status(500).json({ error: 'Error exporting database' });
    }
  });

  // Import DB
  app.post('/api/import-db', express.raw({ type: 'application/octet-stream', limit: '50mb' }), (req, res) => {
    try {
      const dbPath = db.name;
      const fs = require('fs');
      
      // Close the current database connection
      db.close();
      
      // Write the new database file
      fs.writeFileSync(dbPath, req.body);
      
      // Re-open the database connection (this requires restarting the server or re-initializing the db object)
      // For simplicity in this environment, we'll just exit the process and let the process manager restart it
      // Or we can just send a success response and tell the user to restart the app
      res.json({ success: true, message: 'Database imported successfully. Please restart the application.' });
      
      // Optional: exit process to force restart
      setTimeout(() => process.exit(0), 1000);
    } catch (err) {
      console.error('Error importing DB:', err);
      res.status(500).json({ error: 'Error importing database' });
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

    socket.on('join_dj', () => {
      socket.join('dj');
    });

    socket.on('chat_message', (data) => {
      const { tableId, message, fromRole } = data;
      db.prepare('INSERT INTO chat_messages (table_id, message, from_role) VALUES (?, ?, ?)')
        .run(tableId, message, fromRole);
      io.to('dj').emit('new_message', data); // Broadcast to DJ panel
      io.to(`table_${tableId}`).emit('new_message', data); // Broadcast to table
    });

    socket.on('add_playlist', (data) => {
      const { tableId, title, youtubeId, tipo, thumbnail } = data;
      db.prepare('INSERT INTO playlist (table_id, title, youtube_id, tipo, thumbnail) VALUES (?, ?, ?, ?, ?)')
        .run(tableId, title, youtubeId, tipo, thumbnail || null);
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

