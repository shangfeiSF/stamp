var webpack = require('webpack')

module.exports = {
  entry: './main/background.webpack.js',
  output: {
    filename: './build/background.js'
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery"
    })
  ]
}
