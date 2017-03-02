var fs = require('fs')
var path = require('path')
var webpack = require('webpack')

var mainDir = path.join(__dirname, './main')
var injectiotnsModules = path.join(mainDir, 'injections/scripts/web_modules')

var resolve = {
  alias: {},
  extensions: ['', '.js']
}
fs.readdirSync(injectiotnsModules)
  .reduce(function (alias, dir) {
    var dir = path.join(injectiotnsModules, dir)
    if (fs.statSync(dir).isDirectory()) {
      fs.readdirSync(dir).forEach(function (file) {
        alias[path.basename(file, '.js')] = path.join(dir, file)
      })
    }
    return alias
  }, resolve.alias)

module.exports = {
  devtool: 'inline-source-map',

  entry: {
    'background': __dirname + '/main/background.js',
    '/injections/scripts/launcher': __dirname + '/main/injections/scripts/launcher.js',
  },

  output: {
    path: __dirname + '/bundle',
    filename: '[name].js',
    publicPath: '/bundle/'
  },

  resolve: resolve,

  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new webpack.ProvidePlugin({
      $: "jquery"
    })
  ]
}