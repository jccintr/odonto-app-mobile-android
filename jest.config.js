module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/unit/**/*.test.{js,jsx}'],
  transformIgnorePatterns: ['node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|lucide-react-native|react-native-svg))'],
  // o Jest não transforma .mjs: usa a versão CommonJS dos ícones
  moduleNameMapper: { '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js' },
  collectCoverageFrom: ['src/lib/**/*.js', 'src/api/**/*.js'],
  coverageReporters: ['text'],
  coverageThreshold: { global: { statements: 100, branches: 100, functions: 100, lines: 100 } },
};
