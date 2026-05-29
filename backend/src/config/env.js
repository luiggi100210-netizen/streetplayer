/**
 * Validates required environment variables at startup.
 * Call this before any other module that depends on env vars.
 * Process exits with code 1 if any required variable is missing.
 */
const REQUIRED = [
  { key: 'DATABASE_URL', hint: 'PostgreSQL connection string, e.g. postgres://user:pass@host/db' },
  { key: 'JWT_SECRET',   hint: 'Random secret for signing access tokens (min 32 chars recommended)' },
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
