module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/test/**/*.test.ts'],
  setupFiles: ['<rootDir>/src/test/setup.ts'],
  globalSetup: '<rootDir>/src/test/globalSetup.cjs',
  globalTeardown: '<rootDir>/src/test/globalTeardown.cjs',
  clearMocks: true,
  maxWorkers: 1,
};
