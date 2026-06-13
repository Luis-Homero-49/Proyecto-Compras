require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function drop() {
  await pool.query(`
    DROP TABLE IF EXISTS price_history CASCADE;
    DROP TABLE IF EXISTS shopping_list_items CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS comercios CASCADE;
    DROP TABLE IF EXISTS subcategories CASCADE;
    DROP TABLE IF EXISTS categories CASCADE;
    DROP TABLE IF EXISTS budgets CASCADE;
    DROP TABLE IF EXISTS password_resets CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
  console.log('Tables dropped');
  process.exit(0);
}
drop();
