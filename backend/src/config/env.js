/**
 * Validates required environment variables at startup.
 * Call this before any other module that depends on env vars.
 * Process exits with code 1 if any required variable is missing.
 */
const REQUIRED = [
  { key: 'DATABASE_URL', hint: 'PostgreSQL connection string, e.g. postgres://user:pass@host/db' },
  { key: 'JWT_SECRET',   hint: 'Random secret for signing access tokens (min 32 chars recommended)' },
  ...(process.env.NODE_ENV === 'production' ? [
    { key: 'ADMIN_PASSWORD',  hint: 'Admin panel password — the dev default must never reach production' },
    { key: 'ALLOWED_ORIGINS', hint: 'Comma-separated CORS origins, e.g. https://app.midominio.com' },
  ] : []),
];

const missing = REQUIRED.filter(({ key }) => !process.env[key]);

if (missing.length > 0) {
  console.error('\n[startup] Missing required environment variables:\n');
  missing.forEach(({ key, hint }) => {
    console.error(`  ✗ ${key}`);
    console.error(`      ${hint}\n`);
  });
  process.exit(1);
}
