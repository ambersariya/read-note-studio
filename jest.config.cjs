const nextJest = require('next/jest');

module.exports = nextJest({ dir: './' })({
  testEnvironment: 'jsdom',
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/src/testSetup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/out/'],
});
