process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'test-jwt-secret-with-enough-length';
process.env.ALLOWED_ORIGINS ??= 'http://localhost:5173';

// Do not override DATABASE_URL if CI already provides a PostgreSQL URL.
const dbUrl = process.env.DATABASE_URL ?? '';
const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
if (!isPostgres) {
  process.env.DATABASE_URL = 'file:./test.db';
}
