const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Configure alias resolution for Metro bundler
// Only add alias property, preserve all other resolver properties
config.resolver.alias = {
  '@': path.resolve(projectRoot, '.'),
  '@components': path.resolve(projectRoot, 'components'),
  '@app': path.resolve(projectRoot, 'app'),
  '@app/hooks': path.resolve(projectRoot, 'app/hooks'),
  '@constants': path.resolve(projectRoot, 'constants'),
  '@contexts': path.resolve(projectRoot, 'contexts'),
  '@hooks': path.resolve(projectRoot, 'hooks'),
  '@services': path.resolve(projectRoot, 'app/services'),
  '@utils': path.resolve(projectRoot, 'app/utils'),
};

// Handle native-only modules for web - use empty module
const originalResolveRequest = config.resolver.resolveRequest;
if (originalResolveRequest) {
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Handle react-native-maps on web (OpenStreetMap provider)
    if (platform === 'web' && moduleName.includes('react-native-maps')) {
      return {
        type: 'empty',
      };
    }
    
    // Use original resolver for everything else
    return originalResolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
