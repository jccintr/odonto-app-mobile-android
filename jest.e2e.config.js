// Ponta a ponta: o app inteiro (React Native em teste) falando com a API REAL e um PostgreSQL embutido (api/src/scripts/demo-server.js).
// Pré-requisito: `npm install` na pasta da API. E2E_API_DIR muda onde a API está (padrão ../api).
const base = require('./jest.config');

module.exports = {
  ...base,
  testMatch: ['<rootDir>/tests/e2e/**/*.test.{js,jsx}'],
  globalSetup: '<rootDir>/tests/e2e/globalSetup.js',
  globalTeardown: '<rootDir>/tests/e2e/globalTeardown.js',
  setupFiles: ['<rootDir>/tests/setup.js', '<rootDir>/tests/e2e/setup.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/after.js'],
  collectCoverageFrom: undefined,
  coverageThreshold: undefined,
  testTimeout: 40000,
  maxWorkers: 1,
};
