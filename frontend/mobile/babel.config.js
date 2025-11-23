const path = require('path');

// Get the directory of this config file
// In Babel config files, process.cwd() is the project root where the config is located
const projectRoot = process.cwd();

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        require.resolve('babel-plugin-module-resolver'),
        {
          root: [projectRoot],
          alias: {
            '@': projectRoot,
            '@components': path.resolve(projectRoot, 'components'),
            '@app': path.resolve(projectRoot, 'app'),
            '@app/hooks': path.resolve(projectRoot, 'app/hooks'),
            '@constants': path.resolve(projectRoot, 'constants'),
            '@contexts': path.resolve(projectRoot, 'contexts'),
            '@hooks': path.resolve(projectRoot, 'hooks'),
            '@services': path.resolve(projectRoot, 'app/services'),
            '@utils': path.resolve(projectRoot, 'app/utils'),
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin', // Must be last plugin for Expo Go compatibility
    ],
  };
};