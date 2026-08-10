// Jest sets NODE_ENV=test. In tests we skip react-native-dotenv so that `@env`
// stays a real import Jest can resolve to a mock (jest/env-mock.js) — this keeps
// the test suite (and CI) working without a real .env file. Metro dev and
// release builds still inline `@env` from .env via the plugin below.
const isTest = process.env.NODE_ENV === 'test';

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    ...(isTest
      ? []
      : [
          [
            'module:react-native-dotenv',
            {
              moduleName: '@env',
              path: '.env',
            },
          ],
        ]),
  ],
};
