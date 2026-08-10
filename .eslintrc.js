module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // Jest setup files run in the Jest environment (jest, expect, etc.).
      files: ['jest/**/*.js'],
      env: {jest: true},
    },
  ],
};
