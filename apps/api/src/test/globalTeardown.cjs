const fs = require('fs');
const path = require('path');

module.exports = async () => {
  const prismaDir = path.resolve(__dirname, '../../prisma');

  for (const fileName of ['test.db', 'test.db-journal']) {
    const filePath = path.join(prismaDir, fileName);

    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  }
};
