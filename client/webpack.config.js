// webpack.config.js
module.exports = {
  // Other webpack configuration...
  ignoreWarnings: [
    {
      // Ignore warnings about missing source maps in docx-preview package
      module: /docx-preview/,
      message: /Failed to parse source map/,
    },
  ],
};