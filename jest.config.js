module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native-.*|react-native|@react-navigation)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest/setup.js'],
  moduleNameMapper: {
    '\\.ttf$': '<rootDir>/jest/font-mock.js',
    '^@env$': '<rootDir>/jest/env-mock.js',
  },
};
