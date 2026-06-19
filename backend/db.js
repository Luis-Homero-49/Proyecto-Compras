require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

const pool = new Pool(poolConfig);

const createTables = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'basic';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS family_owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS alias VARCHAR(100);

    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      max_amount NUMERIC(10, 2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Planificando',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      iva_percent NUMERIC(5, 2) DEFAULT 16.00,
      exchange_rate NUMERIC(15, 6) DEFAULT 1.000000,
      base_currency VARCHAR(10) DEFAULT 'USD',
      local_currency VARCHAR(10) DEFAULT 'VES',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      code VARCHAR(10) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      is_active BOOLEAN DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS subcategories (
      category_code VARCHAR(10) REFERENCES categories(code) ON DELETE CASCADE,
      code VARCHAR(10),
      name VARCHAR(100) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      PRIMARY KEY (category_code, code)
    );

    CREATE TABLE IF NOT EXISTS comercios (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      is_active BOOLEAN DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(30) PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      category_code VARCHAR(10),
      subcategory_code VARCHAR(10),
      name VARCHAR(100) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      upc_code VARCHAR(50),
      presentation VARCHAR(50),
      has_iva BOOLEAN DEFAULT false,
      FOREIGN KEY (category_code, subcategory_code) REFERENCES subcategories(category_code, code) ON DELETE SET NULL
    );
    ALTER TABLE products ADD COLUMN IF NOT EXISTS upc_code VARCHAR(50);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS presentation VARCHAR(50);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS has_iva BOOLEAN DEFAULT false;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS is_suggested BOOLEAN DEFAULT false;

    ALTER TABLE comercios ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE comercios ADD COLUMN IF NOT EXISTS phones JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE comercios ADD COLUMN IF NOT EXISTS emails JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE comercios ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE comercios ADD COLUMN IF NOT EXISTS business_line VARCHAR(100);

    CREATE TABLE IF NOT EXISTS shopping_list_items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      budget_id INTEGER REFERENCES budgets(id) ON DELETE CASCADE,
      product_id VARCHAR(30) REFERENCES products(id) ON DELETE CASCADE,
      is_needed BOOLEAN DEFAULT false,
      is_bought BOOLEAN DEFAULT false,
      estimated_price NUMERIC(10, 2) DEFAULT 0,
      real_price NUMERIC(10, 2) DEFAULT 0,
      estimated_quantity NUMERIC(10, 3) DEFAULT 1,
      real_quantity NUMERIC(10, 3) DEFAULT 1,
      UNIQUE(budget_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product_id VARCHAR(30),
      comercio_id INTEGER REFERENCES comercios(id) ON DELETE SET NULL,
      price NUMERIC(10, 2) NOT NULL,
      bought_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `;

  try {
    await pool.query(queryText);
    console.log('Tablas verificadas/creadas exitosamente.');
    
    // Inicializar datos globales si categories está vacío
    const catCheck = await pool.query('SELECT COUNT(*) FROM categories');
    if (parseInt(catCheck.rows[0].count) === 0) {
      console.log('Inicializando catálogo global...');
      const initData = `
        INSERT INTO categories (code, name) VALUES 
        ('LAC', 'Lácteos'),
        ('CAR', 'Carnes y Aves'),
        ('VER', 'Verduras y Frutas'),
        ('LIM', 'Limpieza'),
        ('GRA', 'Granos y Cereales'),
        ('PAN', 'Panadería');

        INSERT INTO subcategories (category_code, code, name) VALUES
        ('LAC', 'LECH', 'Leche'),
        ('LAC', 'QUES', 'Quesos'),
        ('LAC', 'YOGU', 'Yogurt'),
        ('CAR', 'RES', 'Carne de Res'),
        ('CAR', 'POLL', 'Pollo'),
        ('CAR', 'PESC', 'Pescado'),
        ('VER', 'FRUT', 'Frutas'),
        ('VER', 'VERD', 'Verduras'),
        ('LIM', 'HOG', 'Cuidado del Hogar'),
        ('LIM', 'PER', 'Cuidado Personal'),
        ('GRA', 'ARR', 'Arroz'),
        ('GRA', 'PAS', 'Pastas'),
        ('PAN', 'PAN', 'Pan'),
        ('PAN', 'GAL', 'Galletas');

        INSERT INTO products (id, user_id, category_code, subcategory_code, name) VALUES
        ('LAC-LECH-001', NULL, 'LAC', 'LECH', 'Leche Entera 1L'),
        ('LAC-LECH-002', NULL, 'LAC', 'LECH', 'Leche Descremada 1L'),
        ('LAC-QUES-001', NULL, 'LAC', 'QUES', 'Queso Amarillo'),
        ('LAC-QUES-002', NULL, 'LAC', 'QUES', 'Queso Blanco'),
        ('CAR-POLL-001', NULL, 'CAR', 'POLL', 'Pechuga de Pollo'),
        ('CAR-POLL-002', NULL, 'CAR', 'POLL', 'Muslos de Pollo'),
        ('CAR-RES-001', NULL, 'CAR', 'RES', 'Carne Molida de Res'),
        ('VER-FRUT-001', NULL, 'VER', 'FRUT', 'Manzana'),
        ('VER-FRUT-002', NULL, 'VER', 'FRUT', 'Plátano'),
        ('VER-VERD-001', NULL, 'VER', 'VERD', 'Tomate'),
        ('VER-VERD-002', NULL, 'VER', 'VERD', 'Cebolla'),
        ('LIM-HOG-001', NULL, 'LIM', 'HOG', 'Detergente Líquido'),
        ('LIM-HOG-002', NULL, 'LIM', 'HOG', 'Suavizante'),
        ('GRA-ARR-001', NULL, 'GRA', 'ARR', 'Arroz Blanco 1kg'),
        ('GRA-PAS-001', NULL, 'GRA', 'PAS', 'Pasta Espagueti 500g'),
        ('PAN-PAN-001', NULL, 'PAN', 'PAN', 'Pan de Molde Blanco'),
        ('PAN-GAL-001', NULL, 'PAN', 'GAL', 'Galletas Dulces');
      `;
      await pool.query(initData);
      console.log('Catálogo global inicializado con éxito.');
    }
  } catch (err) {
    console.error('Error creando tablas:', err);
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  createTables
};
