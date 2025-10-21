const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Handle Mapbox for web - use empty module
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName.includes('@rnmapbox/maps')) {
    return {
      type: 'empty',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
