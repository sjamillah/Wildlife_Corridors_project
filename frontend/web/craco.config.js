const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // Enable hot module reloading
      if (webpackConfig.mode === 'development') {
        webpackConfig.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
          ignored: /node_modules/,
        };
      }
      return webpackConfig;
    },
  },
  devServer: {
    hot: true,
    liveReload: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: true,
    },
  },
};
