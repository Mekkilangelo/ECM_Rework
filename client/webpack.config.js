// webpack.config.js
const webpack = require('webpack');

module.exports = {
  // Other webpack configuration...
  resolve: {
    fallback: {
      buffer: require.resolve('buffer/'),
      stream: require.resolve('stream-browserify'),
      zlib: require.resolve('browserify-zlib'),
      util: require.resolve('util/'),
      assert: require.resolve('assert/')
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ],
  ignoreWarnings: [
    {
      // Ignore warnings about missing source maps in docx-preview package
      module: /docx-preview/,
      message: /Failed to parse source map/,
    },
  ],
};