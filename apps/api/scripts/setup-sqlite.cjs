const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL ||= 'file:./dev.db';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const applyMigration = async () => {
  const migrationPath = path.resolve(
    __dirname,
    '../prisma/migrations/20260428193000_init_messaging/migration.sql',
  );
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  const statements = migrationSql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
};

const main = async () => {
  try {
    await prisma.user.findFirst({ select: { id: true } });
    console.log('SQLite database is already initialized.');
  } catch {
    await applyMigration();
    console.log('SQLite database initialized from migration SQL.');
  }
};

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
