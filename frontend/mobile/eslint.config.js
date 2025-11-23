// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', 'android/*', 'ios/*', '.expo/*'],
  },
  {
    rules: {
      // Disable import/no-unresolved for alias paths - handled by Babel/Metro
      'import/no-unresolved': 'off',
    },
  },
]);
