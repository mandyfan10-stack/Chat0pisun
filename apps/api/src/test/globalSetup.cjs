const { PrismaClient } = require('@prisma/client');

module.exports = async () => {
  // Allow CI/environment to supply DATABASE_URL (PostgreSQL).
  // Fall back to local SQLite only when no postgres URL is provided.
  const dbUrl = process.env.DATABASE_URL ?? '';
  const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');

  if (!isPostgres) {
    const fs = require('fs');
    const path = require('path');
    const apiRoot = path.resolve(__dirname, '../..');
    const prismaDir = path.join(apiRoot, 'prisma');

    // Clean up stale SQLite files from previous runs
    for (const name of ['test.db', 'test.db-journal']) {
      const filePath = path.join(prismaDir, name);
      if (fs.existsSync(filePath)) fs.rmSync(filePath, { force: true });
    }

    process.env.DATABASE_URL = 'file:./test.db';

    // Apply migrations manually for SQLite local dev
    const prisma = new PrismaClient();
    const migrationSql = fs.readFileSync(
      path.join(prismaDir, 'migrations', '20260509103347_init', 'migration.sql'),
      'utf8',
    );
    const statements = migrationSql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      for (const statement of statements) {
        await prisma.$executeRawUnsafe(statement);
      }
    } finally {
      await prisma.$disconnect();
    }
  }

  process.env.NODE_ENV = 'test';
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret-with-enough-length';
  }
};
