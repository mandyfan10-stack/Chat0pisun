module.exports = async () => {
  const dbUrl = process.env.DATABASE_URL ?? '';
  const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');

  // Only clean up SQLite files; PostgreSQL is managed externally
  if (!isPostgres) {
    const fs = require('fs');
    const path = require('path');
    const prismaDir = path.resolve(__dirname, '../../prisma');

    for (const name of ['test.db', 'test.db-journal']) {
      const filePath = path.join(prismaDir, name);
      if (fs.existsSync(filePath)) fs.rmSync(filePath, { force: true });
    }
  }
};
