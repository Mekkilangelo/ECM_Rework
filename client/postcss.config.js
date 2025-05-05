module.exports = {
  plugins: {
    autoprefixer: {
      overrideBrowserslist: [
        'last 2 versions',
        '> 1%',
        'not dead'
      ],
      // Ignorer l'avertissement spécifique pour color-adjust
      ignoreWarnings: true,
      remove: false
    }
  }
}