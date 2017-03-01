var webpack = require('webpack')

module.exports = {
  entry: {
    'background': __dirname + '/main/background.js',
    '/injections/scripts/launcher': __dirname + '/main/injections/scripts/launcher.js',
  },

  output: {
    path: __dirname + '/bundle',
    filename: '[name].js',
    publicPath: '/bundle/'
  },

  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery"
    })
  ]
}
