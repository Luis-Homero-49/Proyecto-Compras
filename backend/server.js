require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Crear tablas si no existen
db.createTables();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_in_production';

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// --- AUTH ENDPOINTS ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const { rows } = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role',
      [email, hash]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El email ya está en uso' });
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
    
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (rows[0].is_active === false) return res.status(401).json({ error: 'Cuenta desactivada. Contacte al administrador.' });
    
    const token = jwt.sign({ id: rows[0].id, email: rows[0].email, role: rows[0].role, plan_type: rows[0].plan_type, family_owner_id: rows[0].family_owner_id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: rows[0].id, email: rows[0].email, role: rows[0].role, plan_type: rows[0].plan_type, family_owner_id: rows[0].family_owner_id } });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  try {
    const { rows } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      // Por seguridad, devolver éxito aunque no exista
      return res.json({ message: 'Si el correo existe, se enviará un enlace de recuperación.' });
    }
    const userId = rows[0].id;
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora
    
    await db.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, resetToken, expiresAt]
    );
    
    console.log(`\n\n================================`);
    console.log(`CORREO SIMULADO PARA: ${email}`);
    console.log(`Tu token de recuperación es: ${resetToken}`);
    console.log(`================================\n\n`);

    res.json({ message: 'Si el correo existe, se enviará un enlace de recuperación.' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token y nueva contraseña requeridos' });
  try {
    const { rows } = await db.query('SELECT user_id FROM password_resets WHERE token = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1', [token]);
    if (rows.length === 0) return res.status(400).json({ error: 'Token inválido o expirado' });
    
    const userId = rows[0].user_id;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
    await db.query('DELETE FROM password_resets WHERE user_id = $1', [userId]); // Cleanup
    
    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// --- PROTECT ALL OTHER ENDPOINTS ---
app.use('/api', authenticateToken);

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Acceso denegado: Se requiere rol de Administrador.' });
  }
};

const isEditorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'editor')) {
    next();
  } else {
    res.status(403).json({ error: 'Acceso denegado: Se requiere rol de Editor o Administrador.' });
  }
};

// --- ENDPOINTS PARA USUARIOS ---
app.get('/api/users', isAdmin, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, email, role, is_active, created_at, plan_type, family_owner_id FROM users ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users', isAdmin, async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'Faltan datos' });
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const { rows } = await db.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, is_active, created_at',
      [email, hash, role]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El email ya está en uso' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/:id/role', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['admin', 'editor', 'user'].includes(role)) return res.status(400).json({ error: 'Rol inválido' });
  
  try {
    const { rows } = await db.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role, is_active', [role, id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/:id/active', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  try {
    const { rows } = await db.query('UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, email, role, is_active', [is_active, id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/users/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ENDPOINTS PARA LISTAS/PRESUPUESTOS ---
app.get('/api/budgets', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM budgets WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/budgets', async (req, res) => {
  const { name, max_amount } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO budgets (user_id, name, max_amount) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, name, max_amount || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/budgets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM budgets WHERE user_id = $1 AND id = $2', [req.user.id, id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ENDPOINTS PARA CATEGORÍAS (GLOBALES) ---
app.get('/api/categories', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/categories', isEditorOrAdmin, async (req, res) => {
  const { code, name } = req.body;
  try {
    const { rows } = await db.query('INSERT INTO categories (code, name) VALUES ($1, $2) RETURNING *', [code, name]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/categories/:code', isEditorOrAdmin, async (req, res) => {
  const { code } = req.params;
  const { name, is_active } = req.body;
  try {
    const { rows } = await db.query('UPDATE categories SET name = COALESCE($1, name), is_active = COALESCE($2, is_active) WHERE code = $3 RETURNING *', [name, is_active, code]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/categories/:code', isEditorOrAdmin, async (req, res) => {
  const { code } = req.params;
  try {
    await db.query('DELETE FROM categories WHERE code = $1', [code]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ENDPOINTS PARA SUBCATEGORÍAS (GLOBALES) ---
app.get('/api/subcategories', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM subcategories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/subcategories', isEditorOrAdmin, async (req, res) => {
  const { category_code, code, name } = req.body;
  try {
    const { rows } = await db.query('INSERT INTO subcategories (category_code, code, name) VALUES ($1, $2, $3) RETURNING *', [category_code, code, name]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/subcategories/:category_code/:code', isEditorOrAdmin, async (req, res) => {
  const { category_code, code } = req.params;
  const { name, is_active } = req.body;
  try {
    const { rows } = await db.query('UPDATE subcategories SET name = COALESCE($1, name), is_active = COALESCE($2, is_active) WHERE category_code = $3 AND code = $4 RETURNING *', [name, is_active, category_code, code]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/subcategories/:category_code/:code', isEditorOrAdmin, async (req, res) => {
  const { category_code, code } = req.params;
  try {
    await db.query('DELETE FROM subcategories WHERE category_code = $1 AND code = $2', [category_code, code]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ENDPOINTS PARA COMERCIOS ---
app.get('/api/comercios', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM comercios WHERE user_id = $1 ORDER BY name ASC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/comercios', async (req, res) => {
  const { name, address, phones, emails, social_media } = req.body;
  try {
    const pPhones = phones ? JSON.stringify(phones) : '[]';
    const pEmails = emails ? JSON.stringify(emails) : '[]';
    const pSocialMedia = social_media ? JSON.stringify(social_media) : '[]';

    const { rows } = await db.query(
      'INSERT INTO comercios (user_id, name, address, phones, emails, social_media) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, name, address || null, pPhones, pEmails, pSocialMedia]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/comercios/:id', async (req, res) => {
  const { id } = req.params;
  const { name, is_active, address, phones, emails, social_media } = req.body;
  
  const pAddress = address !== undefined ? address : null;
  const pPhones = phones !== undefined ? JSON.stringify(phones) : null;
  const pEmails = emails !== undefined ? JSON.stringify(emails) : null;
  const pSocialMedia = social_media !== undefined ? JSON.stringify(social_media) : null;

  try {
    const { rows } = await db.query(
      `UPDATE comercios 
       SET name = COALESCE($1, name), 
           is_active = COALESCE($2, is_active),
           address = COALESCE($3, address),
           phones = COALESCE($4, phones),
           emails = COALESCE($5, emails),
           social_media = COALESCE($6, social_media)
       WHERE user_id = $7 AND id = $8 RETURNING *`,
      [name, is_active, pAddress, pPhones, pEmails, pSocialMedia, req.user.id, id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/comercios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM comercios WHERE user_id = $1 AND id = $2', [req.user.id, id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ENDPOINTS PARA PRODUCTOS ---
// Endpoint para obtener catálogo de productos
app.get('/api/products', async (req, res) => {
  try {
    const ownerId = req.user.family_owner_id || req.user.id;
    const { rows } = await db.query(`
      SELECT p.*, c.name as category_name, s.name as subcategory_name 
      FROM products p
      LEFT JOIN categories c ON p.category_code = c.code
      LEFT JOIN subcategories s ON p.subcategory_code = s.code AND p.category_code = s.category_code
      WHERE (
        p.user_id IS NULL OR 
        p.user_id IN (SELECT id FROM users WHERE family_owner_id = $1 OR id = $1)
      ) AND p.is_active = true
      ORDER BY p.name ASC
    `, [ownerId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Endpoint para crear producto
app.post('/api/products', async (req, res) => {
  const { name, category_code, subcategory_code, upc_code, presentation, has_iva, isGlobal, suggestForGlobal } = req.body;
  try {
    const productId = `${category_code}-${subcategory_code}-${Date.now().toString().slice(-4)}`;
    const { rows } = await db.query(`
      INSERT INTO products (id, user_id, category_code, subcategory_code, name, upc_code, presentation, has_iva, is_suggested)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [productId, isGlobal ? null : req.user.id, category_code, subcategory_code, name, upc_code, presentation, has_iva || false, suggestForGlobal || false]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, is_active, upc_code, presentation } = req.body;
  const isGlobal = !id.startsWith('USR-');
  try {
    if (isGlobal && req.user.role !== 'admin' && req.user.role !== 'editor') {
       return res.status(403).json({ error: 'No autorizado a modificar productos globales' });
    }
    
    let rows;
    if (isGlobal) {
      const result = await db.query('UPDATE products SET name = COALESCE($1, name), is_active = COALESCE($2, is_active), upc_code = COALESCE($3, upc_code), presentation = COALESCE($4, presentation) WHERE id = $5 RETURNING *', [name, is_active, upc_code, presentation, id]);
      rows = result.rows;
    } else {
      const result = await db.query('UPDATE products SET name = COALESCE($1, name), is_active = COALESCE($2, is_active), upc_code = COALESCE($3, upc_code), presentation = COALESCE($4, presentation) WHERE user_id = $5 AND id = $6 RETURNING *', [name, is_active, upc_code, presentation, req.user.id, id]);
      rows = result.rows;
    }
    
    if(rows.length === 0) return res.status(404).json({error: 'Producto no existe'});
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const isGlobal = !id.startsWith('USR-');
  try {
    if (isGlobal && req.user.role !== 'admin' && req.user.role !== 'editor') {
       return res.status(403).json({ error: 'No autorizado a eliminar productos globales' });
    }
    
    let rowCount;
    if (isGlobal) {
      const result = await db.query('DELETE FROM products WHERE id = $1', [id]);
      rowCount = result.rowCount;
    } else {
      const result = await db.query('DELETE FROM products WHERE user_id = $1 AND id = $2', [req.user.id, id]);
      rowCount = result.rowCount;
    }
    
    if(rowCount === 0) return res.status(404).json({error: 'Producto no existe'});
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ENDPOINTS DE MODERACION (Sugerencias de Productos) ---
app.get('/api/products/suggestions', isAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, c.name as category_name, s.name as subcategory_name, u.email as suggested_by
      FROM products p
      LEFT JOIN categories c ON p.category_code = c.code
      LEFT JOIN subcategories s ON p.subcategory_code = s.code AND p.category_code = s.category_code
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.is_suggested = true AND p.user_id IS NOT NULL
      ORDER BY p.name ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/products/suggestions/:id/approve', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('UPDATE products SET is_suggested = false, user_id = NULL WHERE id = $1 RETURNING *', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/products/suggestions/:id/reject', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('UPDATE products SET is_suggested = false WHERE id = $1 RETURNING *', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ENDPOINTS PARA FAMILIA ---
app.get('/api/family', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, email, is_active, created_at FROM users WHERE family_owner_id = $1 ORDER BY id ASC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/family', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Faltan datos' });
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const { rows } = await db.query(
      'INSERT INTO users (email, password_hash, role, plan_type, family_owner_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, is_active',
      [email, hash, 'user', 'basic', req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El email ya está en uso' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/family/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM users WHERE id = $1 AND family_owner_id = $2', [id, req.user.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado o no pertenece a tu familia' });
    res.json({ message: 'Familiar eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/api/products/upc/:upc', async (req, res) => {
  const { upc } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT p.*, s.name as subcategory_name, c.name as category_name
      FROM products p
      LEFT JOIN subcategories s ON p.subcategory_code = s.code AND p.category_code = s.category_code
      LEFT JOIN categories c ON s.category_code = c.code
      WHERE p.upc_code = $1 AND (p.user_id IS NULL OR p.user_id = $2) AND p.is_active = true
      LIMIT 1
    `, [upc, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/external-upc/:upc', async (req, res) => {
  const { upc } = req.params;
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${upc}.json`);
    const data = await response.json();
    
    if (data.status === 1 && data.product && data.product.product_name) {
      res.json({ name: data.product.product_name });
    } else {
      res.status(404).json({ error: 'Producto no encontrado en base externa' });
    }
  } catch (err) {
    console.error('Error fetching external UPC:', err);
    res.status(500).json({ error: 'Error consultando servicio externo' });
  }
});

// ==========================================
// User Settings
// ==========================================

app.get('/api/settings', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM user_settings WHERE user_id = $1', [req.user.id]);
    if (rows.length === 0) {
      // Create defaults
      const insert = await db.query(`
        INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *
      `, [req.user.id]);
      return res.json(insert.rows[0]);
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/settings', async (req, res) => {
  const { iva_percent, exchange_rate, base_currency, local_currency } = req.body;
  try {
    const { rows } = await db.query(`
      INSERT INTO user_settings (user_id, iva_percent, exchange_rate, base_currency, local_currency, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        iva_percent = EXCLUDED.iva_percent,
        exchange_rate = EXCLUDED.exchange_rate,
        base_currency = EXCLUDED.base_currency,
        local_currency = EXCLUDED.local_currency,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [req.user.id, iva_percent, exchange_rate, base_currency, local_currency]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// Compras & Listas (Shopping List)
// ==========================================

// Endpoint para obtener la lista de compras activa o en proceso de un presupuesto
app.get('/api/shopping-list/:budgetId', async (req, res) => {
  const { budgetId } = req.params;
  try {
    const { rows } = await db.query(`
      SELECT sli.*, p.name, p.upc_code, p.presentation, p.category_code, p.subcategory_code, p.has_iva 
      FROM shopping_list_items sli
      JOIN products p ON sli.product_id = p.id
      WHERE sli.user_id = $1 AND sli.budget_id = $2
      ORDER BY p.category_code, p.name ASC
    `, [req.user.id, budgetId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Endpoint para actualizar o insertar un item en la lista de compras del presupuesto
app.put('/api/shopping-list/:budgetId/:productId', async (req, res) => {
  const { budgetId, productId } = req.params;
  const { is_needed, is_bought, estimated_price, real_price, estimated_quantity, real_quantity, comercio_id } = req.body;
  try {
    const { rows } = await db.query(`
      INSERT INTO shopping_list_items (user_id, budget_id, product_id, is_needed, is_bought, estimated_price, real_price, estimated_quantity, real_quantity)
      VALUES ($1, $2, $3, COALESCE($4, false), COALESCE($5, false), COALESCE($6::numeric, 0), COALESCE($7::numeric, 0), COALESCE($8::numeric, 1), COALESCE($9::numeric, 1))
      ON CONFLICT (budget_id, product_id) 
      DO UPDATE SET 
        is_needed = COALESCE($4, shopping_list_items.is_needed),
        is_bought = COALESCE($5, shopping_list_items.is_bought),
        estimated_price = COALESCE($6::numeric, shopping_list_items.estimated_price),
        real_price = COALESCE($7::numeric, shopping_list_items.real_price),
        estimated_quantity = COALESCE($8::numeric, shopping_list_items.estimated_quantity),
        real_quantity = COALESCE($9::numeric, shopping_list_items.real_quantity)
      RETURNING *
    `, [req.user.id, budgetId, productId, is_needed, is_bought, estimated_price, real_price, estimated_quantity, real_quantity]);

    // Ya no registramos en el historial acá individualmente si marcamos como comprado.
    // Lo haremos en lote en el checkout final. O podemos dejarlo por si acaso.
    // Para no duplicar historial, lo quitamos de acá y lo pasamos al checkout.

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/checkout/:budgetId', async (req, res) => {
  const { budgetId } = req.params;
  const { comercio_id } = req.body; // El comercio global donde se hizo la compra de este lote
  
  try {
    // 1. Insertar todos los comprados al historial (usando su real_price)
    if (comercio_id) {
      await db.query(`
        INSERT INTO price_history (user_id, product_id, comercio_id, price)
        SELECT user_id, product_id, $1, real_price 
        FROM shopping_list_items 
        WHERE user_id = $2 AND budget_id = $3 AND is_bought = true
      `, [comercio_id, req.user.id, budgetId]);
    } else {
      await db.query(`
        INSERT INTO price_history (user_id, product_id, price)
        SELECT user_id, product_id, real_price 
        FROM shopping_list_items 
        WHERE user_id = $1 AND budget_id = $2 AND is_bought = true
      `, [req.user.id, budgetId]);
    }
    
    // 2. Eliminar de la lista de compras los artículos ya adquiridos
    await db.query(`
      DELETE FROM shopping_list_items 
      WHERE user_id = $1 AND budget_id = $2 AND is_bought = true
    `, [req.user.id, budgetId]);
    
    res.json({ message: 'Checkout successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ENDPOINTS PARA HISTORIAL ---
app.get('/api/price_history/suggest', async (req, res) => {
  const { product_id } = req.query;
  if (!product_id) return res.json(null);
  
  try {
    const { rows } = await db.query(
      'SELECT price FROM price_history WHERE user_id = $1 AND product_id = $2 ORDER BY bought_at DESC LIMIT 1',
      [req.user.id, product_id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- CONFIGURACION DE PRODUCCION (RAILWAY) ---
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
