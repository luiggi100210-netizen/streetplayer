const pool    = require('../config/database');
const bcrypt  = require('bcryptjs');

module.exports = async function seedAdmin() {
  const email    = process.env.ADMIN_EMAIL    || 'admin@streetplayer.com';
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'Admin1234!';

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO admins (email, username, password_hash, activo)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (email) DO UPDATE SET password_hash = $3, activo = true`,
    [email, username, hash]
  );
  console.log(`[Admin] Admin listo: ${email}`);
};
