const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

module.exports = async () => {
  const apiRoot = path.resolve(__dirname, '../..');
  const prismaDir = path.join(apiRoot, 'prisma');
  const dbPath = path.join(prismaDir, 'test.db');
  const journalPath = path.join(prismaDir, 'test.db-journal');

  for (const filePath of [dbPath, journalPath]) {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  }

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'file:./test.db';
  process.env.JWT_SECRET = 'test-jwt-secret-with-enough-length';

  const prisma = new PrismaClient();
  const migrationSql = fs.readFileSync(
    path.join(prismaDir, 'migrations', '20260428193000_init_messaging', 'migration.sql'),
    'utf8',
  );
  const statements = migrationSql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  try {
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }
  } finally {
    await prisma.$disconnect();
  }
};
