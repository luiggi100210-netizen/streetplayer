const pool    = require('../config/database');
const bcrypt  = require('bcryptjs');

module.exports = async function seedAdmin() {
  const email    = process.env.ADMIN_EMAIL    || 'admin@streetplayer.com';
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'Admin1234!';

  const { rows } = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);
  if (rows.length > 0) return;

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    'INSERT INTO admins (email, username, password_hash) VALUES ($1, $2, $3)',
    [email, username, hash]
  );
  console.log(`[Admin] Usuario admin creado: ${email}`);
};
