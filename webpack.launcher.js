module.exports = {
  entry: './main/injections/scripts/launcher',
  output: {
    filename: './build/injections/scripts/launcher.js'
  },
  resolve: {
    extensions: ['.js'],
    modulesDirectories: [
      './modules',
      './modules/cmp.0.assist',
      './modules/cmp.1.panel',
      './modules/cmp.2.base',
      './modules/cmp.3.cart',
      './modules/cmp.4.rush',
      './modules/cmp.5.order',
    ]
  }
}
