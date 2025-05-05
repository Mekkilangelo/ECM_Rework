const { defineConfig } = require('vite');
const path = require('path');

module.exports = defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'main.js'),
        preload: path.resolve(__dirname, 'preload.js')
      },
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`
      },
      external: ['electron', 'electron-is-dev', 'fs-extra', 'path', 'child_process']
    }
  }
});