require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const pool   = require('../config/database');

async function seed() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error('Falta ADMIN_PASSWORD en .env');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO admins (username, email, password_hash, nombre, rol)
     VALUES ('admin', 'admin@streetplayer.pe', $1, 'Administrador StreetPlayer', 'superadmin')
     ON CONFLICT (username) DO UPDATE SET password_hash = $1`,
    [hash]
  );

  console.log('Admin creado/actualizado correctamente.');
  await pool.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
